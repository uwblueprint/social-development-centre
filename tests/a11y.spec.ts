import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const path of ["/components", "/admin/opportunities", "/admin/partners", "/admin/community"]) test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
  await page.goto(path);
  // Wait for the variable font to finish loading and settle a frame: scanning
  // mid-swap can make axe misjudge text contrast from anti-aliased glyphs.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
});
