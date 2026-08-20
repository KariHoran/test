import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth.js";
import { canAccessReel, deleteReel, getReelById } from "@/lib/reels.js";
import { refreshReel } from "@/lib/reels-sync.js";

export const maxDuration = 300;

export async function PATCH(_request, context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await context.params;
  const reelId = Number(idParam);

  if (!reelId) {
    return NextResponse.json({ error: "Invalid reel id" }, { status: 400 });
  }

  const existing = await getReelById(reelId);
  if (!existing) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }

  if (!canAccessReel(existing, session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reel = await refreshReel(reelId);

  if (reel.status === "error") {
    return NextResponse.json({ reel, error: reel.error_message }, { status: 422 });
  }

  return NextResponse.json({ reel });
}

export async function DELETE(_request, context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await context.params;
  const reelId = Number(idParam);

  if (!reelId) {
    return NextResponse.json({ error: "Invalid reel id" }, { status: 400 });
  }

  const existing = await getReelById(reelId);
  if (!existing) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }

  if (!canAccessReel(existing, session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteReel(reelId);
  return NextResponse.json({ ok: true });
}
