import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/*
 * The Ctrl K search palette, on the design Settings screen (demo data, no Supabase needed). People and
 * automatic emails come from /api/admin-search; tests that need it slow, failing or offline intercept it.
 */

const SEARCH_API = "**/api/admin-search";

async function openSettings(page: Page) {
  await page.goto("/design/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  // Hydrated and settled, so the page's own load-time focus handling is done before a test moves focus.
  await page.waitForLoadState("networkidle");
}

const palette = (page: Page) => page.getByRole("dialog", { name: "Search" });
const searchBox = (page: Page) => page.getByRole("combobox", { name: "Search" });
const option = (page: Page, name: string | RegExp) => palette(page).getByRole("option", { name });

/** Hovers until the tooltip shows: a hover that lands before the page hydrates opens nothing. */
async function hoverForTooltip(page: Page, target: Locator) {
  await expect(async () => {
    await page.mouse.move(0, 0);
    await target.hover();
    await expect(page.getByRole("tooltip")).toBeVisible({ timeout: 500 });
  }).toPass();
}

async function openWithShortcut(page: Page) {
  await page.keyboard.press("Control+k");
  await expect(searchBox(page)).toBeFocused();
}

test("Ctrl K and ⌘K open the palette with focus in the search box; Esc closes it and focus goes back", async ({ page }) => {
  await openSettings(page);
  const people = page.getByRole("link", { name: "People" });
  await people.focus();
  await expect(people).toBeFocused();

  await openWithShortcut(page);
  await expect(palette(page).getByText("Jump to")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
  await expect(people).toBeFocused();

  await page.keyboard.press("Meta+k");
  await expect(searchBox(page)).toBeFocused();
  // The shortcut toggles.
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeHidden();
});

test("the sidebar's Search icon names its shortcut and opens the palette", async ({ page }) => {
  await openSettings(page);
  const button = page.getByRole("button", { name: "Search" });
  await hoverForTooltip(page, button);
  // Playwright's Chromium reports the system it runs on: ⌘K on a Mac, Ctrl K elsewhere.
  await expect(page.getByRole("tooltip")).toHaveText(/^Search \((Ctrl K|⌘K)\)$/);
  await button.click();
  await expect(searchBox(page)).toBeFocused();
  // The tooltip doesn't float over the palette, even with the pointer still on the icon.
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("a tooltip under the pointer closes when the shortcut opens the palette", async ({ page }) => {
  await openSettings(page);
  await hoverForTooltip(page, page.getByRole("button", { name: "Search" }));
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(searchBox(page)).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("arrow keys move through results and loop", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  const first = option(page, "People");
  await expect(first).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await expect(option(page, "Outbox")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(option(page, "Documentation")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await expect(first).toHaveAttribute("aria-selected", "true");
});

test("a page result opens the page and focuses its heading", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("admins");
  await expect(option(page, "Admins")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/design\/admins$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("a setting result scrolls to its row, focuses it and marks it", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("reply");
  // Bolds the part that matched.
  await expect(option(page, "Reply-to address").locator("strong")).toHaveText("Reply");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#setting-reply-to$/);
  const row = page.locator("#setting-reply-to");
  await expect(row).toBeFocused();
  await expect(row).toHaveAttribute("data-search-arrived", "on");
  await expect(row).toBeInViewport();
  await expect(row).toHaveAttribute("data-search-arrived", "off");
});

test("hidden search words find a setting", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("notifications");
  await expect(palette(page).getByRole("group", { name: "Settings" }).getByRole("option")).toHaveCount(5);
});

test("a person result goes to them on the People page", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  // Accents don't matter.
  await page.keyboard.type("zoe");
  await expect(option(page, /Zoë Tremblay/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/admin\/members#person-demo-zoe$/);
});

test("an automatic email result opens the email", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("welcome");
  await option(page, "Welcome to SDC").click();
  await expect(page).toHaveURL(/\/admin\/automatic-emails\/demo-welcome$/);
});

test("Ctrl+Enter opens the result in a new tab and keeps the palette open", async ({ page, context }) => {
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("admins");
  const [tab] = await Promise.all([context.waitForEvent("page"), page.keyboard.press("Control+Enter")]);
  await tab.waitForLoadState();
  expect(new URL(tab.url()).pathname).toBe("/design/admins");
  await expect(palette(page)).toBeVisible();
});

test("results opened before show under Recent", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("footer");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#setting-footer$/);

  await openWithShortcut(page);
  await expect(palette(page).getByRole("group", { name: "Recent" }).getByRole("option", { name: /Email footer/ })).toBeVisible();
});

test("nothing found offers a way out", async ({ page }) => {
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("zzqx");
  await expect(palette(page).getByText("Nothing on the menu for “zzqx”")).toBeVisible();
  await palette(page).getByRole("button", { name: "Clear search" }).click();
  await expect(searchBox(page)).toHaveValue("");
  await expect(searchBox(page)).toBeFocused();
  await expect(palette(page).getByText("Jump to")).toBeVisible();
});

test("people load while pages and settings already show", async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(SEARCH_API, async (route) => {
    await held;
    await route.continue();
  });
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("a");

  await expect(option(page, "Admins")).toBeVisible();
  await expect(palette(page).getByRole("progressbar", { name: "Finding people…" })).toBeAttached();
  release();
  await expect(option(page, /Amara Okafor/)).toBeVisible();
  await expect(palette(page).getByRole("progressbar")).toHaveCount(0);
});

test("when the search list fails, pages still show and Try again recovers", async ({ page }) => {
  let fail = true;
  await page.route(SEARCH_API, (route) => (fail ? route.fulfill({ status: 500, body: "" }) : route.continue()));
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("a");

  await expect(palette(page).getByText("Couldn’t load people and automatic emails")).toBeVisible();
  await expect(option(page, "Admins")).toBeVisible();
  fail = false;
  await option(page, "Try again").click();
  await expect(option(page, /Amara Okafor/)).toBeVisible();
  await expect(palette(page).getByText(/Couldn’t load/)).toHaveCount(0);
});

test("one group failing leaves the other", async ({ page }) => {
  await page.route(SEARCH_API, (route) =>
    route.fulfill({
      json: { people: { status: "error" }, emails: { status: "ok", items: [{ id: "e1", name: "Welcome to SDC" }] } },
    }),
  );
  await openSettings(page);
  await openWithShortcut(page);
  await page.keyboard.type("welcome");
  await expect(palette(page).getByText("Couldn’t load people")).toBeVisible();
  await expect(option(page, "Welcome to SDC")).toBeVisible();
});

test("offline, the palette says pages and settings still work", async ({ page, context }) => {
  await openSettings(page);
  await context.setOffline(true);
  await openWithShortcut(page);
  await page.keyboard.type("set");
  await expect(palette(page).getByText("You’re offline. Pages and settings still work")).toBeVisible();
  await expect(option(page, "Settings")).toBeVisible();

  await context.setOffline(false);
  await page.keyboard.press("Control+a");
  await page.keyboard.type("amara");
  // Coming back online retries by itself.
  await expect(option(page, /Amara Okafor/)).toBeVisible();
});

test("a recent person who's been removed drops out of Recent", async ({ page }) => {
  await openSettings(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "potluck:search-recent",
      JSON.stringify([
        { kind: "person", id: "gone", label: "Removed Person" },
        { kind: "setting", id: "name", label: "Your name" },
      ]),
    ),
  );
  await openWithShortcut(page);
  const recent = palette(page).getByRole("group", { name: "Recent" });
  await expect(recent.getByRole("option", { name: /Your name/ })).toBeVisible();
  await expect(recent.getByRole("option", { name: /Removed Person/ })).toHaveCount(0);
});

for (const query of ["", "a", "zzqx"]) {
  test(`the open palette has no WCAG 2.2 AA violations (search: "${query}")`, async ({ page }) => {
    await openSettings(page);
    await openWithShortcut(page);
    await page.keyboard.type(query);
    if (query === "a") await expect(option(page, /Amara Okafor/)).toBeVisible();
    // Let the entrance animation finish: a fade caught midway reads as low contrast.
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
  });
}
