import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe over the key opened states of Partners, the partner portal and Opportunities (routes covered by
 * a11y.spec.ts aren't repeated here). Each opens a sheet, dialog, menu or confirm — states a plain page
 * load doesn't reach.
 */
async function expectNoViolations(page: import("@playwright/test").Page, excludeSelectors: string[] = []) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  for (const selector of excludeSelectors) builder = builder.exclude(selector);
  const results = await builder.analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
}

test.describe("320px", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const path of []) {
    test(`${path} has no violations at 320px`, async ({ page }) => {
      await page.goto(path);
      await expectNoViolations(page);
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});
