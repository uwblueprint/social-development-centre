import { expect, test } from "@playwright/test";

test("invalid event publish: summary + focus, no toast", async ({ page }) => {
  await page.goto("/admin/opportunities/new?kind=event");
  await page.getByLabel("Title").fill("Temp check event");
  await page.getByRole("button", { name: "Publish" }).click();
  const summary = page.getByRole("alert").filter({ hasText: "to publish this event" });
  await expect(summary).toBeVisible();
  console.log("SUMMARY:", (await summary.innerText()).replace(/\n/g, " | "));
  const focusedId = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  console.log("FOCUSED:", focusedId);
  expect(focusedId).toBe("opportunity-summary");
  await expect(page.getByText("Fix the highlighted fields")).toHaveCount(0);
  const toasts = await page.locator("[data-radix-toast-viewport] li, ol[tabindex] li").count();
  console.log("TOASTS:", toasts);
  expect(toasts).toBe(0);
  // Clicking a summary link focuses its field.
  await summary.getByRole("link", { name: "Add the link where people take action." }).click();
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("opportunity-link");
});

test("publish with sdckw.ca, then close and reopen", async ({ page }) => {
  await page.goto("/admin/opportunities/new?kind=other");
  const title = `Temp link check ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Short description").fill("Checking link normalization.");
  await page.getByRole("button", { name: "Civic participation" }).click();
  await page.getByLabel("Link").fill("sdckw.ca");
  await page.getByLabel("Call to action").fill("Take the survey");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Published. Members can now see this opportunity.")).toBeVisible();
  await expect(page).toHaveURL(/tab=published/);
  await page.getByText(title).click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("link", { name: "https://sdckw.ca" })).toBeVisible();
  await expect(panel.getByText("Published", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Close" }).click();
  await expect(page.getByText("Closed. This opportunity won't be recommended to members or included in emails.")).toBeVisible();
  await page.getByRole("tab", { name: /Closed/ }).click();
  await page.getByText(title).click();
  await page.getByRole("dialog").getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Reopen" }).click();
  await expect(page.getByText("Reopened. Members can see this opportunity again.")).toBeVisible();
  // Clean up.
  await page.getByRole("tab", { name: /Published/ }).click();
  await page.getByText(title).click();
  await page.getByRole("dialog").getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(`Deleted “${title}”.`)).toBeVisible();
});

test("removed partner listing shows Partner access removed", async ({ page }) => {
  await page.goto("/admin/opportunities?tab=closed");
  await expect(page.getByText("Partner access removed").first()).toBeVisible();
  await page.getByText("Garden bed builders").click();
  await page.getByRole("dialog").getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Reopen" }).click();
  await expect(page.getByText("This partner no longer has access. Reinvite them before reopening their opportunities.")).toBeVisible();
});
