import { NextResponse } from "next/server";
import { refreshReel } from "@/lib/reels-sync.js";
import { getReelsNeedingRefresh } from "@/lib/reels.js";

export const maxDuration = 300;

const REFRESH_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not configured");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");

  return authHeader === `Bearer ${secret}` || cronHeader === secret;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleReels = await getReelsNeedingRefresh(6);
  const results = [];

  console.log(`[cron] Refreshing ${staleReels.length} stale reels`);

  for (const reel of staleReels) {
    const updated = await refreshReel(reel.id);
    results.push({
      id: updated.id,
      status: updated.status,
      error: updated.error_message || null,
    });

    await sleep(REFRESH_DELAY_MS);
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
