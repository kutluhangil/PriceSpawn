// Screenshot helper: node scripts/shot.cjs <url> <out.png> [width] [height] [waitMs]
const { chromium } = require("playwright");
(async () => {
  const [, , url, out, w = "1280", h = "900", waitMs = "3500"] = process.argv;
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(+waitMs);
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
  console.log("saved", out);
})();
