import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe over the emails prototype: every route plus the cheap opened states (batch, confirmations,
 * state lab, compose with recipients). The provider renders after hydration, hence the settle wait.
 */
const BASE = "/emails-pm-prototype";

async function settle(page: Page) {
  await page.waitForTimeout(2000);
}

async function expectNoViolations(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help} [${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}]`)).toEqual([]);
}

test.describe("Emails prototype routes", () => {
  for (const route of [
    "outbox",
    "outbox/reminder",
    "automatic",
    "automatic/new",
    "one-off",
    "one-off/new",
    "one-off/from-member",
    "editor",
    "flags",
    "notes",
  ]) {
    test(`/${route}`, async ({ page }) => {
      await page.goto(`${BASE}/${route}`);
      await settle(page);
      await expectNoViolations(page);
    });
  }
});

test.describe("Emails prototype open states", () => {
  test("outbox with a batch opened", async ({ page }) => {
    await page.goto(`${BASE}/outbox`);
    await settle(page);
    await page.getByRole("button", { name: /One-month check-in.*18 members/ }).click();
    await expect(page.getByText(/To Amira Haddad|Amira Haddad/).first()).toBeVisible();
    await expectNoViolations(page);
  });

  test("outbox with a recipient preview", async ({ page }) => {
    await page.goto(`${BASE}/outbox`);
    await settle(page);
    await page.getByRole("button", { name: /One-month check-in.*18 members/ }).click();
    await page.getByRole("button", { name: /Amira Haddad/ }).first().click();
    await page.waitForTimeout(500);
    await expectNoViolations(page);
  });

  test("automatic email: publish confirmation", async ({ page }) => {
    await page.goto(`${BASE}/automatic/a4`);
    await settle(page);
    await page.getByRole("button", { name: /^publish$/i }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expectNoViolations(page);
  });

  test("automatic email: unpublish confirmation", async ({ page }) => {
    await page.goto(`${BASE}/automatic/a1`);
    await settle(page);
    await page.getByRole("button", { name: "Unpublish", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expectNoViolations(page);
  });

  test("state lab sheet open", async ({ page }) => {
    await page.goto(`${BASE}/outbox`);
    await settle(page);
    await page.getByRole("button", { name: /state lab/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoViolations(page);
  });

  test("one-off compose with recipients", async ({ page }) => {
    await page.goto(`${BASE}/one-off/new`);
    await settle(page);
    await expect(page.getByText(/\d+ members?/).first()).toBeVisible();
    await expectNoViolations(page);
  });
});
