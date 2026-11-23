// Exports posters.html to posters.pdf: 12 x 18 in pages from the CSS @page rule, no margins or bleed,
// backgrounds printed, fonts embedded. Fails if any text runs past its page.
// Usage: node open-house/print/export-pdf.mjs
import { chromium } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
// One page wide (12in at 96px/in): a wider window makes Chrome shrink the pages and leave white edges.
const page = await browser.newPage({ viewport: { width: 1152, height: 1728 } });
await page.emulateMedia({ media: "print" });
await page.goto(pathToFileURL(path.join(dir, "posters.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const overflow = await page.evaluate(() =>
  [...document.querySelectorAll(".page")].flatMap((sheet, i) => {
    const box = sheet.getBoundingClientRect();
    return [...sheet.querySelectorAll("h1, h2, p")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return el.scrollWidth > el.clientWidth + 1 || r.left < box.left - 1 || r.right > box.right + 1;
      })
      .map((el) => `page ${i + 1}: "${el.textContent.trim().slice(0, 40)}"`);
  }),
);
if (overflow.length) {
  console.error("Text runs past the page:\n" + overflow.join("\n"));
  process.exitCode = 1;
}

await page.pdf({
  path: path.join(dir, "posters.pdf"),
  preferCSSPageSize: true,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
console.log(`Wrote ${path.join(dir, "posters.pdf")}`);
