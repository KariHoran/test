import { execute, queryAll, queryOne } from "./db.js";

function toIso(value) {
  if (!value) return value;
  return value instanceof Date ? value.toISOString() : value;
}

export function toPublicReel(row) {
  if (!row) return null;
  return {
    id: row.id,
    blogger_id: row.blogger_id,
    instagram_url: row.instagram_url,
    cover_url: row.cover_url,
    views: row.views,
    published_at: toIso(row.published_at),
    last_updated_at: toIso(row.last_updated_at),
    status: row.status,
    error_message: row.error_message || null,
  };
}

export async function getReelsByBloggerId(bloggerId) {
  const rows = await queryAll(
    `SELECT id, blogger_id, instagram_url, cover_url, views, published_at, last_updated_at, status, error_message
     FROM reels
     WHERE blogger_id = $1
     ORDER BY COALESCE(published_at, last_updated_at) DESC`,
    [bloggerId],
  );
  return rows.map(toPublicReel);
}

export async function getAllReels() {
  const rows = await queryAll(
    `SELECT id, blogger_id, instagram_url, cover_url, views, published_at, last_updated_at, status, error_message
     FROM reels
     ORDER BY COALESCE(published_at, last_updated_at) DESC`,
  );
  return rows.map(toPublicReel);
}

export async function getReelById(id) {
  return toPublicReel(
    await queryOne(
      `SELECT id, blogger_id, instagram_url, cover_url, views, published_at, last_updated_at, status, error_message
       FROM reels WHERE id = $1`,
      [id],
    ),
  );
}

export async function createReel({ bloggerId, instagramUrl }) {
  const result = await execute(
    `INSERT INTO reels (blogger_id, instagram_url, status, last_updated_at)
     VALUES ($1, $2, 'updating', NOW())
     RETURNING id`,
    [bloggerId, instagramUrl],
  );
  return getReelById(result.insertId);
}

export async function markReelUpdating(id) {
  await execute(
    `UPDATE reels SET status = 'updating', error_message = NULL, last_updated_at = NOW() WHERE id = $1`,
    [id],
  );
  return getReelById(id);
}

export async function updateReelSuccess(id, { views, published_at, cover_url }) {
  await execute(
    `UPDATE reels
     SET views = $1, published_at = $2, cover_url = $3, status = 'ok', error_message = NULL, last_updated_at = NOW()
     WHERE id = $4`,
    [views ?? 0, published_at, cover_url, id],
  );
  return getReelById(id);
}

export async function updateReelError(id, errorMessage) {
  await execute(
    `UPDATE reels
     SET status = 'error', error_message = $1, last_updated_at = NOW()
     WHERE id = $2`,
    [errorMessage, id],
  );
  return getReelById(id);
}

export async function deleteReel(id) {
  await execute("DELETE FROM reels WHERE id = $1", [id]);
}

export async function getBloggerStats(bloggerId) {
  return queryOne(
    `SELECT
       COUNT(*)::int AS reel_count,
       COALESCE(SUM(views), 0)::int AS total_views,
       COALESCE(AVG(views), 0)::float AS avg_views,
       COALESCE(MAX(views), 0)::int AS max_views
     FROM reels
     WHERE blogger_id = $1 AND status = 'ok'`,
    [bloggerId],
  );
}

export async function getAdminSummary() {
  return queryOne(
    `SELECT
       (SELECT COUNT(*)::int FROM bloggers WHERE role = 'blogger') AS blogger_count,
       (SELECT COUNT(*)::int FROM reels WHERE status = 'ok') AS reel_count,
       (SELECT COALESCE(SUM(views), 0)::int FROM reels WHERE status = 'ok') AS total_views`,
  );
}

export async function getBloggerRankings() {
  return queryAll(
    `SELECT
       b.id,
       b.name,
       b.instagram_username,
       COALESCE(SUM(r.views), 0)::int AS total_views,
       COUNT(r.id)::int AS reel_count
     FROM bloggers b
     LEFT JOIN reels r ON r.blogger_id = b.id AND r.status = 'ok'
     WHERE b.role = 'blogger'
     GROUP BY b.id
     ORDER BY total_views DESC, b.name ASC`,
  );
}

export async function getTopReels(limit = 5) {
  return queryAll(
    `SELECT r.*, b.name AS blogger_name, b.instagram_username
     FROM reels r
     JOIN bloggers b ON b.id = r.blogger_id
     WHERE r.status = 'ok'
     ORDER BY r.views DESC
     LIMIT $1`,
    [limit],
  );
}

export async function getReelsNeedingRefresh(hours = 6) {
  return queryAll(
    `SELECT id, blogger_id, instagram_url
     FROM reels
     WHERE status = 'ok'
       AND last_updated_at <= NOW() - make_interval(hours => $1)
     ORDER BY last_updated_at ASC`,
    [hours],
  );
}

export function canAccessReel(reel, session) {
  if (!reel || !session) return false;
  return reel.blogger_id === session.id || session.role === "admin";
}
