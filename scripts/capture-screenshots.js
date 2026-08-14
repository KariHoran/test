const { chromium } = require("playwright");
const path = require("path");

async function main() {
  const outDir = path.resolve(__dirname, "../screenshots");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto("http://localhost:3000/companies", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "01-all-companies.png"), fullPage: true });

  await page.goto("http://localhost:3000/companies?q=Аврора", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "02-search-mayak.png"), fullPage: true });

  await page.goto("http://localhost:3000/companies?city=Москва", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "03-filter-moscow.png"), fullPage: true });

  await browser.close();
  console.log("Screenshots saved to", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
