import { expect, test } from "@playwright/test";
test("paying search matching only unsubscribed people", async ({ page }) => {
  await page.goto("/admin/community?tab=paying");
  await page.getByRole("searchbox", { name: "Search by name or email" }).fill("tom.okafor7@");
  await expect(page.getByText("No paying members match “tom.okafor7@”")).toBeVisible();
  await expect(page.getByText("1 unsubscribed person matches. They appear at the end of General members.")).toBeVisible();
  await expect(page.getByText(/Check the spelling/)).toHaveCount(0);
  await page.getByRole("button", { name: "Show in General members" }).click();
  await expect(page.getByRole("tab", { name: /General members/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("cell", { name: /tom\.okafor7@example\.org/ })).toBeVisible();
});
test("zzz still says check the spelling", async ({ page }) => {
  await page.goto("/admin/community?tab=paying");
  await page.getByRole("searchbox", { name: "Search by name or email" }).fill("zzz");
  await expect(page.getByText("Searched names and emails. Check the spelling, or clear the search.")).toBeVisible();
});
