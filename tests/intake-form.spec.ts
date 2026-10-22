import { expect, test } from "@playwright/test";

/**
 * The intake form keeps its answers in React state across steps. React resets a form once it has
 * run the form's `action`, and that reset reaches the selection controls, which report it back
 * through onCheckedChange/onValueChange and clear answers already given — so every step but the
 * last submits without a form action. These tests fail if that regresses: they need no database,
 * only that answers survive moving between steps.
 */

/** The page's own buttons; "Next" would otherwise also match the Next.js dev tools button. */
const inForm = (page: import("@playwright/test").Page) => page.locator("form");
const advance = (page: import("@playwright/test").Page) =>
  inForm(page).getByRole("button", { name: /^(Next|Skip for now)$/ });

/* The form opens on a closed envelope; the letter is behind it. */
async function openLetter(page: import("@playwright/test").Page) {
  await page.goto("/intake-form");
  await page.getByRole("button", { name: "Open your letter from SDC" }).click();
}

async function startAndFillDetails(page: import("@playwright/test").Page) {
  await openLetter(page);
  await inForm(page).getByRole("button", { name: "Begin survey" }).click();
  await page.locator('input[name="firstName"]').fill("Ada");
  await page.locator('input[name="lastName"]').fill("Lovelace");
  await page.locator('input[name="email"]').fill("ada@example.com");
  await advance(page).click();
}

test("answers survive moving between steps", async ({ page }) => {
  await startAndFillDetails(page);

  const topics = page.locator('label[for^="topics-"]');
  await topics.nth(0).click();
  await topics.nth(1).click();
  await expect(page.locator("label[data-checked]")).toHaveCount(2);

  // Forward, then back: the two topics must still be chosen.
  await advance(page).click();
  await inForm(page).getByRole("button", { name: "Back" }).click();
  await expect(page.locator("label[data-checked]")).toHaveCount(2);

  // And the details typed earlier are still there.
  await inForm(page).getByRole("button", { name: "Back" }).click();
  await expect(page.locator('input[name="firstName"]')).toHaveValue("Ada");
  await expect(page.locator('input[name="email"]')).toHaveValue("ada@example.com");
});

test("the details step requires a name and a real email address", async ({ page }) => {
  await openLetter(page);
  await inForm(page).getByRole("button", { name: "Begin survey" }).click();

  // Nothing filled in: the form stays put and says what's missing.
  await advance(page).click();
  await expect(page.getByText("Enter your first name.")).toBeVisible();
  await expect(page.getByText("Enter your last name.")).toBeVisible();
  await expect(page.getByText("Enter your email address.")).toBeVisible();

  await page.locator('input[name="firstName"]').fill("Ada");
  await page.locator('input[name="lastName"]').fill("Lovelace");
  await page.locator('input[name="email"]').fill("not-an-email");
  await advance(page).click();
  await expect(page.getByText("Enter an email address like name@example.com.")).toBeVisible();

  // A real address moves on to the first question.
  await page.locator('input[name="email"]').fill("ada@example.com");
  await advance(page).click();
  await expect(inForm(page).getByText("Which issues would you like to hear about or get involved in?")).toBeVisible();
});
