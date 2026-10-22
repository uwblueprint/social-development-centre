import { readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Every page with a fixed URL, found by walking `src/app`, so a new page is scanned without editing
 * this file. Skips segments with no URL of their own to visit: dynamic ones (`[id]`, `[...path]`),
 * private folders (`_components`) and parallel slots (`@modal`); route groups (`(group)`) add no segment.
 */
function pageRoutes(dir = path.join(process.cwd(), "src", "app"), segments: string[] = []): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /^page\.(tsx|ts|jsx|js)$/.test(entry.name)) routes.push(`/${segments.join("/")}`);
    if (!entry.isDirectory() || /^[_[@]/.test(entry.name)) continue;
    const next = entry.name.startsWith("(") ? segments : [...segments, entry.name];
    routes.push(...pageRoutes(path.join(dir, entry.name), next));
  }
  return routes;
}

/** Desktop, and the narrowest phone we support (reflow, WCAG 1.4.10). */
const widths = [1280, 320];

async function settle(page: import("@playwright/test").Page) {
  // Wait for the variable font to finish loading and settle a frame: scanning
  // mid-swap can make axe misjudge text contrast from anti-aliased glyphs.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function checkA11y(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
}

for (const route of pageRoutes()) {
  for (const width of widths) {
    test(`${route} at ${width}px has no WCAG 2.2 AA violations`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const response = await page.goto(route);
      // A page that can't render here (e.g. it needs Supabase credentials CI doesn't have) is reported
      // as skipped, with its status, rather than scanned as an error page.
      test.skip(!response?.ok(), `${route} returned ${response?.status()}`);
      await settle(page);
      await checkA11y(page);
    });
  }
}

test("the 404 page has no WCAG 2.2 AA violations", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  // With Supabase credentials set, signed-out visitors are sent to sign in before any 404.
  test.skip(new URL(page.url()).pathname === "/login", "redirected to sign in");
  expect(response?.status()).toBe(404);
  await settle(page);
  await checkA11y(page);
});
