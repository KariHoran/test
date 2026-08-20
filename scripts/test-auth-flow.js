/**
 * Manual auth flow smoke test.
 * Run: node scripts/test-auth-flow.js
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";
const unique = Date.now();
const email = `blogger${unique}@test.com`;

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

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });

  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length) {
    setCookie.forEach(parseSetCookie);
  } else {
    const single = res.headers.get("set-cookie");
    if (single) parseSetCookie(single);
  }

  return res;
}

async function main() {
  console.log("1. Register new blogger...");
  const registerRes = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Тест Блогер",
      instagram_username: `test${unique}`,
      email,
      password: "secret123",
    }),
  });
  const registerData = await registerRes.json();
  if (registerRes.status !== 201) throw new Error(`Register failed: ${JSON.stringify(registerData)}`);
  console.log("   OK:", registerData.user.name, registerData.user.role);

  console.log("2. GET /api/auth/me...");
  const meRes = await request("/api/auth/me");
  const meData = await meRes.json();
  if (meRes.status !== 200 || meData.user.email !== email) {
    throw new Error(`Me failed: ${JSON.stringify(meData)}`);
  }
  console.log("   OK:", meData.user.email);

  console.log("3. GET /dashboard (authenticated)...");
  const dashRes = await request("/dashboard");
  if (dashRes.status !== 200) throw new Error(`Dashboard status ${dashRes.status}`);
  const dashHtml = await dashRes.text();
  if (!dashHtml.includes("Тест")) throw new Error("Dashboard missing user name");
  console.log("   OK: dashboard shows user name");

  console.log("4. GET /analytics as blogger (expect redirect)...");
  const analyticsRes = await request("/analytics");
  if (analyticsRes.status !== 307 && analyticsRes.status !== 308) {
    throw new Error(`Expected redirect from analytics, got ${analyticsRes.status}`);
  }
  const location = analyticsRes.headers.get("location") || "";
  if (!location.includes("/dashboard")) throw new Error(`Wrong redirect: ${location}`);
  console.log("   OK: redirected to /dashboard");

  console.log("5. Logout...");
  const logoutRes = await request("/api/auth/logout", { method: "POST" });
  if (logoutRes.status !== 200) throw new Error("Logout failed");
  console.log("   OK");

  console.log("6. GET /dashboard without session (expect redirect to login)...");
  const protectedRes = await request("/dashboard");
  if (protectedRes.status !== 307 && protectedRes.status !== 308) {
    throw new Error(`Expected redirect to login, got ${protectedRes.status}`);
  }
  const loginLocation = protectedRes.headers.get("location") || "";
  if (!loginLocation.includes("/login")) throw new Error(`Wrong redirect: ${loginLocation}`);
  console.log("   OK: redirected to /login");

  console.log("7. Login again...");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret123" }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  console.log("   OK:", loginData.user.name);

  console.log("\nAll auth flow checks passed.");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exit(1);
});
