import { jwtVerify } from "jose";

/** Cookie name and JWT verification for middleware (Edge-safe, no Node APIs). */

export const SESSION_COOKIE = "reelshub_session";

export async function verifySessionToken(token) {
  if (!token) return null;

  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return null;

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return {
      id: payload.id,
      name: payload.name,
      instagram_username: payload.instagram_username,
      email: payload.email,
      role: payload.role,
      avatar_url: payload.avatar_url ?? null,
      is_demo: Boolean(payload.is_demo),
    };
  } catch {
    return null;
  }
}
