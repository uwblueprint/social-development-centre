import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 360, height: 740 } });

test("drawer focus handling at 360px", async ({ page }) => {
  await page.goto("/admin/partners");
  const menu = page.getByRole("button", { name: "Open menu" });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  const controls = await menu.getAttribute("aria-controls");
  expect(controls).toBeTruthy();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const close = page.getByRole("button", { name: "Close menu" });
  await expect(close).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open account menu for Admin User" })).toHaveAttribute("aria-expanded", "false");
  // Trap: Shift+Tab from the first element wraps to the last, Tab wraps back.
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Open account menu for Admin User" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate((id) => !!document.getElementById(id!)?.contains(document.activeElement), controls);
    expect(inside).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  // Choose a section: focus lands on the destination's h1.
  await menu.click();
  await page.getByRole("link", { name: "Opportunities" }).click();
  await page.waitForURL(/\/admin\/opportunities/);
  await expect(page.locator("main h1").first()).toBeFocused({ timeout: 15000 });
  // Resize closes the drawer.
  await menu.click();
  await page.setViewportSize({ width: 1024, height: 740 });
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
});

test("dialog opens and closes with animation", async ({ page }) => {
  await page.goto("/components#overlays");
  await page.locator("#overlays").getByRole("button").first().click();
  const dialog = page.getByRole("dialog").or(page.getByRole("alertdialog")).first();
  await expect(dialog).toBeVisible();
  const anim = await dialog.evaluate((el) => getComputedStyle(el).animationDuration);
  expect(anim).not.toBe("0s");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
