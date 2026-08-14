import { getPool } from "./db";

export interface Company {
  id: number;
  name: string;
  category: string | null;
  city: string | null;
  address: string | null;
  rating: number | null;
  reviews_count: number;
  website: string | null;
  phone: string | null;
}

export async function getCompanies(params: {
  q?: string;
  city?: string;
}): Promise<Company[]> {
  const pool = getPool();
  const conditions: string[] = [];
  const values: string[] = [];

  if (params.q?.trim()) {
    values.push(`%${params.q.trim()}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  if (params.city?.trim()) {
    values.push(params.city.trim());
    conditions.push(`city = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query<Company>(
    `SELECT id, name, category, city, address, rating, reviews_count, website, phone
     FROM companies
     ${where}
     ORDER BY name
     LIMIT 100`,
    values
  );

  return rows;
}

export async function getCities(): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ city: string }>(
    `SELECT DISTINCT city FROM companies WHERE city IS NOT NULL ORDER BY city`
  );
  return rows.map((r) => r.city);
}
