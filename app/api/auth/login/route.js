import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth.js";
import {
  findUserByEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/users.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Укажите email и пароль" }, { status: 400 });
    }

    const user = await findUserByEmail(normalizeEmail(email));

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    const session = await createSession(user);

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Не удалось войти" }, { status: 500 });
  }
}
