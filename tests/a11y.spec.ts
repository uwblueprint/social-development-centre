import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("component showcase has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/components");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
});
