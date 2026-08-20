import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth.js";
import { ApifyFetchError, normalizeInstagramUrl } from "@/lib/apify.js";
import { createAndSyncReel } from "@/lib/reels-sync.js";
import { getAllReels, getReelsByBloggerId } from "@/lib/reels.js";

export const maxDuration = 300;

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  if (all && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reels = all ? await getAllReels() : await getReelsByBloggerId(session.id);
  return NextResponse.json({ reels });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { instagram_url: instagramUrl } = body;

    if (!instagramUrl?.trim()) {
      return NextResponse.json({ error: "Укажите ссылку на Reels" }, { status: 400 });
    }

    normalizeInstagramUrl(instagramUrl);

    const reel = await createAndSyncReel(session.id, instagramUrl);

    if (reel.status === "error") {
      return NextResponse.json({ reel, error: reel.error_message }, { status: 422 });
    }

    return NextResponse.json({ reel }, { status: 201 });
  } catch (error) {
    if (error instanceof ApifyFetchError && error.code === "INVALID_URL") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[POST /api/reels]", error);
    return NextResponse.json({ error: "Не удалось добавить Reels" }, { status: 500 });
  }
}
