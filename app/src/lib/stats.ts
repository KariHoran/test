import { getPool } from "./db";

export interface ValidationStats {
  totalContacts: number;
  emailValid: number;
  emailInvalid: number;
  emailUnknown: number;
  phoneValid: number;
  phoneInvalid: number;
  phoneUnknown: number;
  decisionMakers: number;
  nonDecisionMakers: number;
  outreachReady: number;
  bounceRisk: number;
  companiesWithValidLpr: number;
  totalCompanies: number;
}

export async function getValidationStats(): Promise<ValidationStats> {
  const pool = getPool();

  const [contactStats, companyStats] = await Promise.all([
    pool.query<{
      total: string;
      email_valid: string;
      email_invalid: string;
      email_unknown: string;
      phone_valid: string;
      phone_invalid: string;
      phone_unknown: string;
      decision_makers: string;
      outreach_ready: string;
    }>(`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE email_status = 'valid')::text AS email_valid,
        COUNT(*) FILTER (WHERE email_status = 'invalid')::text AS email_invalid,
        COUNT(*) FILTER (WHERE email_status IS NULL OR email_status = 'unknown')::text AS email_unknown,
        COUNT(*) FILTER (WHERE phone_status = 'valid')::text AS phone_valid,
        COUNT(*) FILTER (WHERE phone_status = 'invalid')::text AS phone_invalid,
        COUNT(*) FILTER (WHERE phone_status IS NULL OR phone_status = 'unknown')::text AS phone_unknown,
        COUNT(*) FILTER (WHERE is_decision_maker = true)::text AS decision_makers,
        COUNT(*) FILTER (
          WHERE is_decision_maker = true
            AND email_status = 'valid'
            AND phone_status = 'valid'
            AND (email IS NULL OR (
              email NOT ILIKE 'info@%' AND email NOT ILIKE 'sales@%' AND
              email NOT ILIKE 'contact@%' AND email NOT ILIKE 'office@%'
            ))
        )::text AS outreach_ready
      FROM contacts
    `),
    pool.query<{ total: string; with_valid_lpr: string }>(`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM contacts ct
            WHERE ct.company_id = companies.id
              AND ct.is_decision_maker = true
              AND ct.email_status = 'valid'
              AND (ct.email IS NULL OR (
                ct.email NOT ILIKE 'info@%' AND ct.email NOT ILIKE 'sales@%' AND
                ct.email NOT ILIKE 'contact@%' AND ct.email NOT ILIKE 'office@%'
              ))
          )
        )::text AS with_valid_lpr
      FROM companies
    `),
  ]);

  const c = contactStats.rows[0];
  const co = companyStats.rows[0];
  const total = parseInt(c.total, 10);
  const emailInvalid = parseInt(c.email_invalid, 10);

  return {
    totalContacts: total,
    emailValid: parseInt(c.email_valid, 10),
    emailInvalid,
    emailUnknown: parseInt(c.email_unknown, 10),
    phoneValid: parseInt(c.phone_valid, 10),
    phoneInvalid: parseInt(c.phone_invalid, 10),
    phoneUnknown: parseInt(c.phone_unknown, 10),
    decisionMakers: parseInt(c.decision_makers, 10),
    nonDecisionMakers: total - parseInt(c.decision_makers, 10),
    outreachReady: parseInt(c.outreach_ready, 10),
    bounceRisk: emailInvalid,
    companiesWithValidLpr: parseInt(co.with_valid_lpr, 10),
    totalCompanies: parseInt(co.total, 10),
  };
}

export interface CategoryStat {
  category: string;
  company_count: number;
}

export async function getTopCategories(limit = 5): Promise<CategoryStat[]> {
  const pool = getPool();
  const { rows } = await pool.query<CategoryStat>(
    `SELECT category, COUNT(*)::int AS company_count
     FROM companies
     WHERE category IS NOT NULL
     GROUP BY category
     ORDER BY company_count DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export interface CityCategoryStat {
  category: string;
  company_count: number;
}

export async function getTopCategoriesByCity(city: string, limit = 5): Promise<CityCategoryStat[]> {
  const pool = getPool();
  const { rows } = await pool.query<CityCategoryStat>(
    `SELECT category, COUNT(*)::int AS company_count
     FROM companies
     WHERE city = $1 AND category IS NOT NULL
     GROUP BY category
     ORDER BY company_count DESC
     LIMIT $2`,
    [city, limit]
  );
  return rows;
}
