import { config } from "dotenv";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, "../data_pack/review.csv");

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query("TRUNCATE reviews RESTART IDENTITY");

  const content = await readFile(CSV_PATH, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  let readCount = 0;
  let insertedCount = 0;
  let emptyRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    readCount++;

    const [external_id, name, category, city, address, rating, reviews_count, website, phone] =
      fields;

    if (!external_id?.trim() && !name?.trim()) {
      emptyRows++;
      continue;
    }

    await pool.query(
      `INSERT INTO reviews (external_id, name, category, city, address, rating, reviews_count, website, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        external_id?.trim() || null,
        name?.trim() || null,
        category?.trim() || null,
        city?.trim() || null,
        address?.trim() || null,
        rating?.trim() || null,
        reviews_count?.trim() || null,
        website?.trim() || null,
        phone?.trim() || null,
      ]
    );
    insertedCount++;
  }

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM reviews");
  console.log("\n--- Статистика загрузки review.csv ---");
  console.log(`Строк прочитано (без заголовка): ${readCount}`);
  console.log(`Вставлено:                      ${insertedCount}`);
  console.log(`Пустых строк пропущено:         ${emptyRows}`);
  console.log(`Всего в БД (COUNT):             ${rows[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
