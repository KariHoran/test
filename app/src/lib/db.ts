import pg from "pg";

const globalForPg = globalThis as unknown as { pgPool?: pg.Pool };

export function getPool(): pg.Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalForPg.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    const useSsl =
      process.env.PGSSLMODE === "require" ||
      /neon\.tech|supabase\.co|render\.com|railway\.app/.test(connectionString);

    globalForPg.pgPool = new pg.Pool({
      connectionString,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  }

  return globalForPg.pgPool;
}
