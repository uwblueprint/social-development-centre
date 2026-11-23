import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
const out = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1056, height: 1632 } });
await p.emulateMedia({ media: "print" });
await p.goto(pathToFileURL("open-house/print/posters.html").href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
for (let i = 0; i < 4; i++) await p.locator(".page").nth(i).screenshot({ path: `${out}/p${i + 1}.png`, scale: "css" });
await b.close();
