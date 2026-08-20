/**
 * Client-side helper for POST /api/reels.
 * Returns the reel even when Apify sync failed (422) so the UI can show an error card.
 */
export async function submitNewReel(instagramUrl) {
  const res = await fetch("/api/reels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_url: instagramUrl }),
  });

  const data = await res.json();

  if (res.ok) {
    return { reel: data.reel, syncError: null };
  }

  if (res.status === 422 && data.reel) {
    return {
      reel: data.reel,
      syncError: data.error || data.reel.error_message || "Не удалось загрузить данные",
    };
  }

  throw new Error(data.error || data.reel?.error_message || "Не удалось добавить Reels");
}

export function createTempReel(instagramUrl) {
  return {
    id: `temp-${Date.now()}`,
    instagram_url: instagramUrl,
    status: "updating",
    views: 0,
    cover_url: null,
    published_at: null,
    last_updated_at: new Date().toISOString(),
  };
}
