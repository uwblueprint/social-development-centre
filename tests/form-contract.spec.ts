import { expect, test } from "@playwright/test";

test("every kit control submits its value by name", async ({ page }) => {
  await page.goto("/components/form-contract");
  await page.getByRole("button", { name: "Save listing" }).click();

  const output = page.getByLabel("Submitted form data");
  await expect(output).toBeVisible();
  const received = JSON.parse((await output.textContent()) ?? "{}");

  expect(received).toMatchObject({
    organization: ["Northside Food Bank"],
    email: ["not-an-email"],
    type: ["volunteer"],
    startDate: ["2026-10-01"],
    audience: ["youth"],
    visibility: ["public"],
    featured: ["yes"],
  });
  expect(received["hours[]"]).toEqual(["10", "20"]);
  expect(received.notifyPartners).toBeUndefined();

  await expect(page.getByText("Enter an email address like name@example.org.")).toBeVisible();
});
