/**
 * Demo mode smoke test.
 * Run: node scripts/test-demo-flow.js
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";

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
  console.log("1. Demo login as Anna...");
  let { res, data } = await request("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demo_user: "anna" }),
  });
  if (res.status !== 200) throw new Error(`Anna login failed: ${JSON.stringify(data)}`);
  if (!data.user?.is_demo) throw new Error("Session missing is_demo flag");
  console.log("   OK:", data.user.name, "→", data.redirectTo);

  console.log("2. GET /dashboard as Anna...");
  ({ res, data } = await request("/dashboard"));
  if (res.status !== 200) throw new Error(`Dashboard status ${res.status}`);
  if (!data.raw?.includes("Анна") && !data.raw?.includes("124")) {
    throw new Error("Dashboard missing Anna demo content");
  }
  console.log("   OK");

  console.log("3. GET /api/reels...");
  ({ res, data } = await request("/api/reels"));
  if (res.status !== 200 || data.reels.length < 4) {
    throw new Error(`Expected 4+ reels, got ${data.reels?.length}`);
  }
  console.log("   OK:", data.reels.length, "reels");

  console.log("4. Demo login as Admin...");
  ({ res, data } = await request("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demo_user: "admin" }),
  }));
  if (res.status !== 200) throw new Error("Admin login failed");
  if (data.redirectTo !== "/analytics") throw new Error(`Wrong redirect: ${data.redirectTo}`);
  console.log("   OK → /analytics");

  console.log("5. GET /analytics...");
  ({ res, data } = await request("/analytics"));
  if (res.status !== 200) throw new Error(`Analytics status ${res.status}`);
  if (!data.raw?.includes("anna.lifestyle") && !data.raw?.includes("masha.travel")) {
    throw new Error("Analytics missing blogger rankings");
  }
  console.log("   OK: rankings visible");

  console.log("\nAll demo flow checks passed.");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exit(1);
});
