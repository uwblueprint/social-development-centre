import { expect, test } from "@playwright/test";
import type { IntakePageVisitPayload } from "@/features/intake/analytics";

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
  await page.goto("/intake-form/ride-for-refuage");
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

  await page
    .getByRole("listitem", { name: "Rank 1: Housing, tenant rights, and eviction prevention" })
    .dragTo(page.getByRole("listitem", { name: "Rank 3: Climate resilience, environmental justice, and community-led climate action" }));
  await expect(page.getByRole("listitem", { name: "Rank 3: Housing, tenant rights, and eviction prevention" })).toBeVisible();

  // Back to details, then forward: the reordered topics must still be in the same positions.
  await inForm(page).getByRole("button", { name: "Back" }).click();
  await expect(page.locator('input[name="firstName"]')).toHaveValue("Ada");
  await expect(page.locator('input[name="email"]')).toHaveValue("ada@example.com");
  await advance(page).click();
  await expect(page.getByRole("listitem", { name: "Rank 3: Housing, tenant rights, and eviction prevention" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "Rank 1: Homelessness, encampments, and ending chronic homelessness" })).toBeVisible();
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
  await expect(inForm(page).getByRole("heading", { name: /Which topics would you most like to see featured/ })).toBeVisible();
});

test("records step timing and non-contact answers", async ({ page }) => {
  const visits: IntakePageVisitPayload[] = [];
  await page.route("**/api/intake/page-visits", async (route) => {
    visits.push(route.request().postDataJSON() as IntakePageVisitPayload);
    await route.fulfill({ status: 204 });
  });

  await openLetter(page);
  await expect(page.getByText(/SDC records which pages you visit/)).toBeVisible();
  await inForm(page).getByRole("button", { name: "Begin survey" }).click();
  await expect.poll(() => visits.length).toBe(1);
  expect(visits[0]).toMatchObject({
    key_id: null,
    page_key: "welcome",
    left_via: "next",
    answers: [],
  });
  expect(visits[0].person_id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(visits[0].active_ms).toBeLessThanOrEqual(visits[0].total_ms);
  expect(visits[0].from).toBe("ride-for-refuage");

  await page.locator('input[name="firstName"]').fill("Ada");
  await page.locator('input[name="lastName"]').fill("Lovelace");
  await page.locator('input[name="email"]').fill("Ada@Example.com");
  await advance(page).click();
  await expect.poll(() => visits.length).toBe(2);
  expect(visits[1]).toMatchObject({
    key_id: "ada@example.com",
    page_key: "contact",
    left_via: "next",
    answers: [],
  });

  await page.getByRole("button", { name: "Move Housing, tenant rights, and eviction prevention down" }).click();
  await advance(page).click();
  await expect.poll(() => visits.length).toBe(3);
  expect(visits[2]).toMatchObject({
    page_key: "topics",
    left_via: "next",
    answers: [
      {
        field: "topics",
        value: [
          { rank: 1, topic: "Homelessness, encampments, and ending chronic homelessness" },
          { rank: 2, topic: "Housing, tenant rights, and eviction prevention" },
          { rank: 3, topic: "Climate resilience, environmental justice, and community-led climate action" },
          { rank: 4, topic: "Lived expertise and community-led policy change" },
          { rank: 5, topic: "Grassroots groups, community organizing, and the Civic Hub" },
          { rank: 6, topic: "Neighbourhood connections and community-building" },
          { rank: 7, topic: "Research, policy, and social justice" },
          { rank: 8, topic: "Arts-based approaches to civic and community engagement" },
          { rank: 9, topic: "Other" },
        ],
      },
    ],
  });
  expect(visits[2].first_answer_ms).not.toBeNull();
  expect(visits[2].last_answer_ms).not.toBeNull();
});

test("records choosing not interested without saving a submission", async ({ page }) => {
  const visits: IntakePageVisitPayload[] = [];
  await page.route("**/api/intake/page-visits", async (route) => {
    visits.push(route.request().postDataJSON() as IntakePageVisitPayload);
    await route.fulfill({ status: 204 });
  });

  await openLetter(page);
  await page.getByRole("button", { name: "Not interested" }).click();
  await expect(page.getByText(/Your submission wasn't saved/)).toBeVisible();
  await expect.poll(() => visits.length).toBe(1);
  expect(visits[0]).toMatchObject({
    page_key: "welcome",
    left_via: "not_interested",
    answers: [],
    key_id: null,
  });
});

test("the page-visits endpoint is reachable without signing in", async ({ request }) => {
  const response = await request.post("/api/intake/page-visits", { data: {} });
  expect(response.status()).toBe(400);
});

test("the two intake routes have the right introduction, branding and analytics source", async ({ page }) => {
  const visits: IntakePageVisitPayload[] = [];
  await page.route("**/api/intake/page-visits", async (route) => {
    visits.push(route.request().postDataJSON() as IntakePageVisitPayload);
    await route.fulfill({ status: 204 });
  });

  await page.goto("/intake-form/ride-for-refuage");
  await page.getByRole("button", { name: "Open your letter from SDC" }).click();
  await expect(page.getByText("Thank you for supporting the 2026 Ride for Refuge!")).toBeVisible();
  await expect(page.getByRole("img", { name: "Ride for Refuge" })).toBeVisible();
  await page.getByRole("button", { name: "Begin survey" }).click();
  await expect.poll(() => visits.length).toBe(1);
  expect(visits[0].from).toBe("ride-for-refuage");

  await page.goto("/intake-form/sdc-members");
  await page.getByRole("button", { name: "Open your letter from SDC" }).click();
  await expect(page.getByRole("heading", { name: "Help us get to know you better" })).toBeVisible();
  await expect(page.getByText("Thank you for being an SDC member.", { exact: false })).toBeVisible();
  await expect(page.getByRole("img", { name: "Ride for Refuge" })).toHaveCount(0);
  await page.getByRole("button", { name: "Begin survey" }).click();
  await expect.poll(() => visits.some((visit) => visit.from === "sdc-members")).toBe(true);
});

test("the topic ranking can be skipped entirely", async ({ page }) => {
  await startAndFillDetails(page);
  await advance(page).click();
  await expect(inForm(page).getByRole("heading", { name: /How would you most like to connect with SDC/ })).toBeVisible();
});
