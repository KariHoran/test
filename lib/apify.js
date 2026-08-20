/**
 * Apify integration for Instagram Reels metadata.
 *
 * Actor: apify/instagram-scraper (official, supports direct post/reel URLs)
 * Docs: https://apify.com/apify/instagram-scraper
 */

const APIFY_BASE_URL = "https://api.apify.com/v2";
const ACTOR_ID = "apify~instagram-scraper";

const ACTOR_INPUT_DEFAULTS = {
  resultsType: "posts",
  resultsLimit: 1,
  searchType: "hashtag",
  searchLimit: 1,
};

const REQUEST_TIMEOUT_MS = 120_000;

export class ApifyFetchError extends Error {
  constructor(message, code = "APIFY_ERROR") {
    super(message);
    this.name = "ApifyFetchError";
    this.code = code;
  }
}

export function normalizeInstagramUrl(url) {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    throw new ApifyFetchError("Укажите ссылку на Reels", "INVALID_URL");
  }

  const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new ApifyFetchError("Некорректная ссылка Instagram", "INVALID_URL");
  }

  if (!parsed.hostname.includes("instagram.com")) {
    throw new ApifyFetchError("Ссылка должна вести на instagram.com", "INVALID_URL");
  }

  if (!parsed.pathname.match(/\/(reel|reels|p)\//)) {
    throw new ApifyFetchError(
      "Поддерживаются только ссылки на Reels или посты (/reel/, /reels/, /p/)",
      "INVALID_URL",
    );
  }

  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "") + "/";
}

function buildActorInput(instagramUrl) {
  return {
    ...ACTOR_INPUT_DEFAULTS,
    directUrls: [instagramUrl],
  };
}

function mapApifyItem(item) {
  if (!item || typeof item !== "object") {
    throw new ApifyFetchError("Apify не вернул данные по ролику", "EMPTY_RESULT");
  }

  if (item.error || item.errorDescription) {
    throw new ApifyFetchError(
      item.errorDescription || item.error || "Не удалось получить данные ролика",
      "SCRAPE_FAILED",
    );
  }

  const views =
    Number(item.videoViewCount) ||
    Number(item.videoPlayCount) ||
    Number(item.playCount) ||
    0;

  const publishedAt = item.timestamp || item.takenAt || item.upload_date || null;
  const coverUrl = item.displayUrl || item.thumbnailUrl || item.imageUrl || null;

  return {
    views,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
    cover_url: coverUrl,
  };
}

function parseApifyHttpError(status, bodyText) {
  let detail = bodyText;

  try {
    const json = JSON.parse(bodyText);
    detail = json?.error?.message || json?.message || bodyText;
  } catch {
    // keep raw text
  }

  if (status === 401) {
    return new ApifyFetchError("Неверный APIFY_API_TOKEN", "AUTH_ERROR");
  }

  if (status === 402) {
    return new ApifyFetchError(
      "Исчерпан бесплатный лимит Apify — пополните баланс или подождите",
      "QUOTA_EXCEEDED",
    );
  }

  if (status === 408 || status === 504) {
    return new ApifyFetchError("Apify не успел обработать запрос (таймаут)", "TIMEOUT");
  }

  if (status === 429) {
    return new ApifyFetchError("Превышен лимит запросов Apify, попробуйте позже", "RATE_LIMIT");
  }

  return new ApifyFetchError(detail || `Apify вернул ошибку ${status}`, "APIFY_HTTP_ERROR");
}

/**
 * Fetch Reels metadata from Apify by Instagram URL.
 * Returns { views, published_at, cover_url } on success.
 * Throws ApifyFetchError with a human-readable message on failure.
 */
export async function fetchReelData(instagramUrl) {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    console.error("[apify] APIFY_API_TOKEN is not configured");
    throw new ApifyFetchError(
      "APIFY_API_TOKEN не настроен — добавьте токен в .env.local",
      "NOT_CONFIGURED",
    );
  }

  const normalizedUrl = normalizeInstagramUrl(instagramUrl);
  const input = buildActorInput(normalizedUrl);

  const endpoint = new URL(`${APIFY_BASE_URL}/acts/${ACTOR_ID}/run-sync-get-dataset-items`);
  endpoint.searchParams.set("token", token);
  endpoint.searchParams.set("timeout", "120");

  console.log("[apify] Fetching reel data:", normalizedUrl);

  try {
    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const bodyText = await response.text();

    if (!response.ok) {
      console.error("[apify] HTTP error", response.status, bodyText.slice(0, 500));
      throw parseApifyHttpError(response.status, bodyText);
    }

    let items;
    try {
      items = JSON.parse(bodyText);
    } catch {
      throw new ApifyFetchError("Apify вернул некорректный JSON", "INVALID_RESPONSE");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new ApifyFetchError(
        "Ролик не найден — проверьте ссылку или доступность аккаунта",
        "NOT_FOUND",
      );
    }

    const item =
      items.find((entry) => entry.url && normalizedUrl.includes(entry.shortCode)) || items[0];

    const mapped = mapApifyItem(item);
    console.log("[apify] Success:", normalizedUrl, mapped.views, "views");

    return mapped;
  } catch (error) {
    if (error instanceof ApifyFetchError) {
      throw error;
    }

    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      console.error("[apify] Request timeout for", normalizedUrl);
      throw new ApifyFetchError("Apify не успел обработать запрос (таймаут)", "TIMEOUT");
    }

    console.error("[apify] Unexpected error:", error);
    throw new ApifyFetchError(
      error?.message || "Неизвестная ошибка при обращении к Apify",
      "UNKNOWN",
    );
  }
}
