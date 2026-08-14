import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIRST_NAMES = [
  "Алексей", "Мария", "Дмитрий", "Елена", "Игорь", "Ольга", "Сергей", "Анна",
  "Николай", "Татьяна", "Павел", "Наталья", "Андрей", "Екатерина", "Михаил",
];

const LAST_NAMES = [
  "Иванов", "Петрова", "Сидоров", "Козлова", "Новиков", "Морозова", "Волков",
  "Соколова", "Лебедев", "Кузнецова", "Попов", "Смирнова", "Фёдоров", "Орлова",
];

const LPR_TITLES = [
  { title: "CEO", slug: "ceo", isDecisionMaker: true },
  { title: "HR-директор", slug: "hr", isDecisionMaker: true },
  { title: "Директор по маркетингу", slug: "marketing", isDecisionMaker: true },
  { title: "Менеджер по продажам", slug: "sales", isDecisionMaker: false },
];

const GENERIC_EMAILS = ["info", "sales", "contact"];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function domainFromWebsite(website: string | null, companyId: number): string {
  if (website) {
    try {
      return new URL(website).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return `company-${companyId}.ru`;
}

function emailLocalPart(slug: string, firstName: string, lastName: string): string {
  if (slug === "ceo") return "ceo";
  if (slug === "hr") return "hr";
  if (slug === "marketing") return "marketing";
  if (slug === "sales") return `${firstName.toLowerCase().slice(0, 1)}.${lastName.toLowerCase()}`;
  return slug;
}

function pseudoRandom(seed: number): number {
  return ((seed * 1103515245 + 12345) >>> 0) % 1000;
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows: companies } = await client.query<{
      id: number;
      name: string;
      website: string | null;
      phone: string | null;
    }>(`SELECT id, name, website, phone FROM companies ORDER BY id`);

    await client.query("DELETE FROM contacts WHERE source = 'mock'");

    let inserted = 0;

    for (const company of companies) {
      const seed = company.id;
      const domain = domainFromWebsite(company.website, company.id);
      const contactCount = pseudoRandom(seed) % 3 === 0 ? 1 : pseudoRandom(seed + 1) % 2 === 0 ? 2 : 3;

      const titlesToAdd = LPR_TITLES.slice(0, contactCount);

      for (let i = 0; i < titlesToAdd.length; i++) {
        const role = titlesToAdd[i];
        const firstName = pick(FIRST_NAMES, seed + i * 7);
        const lastName = pick(LAST_NAMES, seed + i * 13);
        const useGeneric = i === titlesToAdd.length - 1 && pseudoRandom(seed + i) % 5 === 0;
        const local = useGeneric
          ? pick(GENERIC_EMAILS, seed + i)
          : emailLocalPart(role.slug, firstName, lastName);
        const email = `${local}@${domain}`;
        const phone =
          company.phone && pseudoRandom(seed + i * 3) % 2 === 0 ? company.phone : null;

        await client.query(
          `INSERT INTO contacts
             (company_id, first_name, last_name, title, email, phone, is_decision_maker, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'mock')`,
          [
            company.id,
            firstName,
            lastName,
            role.title,
            email,
            phone,
            role.isDecisionMaker && !useGeneric,
          ]
        );
        inserted++;
      }
    }

    const { rows: stats } = await client.query<{ total: string; lpr: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE is_decision_maker)::text AS lpr
       FROM contacts`
    );

    console.log(`Inserted ${inserted} mock contacts`);
    console.log(`Total contacts: ${stats[0].total}, decision makers: ${stats[0].lpr}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
