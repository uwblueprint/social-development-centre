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

test.describe("Partners", () => {
  test("organization panel open", async ({ page }) => {
    await page.goto("/admin/partners?org=org_1");
    await expectNoViolations(page);
  });

  test("people row menu open", async ({ page }) => {
    await page.goto("/admin/partners?view=people");
    await page.getByRole("button", { name: /^Actions for /i }).first().click();
    await expectNoViolations(page);
  });

  test("edit details dialog open", async ({ page }) => {
    await page.goto("/admin/partners?view=people");
    await page.getByRole("button", { name: /^Actions for /i }).first().click();
    await page.getByRole("menuitem", { name: /edit details/i }).click();
    await expectNoViolations(page);
  });

  test("invite partner dialog open", async ({ page }) => {
    await page.goto("/admin/partners");
    await page.getByRole("button", { name: /invite partner/i }).click();
    await expectNoViolations(page);
  });

  test("remove access confirm open", async ({ page }) => {
    await page.goto("/admin/partners?org=org_1");
    // Remove access lives in the panel's ⋯ menu.
    await page.getByRole("dialog").getByRole("button", { name: /more actions/i }).click();
    await page.getByRole("menuitem", { name: /remove access/i }).click();
    await expectNoViolations(page);
  });
});

test.describe("Partner portal", () => {

  test("team invite dialog open", async ({ page }) => {
    await page.goto("/partner/organization");
    await page.getByRole("button", { name: /invite colleague/i }).click();
    await expectNoViolations(page);
  });
});

test.describe("320px", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const path of ["/admin/partners?org=org_1", "/partner/organization"]) {
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
