import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "/components",
  "/admin/opportunities",
  "/admin/opportunities/new?kind=event",
  "/admin/partners",
  "/admin/community",
  "/partner/opportunities",
  "/partner/organization",
];

async function settle(page: import("@playwright/test").Page) {
  // Wait for the variable font to finish loading and settle a frame: scanning
  // mid-swap can make axe misjudge text contrast from anti-aliased glyphs.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function checkA11y(page: import("@playwright/test").Page, excludeSelectors: string[] = []) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  for (const selector of excludeSelectors) builder = builder.exclude(selector);
  const results = await builder.analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
}

// The member sheet's email bodies render in `sandbox=""` iframes (a unique opaque origin, by design —
// see MemberEmails.tsx): axe can't inject into that origin to scan it and analyze() hangs until Playwright's
// own timeout. Exclude it; its content is a static rendered email, not kit UI, and the frame itself has
// an accessible name (`title`).
const SANDBOXED_EMAIL_FRAME = 'iframe[sandbox=""]';

for (const path of routes) test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
  await page.goto(path);
  await settle(page);
  await checkA11y(page);
});

test.describe("login", () => {
  test("sign-in error state has no violations", async ({ page }) => {
    await page.goto("/login");
    await settle(page);
    await page.getByRole("button", { name: "Send sign-in link" }).click();
    await expect(page.getByText("Enter an email address like name@example.org.")).toBeVisible();
    await checkA11y(page);
  });

  test("signed-out goodbye has no violations", async ({ page }) => {
    await page.goto("/login?signedOut=1&name=Amara");
    await settle(page);
    await expect(page.getByRole("status")).toContainText("You're signed out");
    await checkA11y(page);
  });
});

test.describe("kiosk", () => {
  test("validation error state has no violations", async ({ page }) => {
    await page.goto("/kiosk");
    await settle(page);
    await page.getByRole("button", { name: "Sign me up" }).click();
    await page.waitForTimeout(200);
    await checkA11y(page);
  });

  test("success screen with countdown has no violations", async ({ page }) => {
    await page.goto("/kiosk");
    await settle(page);
    await page.getByLabel("Name", { exact: false }).fill("Ada Lovelace");
    await page.getByLabel("Email", { exact: false }).fill("ada@example.org");
    await page.getByRole("button", { name: "Sign me up" }).click();
    await page.waitForTimeout(300);
    await checkA11y(page);
  });
});

test.describe("admin shell", () => {
  test("My account dialog has no violations", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.getByRole("button", { name: /Open account menu/ }).click();
    await page.getByRole("menuitem", { name: "My account" }).click();
    await page.waitForTimeout(250);
    await checkA11y(page);
  });

  test("account menu and a row's ⋯ menu open without hiding tabbable content (WCAG 4.1.2)", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.getByRole("button", { name: /Open account menu/ }).click();
    await page.waitForTimeout(200);
    await checkA11y(page);
    await page.keyboard.press("Escape");

    await page.locator('button[aria-label^="Actions for"]').first().click();
    await page.waitForTimeout(200);
    await checkA11y(page);
  });

  test("mobile drawer at 320px has no violations", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/admin/community");
    await settle(page);
    // The tabs' roving-tabindex mount effect lands a little after `settle`'s wait; give it room so the
    // scan doesn't catch the momentary state where neither tab nor the list itself is in the tab order.
    await page.waitForTimeout(300);
    await checkA11y(page); // reflow, no drawer open
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(400);
    await checkA11y(page);
  });
});

test.describe("community", () => {
  test("Add members dialog (single and import views) has no violations", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.getByRole("button", { name: "Add members" }).click();
    await page.waitForTimeout(250);
    await checkA11y(page);
    await page.getByRole("button", { name: "Import from a file" }).click();
    await page.waitForTimeout(250);
    await checkA11y(page);
  });

  test("Export dialog has no violations", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.getByRole("button", { name: "Export" }).click();
    await page.waitForTimeout(250);
    await checkA11y(page);
  });

  test("kiosk launcher dialog has no violations", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.getByRole("button", { name: "Open sign-up kiosk" }).click();
    await page.waitForTimeout(250);
    await checkA11y(page);
  });

  test("member sheet, its convert and delete confirm dialogs have no violations", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.locator("tbody tr").first().click();
    await page.waitForTimeout(250);
    await checkA11y(page, [SANDBOXED_EMAIL_FRAME]);

    await page.getByRole("button", { name: "Delete member" }).click();
    await page.waitForTimeout(250);
    await checkA11y(page, [SANDBOXED_EMAIL_FRAME]);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);

    await page.getByRole("button", { name: /Convert to paying member|Remove paying access/ }).click();
    await page.waitForTimeout(250);
    await checkA11y(page, [SANDBOXED_EMAIL_FRAME]);
  });

  test("column filter popover (staged Apply) has no violations", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.getByRole("button", { name: /Filter Status/ }).click();
    await page.waitForTimeout(250);
    await checkA11y(page);
  });

  test("sort busy state has no violations", async ({ page }) => {
    await page.goto("/admin/community");
    await settle(page);
    await page.getByRole("button", { name: /Name/ }).click();
    await page.waitForTimeout(30);
    await checkA11y(page);
  });
});
