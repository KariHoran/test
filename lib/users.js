import bcrypt from "bcryptjs";
import { execute, queryOne } from "./db.js";

const SALT_ROUNDS = 10;

export function normalizeInstagramUsername(username) {
  return username.trim().replace(/^@+/, "").toLowerCase();
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function findUserByEmail(email) {
  return queryOne("SELECT * FROM bloggers WHERE email = $1", [normalizeEmail(email)]);
}

export async function findUserById(id) {
  return queryOne("SELECT * FROM bloggers WHERE id = $1", [id]);
}

export async function findUserByInstagramUsername(username) {
  return queryOne("SELECT * FROM bloggers WHERE instagram_username = $1", [
    normalizeInstagramUsername(username),
  ]);
}

const DEMO_USER_MAP = {
  anna: "anna.lifestyle",
  masha: "masha.travel",
  admin: "agency.admin",
};

export async function findDemoUser(demoUser) {
  const username = DEMO_USER_MAP[demoUser];
  if (!username) return null;

  return queryOne("SELECT * FROM bloggers WHERE instagram_username = $1 AND is_demo = TRUE", [
    username,
  ]);
}

export async function createUser({ name, instagram_username, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeInstagramUsername(instagram_username);
  const password_hash = await hashPassword(password);

  const result = await execute(
    `INSERT INTO bloggers (name, instagram_username, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'blogger')
     RETURNING id`,
    [name.trim(), normalizedUsername, normalizedEmail, password_hash],
  );

  return findUserById(result.insertId);
}

export function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    instagram_username: user.instagram_username,
    email: user.email,
    avatar_url: user.avatar_url,
    role: user.role,
    created_at:
      user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
  };
}
