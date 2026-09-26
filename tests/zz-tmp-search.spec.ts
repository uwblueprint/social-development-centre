import { test, expect } from "@playwright/test";

const SHOTS = "/tmp/claude-0/-home-user-social-development-centre/b05bfde4-fb89-5686-897a-6208fd87f737/scratchpad";
const pages = ["/admin/community", "/admin/partners", "/admin/opportunities"];

for (const width of [1440, 360]) {
  for (const path of pages) {
    test(`${path} @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const search = page.getByRole("searchbox");
      await expect(search).toBeVisible();
      await page.screenshot({ path: `${SHOTS}/${path.replaceAll("/", "_")}-${width}.png` });
      const rows = page.locator("tbody tr");
      const before = await rows.count();
      const firstCell = (await rows.first().locator("td").first().innerText()).trim().split(/\s+/)[0];
      const term = firstCell.slice(0, 4);

      // Typing: nothing happens before the pause, then the URL updates.
      await search.pressSequentially(term, { delay: 40 });
      await page.waitForTimeout(100);
      expect(new URL(page.url()).searchParams.get("q")).toBeNull();
      await expect.poll(() => new URL(page.url()).searchParams.get("q"), { timeout: 5000 }).toBe(term);
      await page.waitForLoadState("networkidle");
      const after = await rows.count();
      await expect(search).toHaveValue(term);
      console.log(`${path}@${width}: term="${term}" rows ${before} -> ${after}`);

      // Enter: searches immediately.
      await search.fill("zzzqqq");
      await search.press("Enter");
      await expect.poll(() => new URL(page.url()).searchParams.get("q"), { timeout: 250 }).toBe("zzzqqq");
      await expect(page.getByText(/No match/i).first()).toBeVisible({ timeout: 5000 });

      // ×: clears the field and the search.
      await page.getByRole("button", { name: "Clear search" }).click();
      await expect(search).toHaveValue("");
      await expect.poll(() => new URL(page.url()).searchParams.get("q"), { timeout: 5000 }).toBeNull();
      await expect.poll(() => rows.count(), { timeout: 5000 }).toBe(before);
      await expect(search).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}
