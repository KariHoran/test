import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const GENERIC_LOCALS = new Set(["info", "sales", "contact", "office", "support", "hello", "admin", "mail"]);

function validateEmail(email: string | null): string {
  if (!email?.trim()) return "unknown";
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed)) return "invalid";
  const local = trimmed.split("@")[0]?.toLowerCase() ?? "";
  if (GENERIC_LOCALS.has(local)) return "invalid";
  return "valid";
}

function validatePhone(phone: string | null): string {
  if (!phone?.trim()) return "unknown";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) return "valid";
  if (digits.length === 10) return "valid";
  return "invalid";
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows: contacts } = await client.query<{
      id: number;
      email: string | null;
      phone: string | null;
    }>(`SELECT id, email, phone FROM contacts`);

    let emailValid = 0;
    let emailInvalid = 0;
    let phoneValid = 0;
    let phoneInvalid = 0;

    for (const c of contacts) {
      const emailStatus = validateEmail(c.email);
      const phoneStatus = validatePhone(c.phone);
      if (emailStatus === "valid") emailValid++;
      if (emailStatus === "invalid") emailInvalid++;
      if (phoneStatus === "valid") phoneValid++;
      if (phoneStatus === "invalid") phoneInvalid++;

      await client.query(
        `UPDATE contacts SET email_status = $1, phone_status = $2, updated_at = NOW() WHERE id = $3`,
        [emailStatus, phoneStatus, c.id]
      );
    }

    const { rows: companies } = await client.query<{ id: number; phone: string | null }>(
      `SELECT id, phone FROM companies WHERE phone IS NOT NULL`
    );

    for (const co of companies) {
      const phoneStatus = validatePhone(co.phone);
      await client.query(
        `UPDATE companies SET phone_status = $1, updated_at = NOW() WHERE id = $2`,
        [phoneStatus, co.id]
      );
    }

    console.log(`Validated ${contacts.length} contacts`);
    console.log(`  Email: ${emailValid} valid, ${emailInvalid} invalid`);
    console.log(`  Phone: ${phoneValid} valid, ${phoneInvalid} invalid`);
    console.log(`Validated ${companies.length} company phones`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
