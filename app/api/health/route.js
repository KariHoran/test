import { NextResponse } from "next/server";

// TODO: connect Apify API for fetching Instagram Reels data
// Requires APIFY_API_TOKEN from environment variables

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "reelshub",
    apify: process.env.APIFY_API_TOKEN ? "configured" : "not_configured",
  });
}
