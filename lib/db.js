/**
 * Postgres via `pg` (not @vercel/postgres): keeps plain SQL with $1/$2 placeholders,
 * works with any Postgres host and Vercel's POSTGRES_URL without template-tag API.
 */
import pg from "pg";

const { Pool } = pg;

let pool = null;

function getConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

export function getPool() {
  if (!pool) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error("POSTGRES_URL or DATABASE_URL is not configured");
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 10,
    });
  }

  return pool;
}

export async function queryAll(sql, params = []) {
  const result = await getPool().query(sql, params);
  return result.rows;
}

export async function queryOne(sql, params = []) {
  const result = await getPool().query(sql, params);
  return result.rows[0] ?? null;
}

export async function execute(sql, params = []) {
  const result = await getPool().query(sql, params);
  return {
    rowCount: result.rowCount,
    rows: result.rows,
    insertId: result.rows[0]?.id ?? null,
  };
}

export async function initSchema() {
  const fs = await import("fs");
  const path = await import("path");
  const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await getPool().query(schema);
}
