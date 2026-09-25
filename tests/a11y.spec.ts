import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const path of ["/components", "/admin/opportunities"]) test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
  await page.goto(path);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
});
