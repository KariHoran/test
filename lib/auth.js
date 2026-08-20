import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session.js";

/**
 * Сессии через httpOnly cookie + подписанный JWT (jose), а не NextAuth.
 *
 * Почему так:
 * - Не нужна отдельная таблица/адаптер сессий — JWT хранит id, role, имя прямо в cookie.
 * - jose работает в middleware (Edge) и в API/Server Components без native-модулей.
 * - Меньше зависимостей и конфигурации, чем Auth.js + Credentials + SQLite.
 * - На Vercel достаточно SESSION_SECRET; cookie httpOnly + secure в production.
 */

export { SESSION_COOKIE } from "./session.js";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export function buildSessionPayload(user) {
  return {
    id: user.id,
    name: user.name,
    instagram_username: user.instagram_username,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url || null,
    is_demo: Boolean(user.is_demo),
  };
}

export async function signSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());
}

export async function createSession(user) {
  const payload = buildSessionPayload(user);
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return payload;
}

export async function getSession() {
  const { verifySessionToken } = await import("./session.js");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
