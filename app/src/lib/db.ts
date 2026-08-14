import pg from "pg";

const globalForPg = globalThis as unknown as { pgPool?: pg.Pool };

export function getPool(): pg.Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return globalForPg.pgPool;
}
