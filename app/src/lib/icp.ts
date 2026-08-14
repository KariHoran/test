import { getPool } from "./db";
import type { IcpCriteria, IcpProfile } from "./icp-types";

export async function getIcpProfiles(): Promise<IcpProfile[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: number; name: string; criteria: IcpCriteria; created_at: Date }>(
    `SELECT id, name, criteria, created_at FROM icp_profiles ORDER BY created_at DESC`
  );
  return rows;
}

export async function getIcpProfile(id: number): Promise<IcpProfile | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: number; name: string; criteria: IcpCriteria; created_at: Date }>(
    `SELECT id, name, criteria, created_at FROM icp_profiles WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createIcpProfile(name: string, criteria: IcpCriteria): Promise<number> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO icp_profiles (name, criteria) VALUES ($1, $2::jsonb) RETURNING id`,
    [name.trim(), JSON.stringify(criteria)]
  );
  return rows[0].id;
}

export async function deleteIcpProfile(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM icp_profiles WHERE id = $1`, [id]);
}
