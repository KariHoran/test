import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth.js";
import {
  createUser,
  findUserByEmail,
  findUserByInstagramUsername,
  normalizeEmail,
  normalizeInstagramUsername,
} from "@/lib/users.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, instagram_username, email, password } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
    }

    if (!instagram_username?.trim()) {
      return NextResponse.json({ error: "Укажите ник в Instagram" }, { status: 400 });
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: "Укажите email" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не короче 6 символов" },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeInstagramUsername(instagram_username);

    if (await findUserByEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Email уже зарегистрирован" }, { status: 409 });
    }

    if (await findUserByInstagramUsername(normalizedUsername)) {
      return NextResponse.json({ error: "Этот Instagram-ник уже занят" }, { status: 409 });
    }

    const user = await createUser({
      name,
      instagram_username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    const session = await createSession(user);

    return NextResponse.json({ user: session }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Не удалось зарегистрироваться" }, { status: 500 });
  }
}
