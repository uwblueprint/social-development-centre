import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("import members preview groups", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/admin/community");
  await page.getByRole("button", { name: "Import members" }).click();
  const dialog = page.getByRole("dialog");
  // Empty submit: inline error, focus moves to the field.
  await dialog.getByRole("button", { name: "Continue" }).click();
  await expect(dialog.getByText("Paste email addresses or upload a CSV file.")).toBeVisible();
  await expect(dialog.getByLabel(/Email addresses/)).toBeFocused();
  await dialog.getByLabel(/Email addresses/).fill(
    [
      "New Person <new.person@example.org>",
      "AMARA.OKAFOR0@example.org",
      "sam.okafor3@example.org",
      "new.person@example.org",
      "not-an-email",
      "mei.romero32@example.org",
      "tom.okafor7@example.org",
    ].join("\n"),
  );
  await dialog.getByRole("checkbox", { name: "Make them paying members" }).click();
  await dialog.getByRole("button", { name: "Continue" }).click();
  const labels = await dialog.locator("ul > li > div > button").allInnerTexts();
  console.log("GROUPS:", JSON.stringify(labels));
  console.log("SUMMARY:", await dialog.getByRole("status").last().innerText());
  console.log("BUTTON:", await dialog.getByRole("button", { name: /^Confirm/ }).innerText());
  await dialog.getByRole("checkbox", { name: /^Resubscribe/ }).click();
  console.log("AFTER RESUB:", await dialog.getByRole("status").last().innerText(), "|", await dialog.getByRole("button", { name: /^Confirm/ }).innerText());
  await dialog.getByRole("button", { name: /unsubscribed themselves/ }).click();
  console.log("SELF DETAIL:", await dialog.locator("li", { hasText: "unsubscribed themselves" }).innerText());
  const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  console.log("AXE:", JSON.stringify(axe.violations.map((v) => v.id)));
  await page.setViewportSize({ width: 360, height: 740 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log("OVERFLOW360:", overflow);
  await page.screenshot({ path: "/tmp/claude-0/-home-user-social-development-centre/b05bfde4-fb89-5686-897a-6208fd87f737/scratchpad/preview.png" });
});
