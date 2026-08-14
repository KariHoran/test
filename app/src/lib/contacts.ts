import { getPool } from "./db";
import { isGenericEmailLocal } from "./validation";

export interface Contact {
  id: number;
  company_id: number;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_decision_maker: boolean;
  email_status: string;
  phone_status: string;
}

export interface ExportContactRow extends Contact {
  company_name: string;
  company_city: string | null;
}

export function isGenericEmail(email: string | null): boolean {
  if (!email) return false;
  return isGenericEmailLocal(email);
}

export function contactFullName(c: Contact): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

export async function getContactsByCompany(companyId: number): Promise<Contact[]> {
  const pool = getPool();
  const { rows } = await pool.query<Contact>(
    `SELECT id, company_id, first_name, last_name, title, email, phone,
            is_decision_maker, email_status, phone_status
     FROM contacts
     WHERE company_id = $1
     ORDER BY is_decision_maker DESC, title ASC`,
    [companyId]
  );
  return rows;
}

export async function getLprContactsByCompany(companyId: number): Promise<Contact[]> {
  const contacts = await getContactsByCompany(companyId);
  return contacts.filter(
    (c) => c.is_decision_maker && c.email_status !== "invalid" && !isGenericEmail(c.email)
  );
}

export async function countContactsForCompanies(companyIds: number[]): Promise<Map<number, number>> {
  if (companyIds.length === 0) return new Map();
  const pool = getPool();
  const { rows } = await pool.query<{ company_id: number; count: string }>(
    `SELECT company_id, COUNT(*)::text AS count
     FROM contacts
     WHERE company_id = ANY($1::int[])
       AND is_decision_maker = true
       AND email_status != 'invalid'
       AND (email IS NULL OR (
         email NOT ILIKE 'info@%' AND email NOT ILIKE 'sales@%' AND
         email NOT ILIKE 'contact@%' AND email NOT ILIKE 'office@%'
       ))
     GROUP BY company_id`,
    [companyIds]
  );
  return new Map(rows.map((r) => [r.company_id, parseInt(r.count, 10)]));
}

export async function getContactsForExport(
  companyIds: number[],
  options: { validOnly?: boolean; lprOnly?: boolean } = {}
): Promise<ExportContactRow[]> {
  if (companyIds.length === 0) return [];
  const pool = getPool();
  const conditions = ["ct.company_id = ANY($1::int[])"];
  const values: unknown[] = [companyIds];

  if (options.lprOnly !== false) {
    conditions.push("ct.is_decision_maker = true");
  }

  if (options.validOnly) {
    conditions.push("ct.email_status = 'valid'");
  } else {
    conditions.push("(ct.email_status IS NULL OR ct.email_status != 'invalid')");
  }

  conditions.push(`(ct.email IS NULL OR (
    ct.email NOT ILIKE 'info@%' AND ct.email NOT ILIKE 'sales@%' AND
    ct.email NOT ILIKE 'contact@%' AND ct.email NOT ILIKE 'office@%'
  ))`);

  const { rows } = await pool.query<ExportContactRow>(
    `SELECT ct.id, ct.company_id, ct.first_name, ct.last_name, ct.title,
            ct.email, ct.phone, ct.is_decision_maker, ct.email_status, ct.phone_status,
            co.name AS company_name, co.city AS company_city
     FROM contacts ct
     JOIN companies co ON co.id = ct.company_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY co.name, ct.is_decision_maker DESC, ct.title`,
    values
  );
  return rows;
}

export async function getContactsByIds(ids: number[]): Promise<ExportContactRow[]> {
  if (ids.length === 0) return [];
  const pool = getPool();
  const { rows } = await pool.query<ExportContactRow>(
    `SELECT ct.id, ct.company_id, ct.first_name, ct.last_name, ct.title,
            ct.email, ct.phone, ct.is_decision_maker, ct.email_status, ct.phone_status,
            co.name AS company_name, co.city AS company_city
     FROM contacts ct
     JOIN companies co ON co.id = ct.company_id
     WHERE ct.id = ANY($1::int[])
     ORDER BY co.name, ct.title`,
    [ids]
  );
  return rows;
}

export async function getContactTitles(): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ title: string }>(
    `SELECT DISTINCT title FROM contacts WHERE title IS NOT NULL ORDER BY title`
  );
  return rows.map((r) => r.title);
}
