/**
 * Smoke test for Reels API (requires running dev server + auth).
 * Run: node scripts/test-reels-flow.js
 */

const BASE = process.env.BASE_URL || "http://localhost:3001";
const unique = Date.now();
const email = `reels${unique}@test.com`;
const password = "secret123";

const jar = new Map();

function parseSetCookie(header) {
  if (!header) return;
  const [pair] = header.split(";");
  const eq = pair.indexOf("=");
  if (eq === -1) return;
  jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const cookies = cookieHeader();
  if (cookies) headers.Cookie = cookies;

  const res = await fetch(`${BASE}${path}`, { ...options, headers, redirect: "manual" });
  const setCookie = res.headers.getSetCookie?.() || [];
  setCookie.forEach(parseSetCookie);
  const single = res.headers.get("set-cookie");
  if (single && !setCookie.length) parseSetCookie(single);

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { res, data };
}

async function main() {
  console.log("1. Register + login...");
  let { res, data } = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Reels Tester",
      instagram_username: `reels${unique}`,
      email,
      password,
    }),
  });
  if (res.status !== 201) throw new Error(`Register failed: ${JSON.stringify(data)}`);
  console.log("   OK");

  console.log("2. POST /api/reels with invalid URL...");
  ({ res, data } = await request("/api/reels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_url: "https://example.com/not-instagram" }),
  }));
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  console.log("   OK:", data.error);

  console.log("3. POST /api/reels with valid URL format...");
  ({ res, data } = await request("/api/reels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instagram_url: "https://www.instagram.com/reel/CxYz123abc/",
    }),
  }));

  if (res.status === 201 && data.reel?.status === "ok") {
    console.log("   OK: Apify returned data", data.reel.views, "views");
  } else if (res.status === 422 && data.reel?.status === "error") {
    console.log("   OK: Apify error handled:", data.reel.error_message || data.error);
  } else {
    throw new Error(`Unexpected response: ${res.status} ${JSON.stringify(data)}`);
  }

  console.log("4. GET /api/reels...");
  ({ res, data } = await request("/api/reels"));
  if (res.status !== 200 || !Array.isArray(data.reels)) {
    throw new Error("GET /api/reels failed");
  }
  console.log("   OK:", data.reels.length, "reel(s)");

  if (data.reels[0]) {
    const reelId = data.reels[0].id;
    console.log("5. PATCH /api/reels/" + reelId + "...");
    ({ res, data } = await request(`/api/reels/${reelId}`, { method: "PATCH" }));
    if (!data.reel) throw new Error("PATCH failed");
    console.log("   OK: status =", data.reel.status);

    console.log("6. DELETE /api/reels/" + reelId + "...");
    ({ res } = await request(`/api/reels/${reelId}`, { method: "DELETE" }));
    if (res.status !== 200) throw new Error("DELETE failed");
    console.log("   OK");
  }

  console.log("\nAll reels API checks passed.");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exit(1);
});
