import { ApifyFetchError, fetchReelData, normalizeInstagramUrl } from "./apify.js";
import {
  createReel,
  getReelById,
  markReelUpdating,
  updateReelError,
  updateReelSuccess,
} from "./reels.js";

export async function syncReelFromApify(reelId, instagramUrl) {
  await markReelUpdating(reelId);

  try {
    const data = await fetchReelData(instagramUrl);
    return updateReelSuccess(reelId, data);
  } catch (error) {
    const message =
      error instanceof ApifyFetchError
        ? error.message
        : error?.message || "Не удалось обновить данные ролика";

    console.error(`[reels-sync] Failed for reel #${reelId}:`, message);
    return updateReelError(reelId, message);
  }
}

export async function createAndSyncReel(bloggerId, instagramUrl) {
  const normalizedUrl = normalizeInstagramUrl(instagramUrl);
  const reel = await createReel({ bloggerId, instagramUrl: normalizedUrl });
  return syncReelFromApify(reel.id, normalizedUrl);
}

export async function refreshReel(reelId) {
  const reel = await getReelById(reelId);
  if (!reel) return null;
  return syncReelFromApify(reel.id, reel.instagram_url);
}
