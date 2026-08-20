import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth.js";
import { findDemoUser } from "@/lib/users.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { demo_user: demoUser } = body;

    if (!demoUser || !["anna", "masha", "admin"].includes(demoUser)) {
      return NextResponse.json({ error: "Неизвестный демо-пользователь" }, { status: 400 });
    }

    const user = await findDemoUser(demoUser);

    if (!user) {
      return NextResponse.json(
        { error: "Демо-данные не найдены. Запустите npm run db:seed" },
        { status: 404 },
      );
    }

    const session = await createSession(user);

    return NextResponse.json({
      user: session,
      redirectTo: demoUser === "admin" ? "/analytics" : "/dashboard",
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Не удалось войти в демо-режим" }, { status: 500 });
  }
}
