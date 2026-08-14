const { chromium } = require("playwright");
const path = require("path");

async function main() {
  const base = "http://localhost:3000";
  const outDir = path.resolve(__dirname, "../screenshots");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${base}/companies`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "01-all-companies.png"), fullPage: true });

  await page.goto(`${base}/companies?q=Аврора`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "02-search-avrora.png"), fullPage: true });

  await page.goto(`${base}/companies?city=Москва`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "03-filter-moscow.png"), fullPage: true });

  await page.goto(`${base}/icp/new`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "04-icp-new.png"), fullPage: true });

  await page.goto(`${base}/companies/3`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "05-company-contacts.png"), fullPage: true });

  await page.goto(`${base}/export/review?companies=3,4,5`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "06-export-review.png"), fullPage: true });

  await browser.close();
  console.log("Screenshots saved to", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
