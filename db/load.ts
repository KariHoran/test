import { config } from "dotenv";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PACK = path.resolve(__dirname, "../data_pack");

interface RawCompany {
  id?: string;
  name?: string;
  category?: string;
  city?: string;
  address?: string;
  rating?: number | null;
  reviews_count?: number | null;
  site?: string | null;
  phone?: string | null;
}

interface NormalizedCompany {
  external_id: string | null;
  name: string;
  category: string | null;
  city: string | null;
  address: string | null;
  rating: number | null;
  reviews_count: number;
  website: string | null;
  phone: string | null;
  missingFields: string[];
}

function trim(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function normalizeWebsite(site: string | null): string | null {
  if (!site) return null;
  let url = site.trim().toLowerCase();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url.replace(/\/+$/, "");
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length === 10) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }
  return phone.trim();
}

function normalizeRating(rating: unknown): number | null {
  if (rating == null) return null;
  const n = typeof rating === "number" ? rating : parseFloat(String(rating).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

function normalizeCompany(raw: RawCompany): NormalizedCompany | null {
  const name = trim(raw.name);
  if (!name) return null;

  const missingFields: string[] = [];
  const category = trim(raw.category);
  const city = trim(raw.city);
  const address = trim(raw.address);
  const website = normalizeWebsite(trim(raw.site));
  const phone = normalizePhone(trim(raw.phone));

  if (!category) missingFields.push("category");
  if (!city) missingFields.push("city");
  if (!address) missingFields.push("address");
  if (raw.rating == null) missingFields.push("rating");
  if (!website) missingFields.push("website");
  if (!phone) missingFields.push("phone");

  return {
    external_id: trim(raw.id),
    name,
    category,
    city,
    address,
    rating: normalizeRating(raw.rating),
    reviews_count: Number.isFinite(Number(raw.reviews_count)) ? Number(raw.reviews_count) : 0,
    website,
    phone,
    missingFields,
  };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const files = (await readdir(DATA_PACK))
    .filter((f) => /^page_\d+\.json$/.test(f))
    .sort();

  let readCount = 0;
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedInvalid = 0;
  let withMissingFields = 0;

  // Upsert by external_id (stable key from JSON). DO UPDATE — повторный запуск
  // обновляет данные из источника; DO NOTHING оставил бы устаревшие значения.
  const upsertByExternalId = `
    INSERT INTO companies (external_id, name, category, city, address, rating, reviews_count, website, phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (external_id) DO UPDATE SET
      name          = EXCLUDED.name,
      category      = EXCLUDED.category,
      city          = EXCLUDED.city,
      address       = EXCLUDED.address,
      rating        = EXCLUDED.rating,
      reviews_count = EXCLUDED.reviews_count,
      website       = EXCLUDED.website,
      phone         = EXCLUDED.phone
    RETURNING (xmax = 0) AS is_insert`;

  // Fallback when external_id is missing — dedup by natural key (name, address)
  const upsertByNameAddress = `
    INSERT INTO companies (external_id, name, category, city, address, rating, reviews_count, website, phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (name, address) DO UPDATE SET
      category      = EXCLUDED.category,
      city          = EXCLUDED.city,
      rating        = EXCLUDED.rating,
      reviews_count = EXCLUDED.reviews_count,
      website       = EXCLUDED.website,
      phone         = EXCLUDED.phone
    RETURNING (xmax = 0) AS is_insert`;

  for (const file of files) {
    const content = await readFile(path.join(DATA_PACK, file), "utf-8");
    const data = JSON.parse(content) as { items: RawCompany[] };

    if (readCount === 0 && data.items.length > 0) {
      console.log("Пример одной записи из JSON:");
      console.log(JSON.stringify(data.items[0], null, 2));
    }

    for (const raw of data.items) {
      readCount++;
      const company = normalizeCompany(raw);
      if (!company) {
        skippedInvalid++;
        continue;
      }

      if (company.missingFields.length > 0) withMissingFields++;

      const sql = company.external_id ? upsertByExternalId : upsertByNameAddress;
      const result = await pool.query(sql, [
        company.external_id,
        company.name,
        company.category,
        company.city,
        company.address,
        company.rating,
        company.reviews_count,
        company.website,
        company.phone,
      ]);

      if (result.rows[0]?.is_insert) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }
  }

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM companies");
  console.log("\n--- Статистика загрузки ---");
  console.log(`Прочитано записей:        ${readCount}`);
  console.log(`Вставлено:                ${insertedCount}`);
  console.log(`Обновлено (дубли):       ${updatedCount}`);
  console.log(`Пропущено (нет name):     ${skippedInvalid}`);
  console.log(`С пропущенными полями:    ${withMissingFields}`);
  console.log(`Всего в БД (COUNT):       ${rows[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
