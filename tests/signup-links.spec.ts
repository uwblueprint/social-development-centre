import { expect, test } from "@playwright/test";
import { signupLinksCsv } from "@/features/signup-links/csv";
import { conversion, slugify } from "@/features/signup-links/links";

/**
 * Signup links without a database: the slug and CSV rules, and the join steps carrying the link's
 * source and visit id from the welcome step to the thank-you step. The counts themselves are checked
 * by the database functions (docs/backend/signup-links.md).
 */

test("slugs are lowercase, unaccented and hyphenated", () => {
  expect(slugify("Fall community fair")).toBe("fall-community-fair");
  expect(slugify("  Library pop-up: Kitchener!  ")).toBe("library-pop-up-kitchener");
  expect(slugify("Soirée des nouveaux arrivants")).toBe("soiree-des-nouveaux-arrivants");
  expect(slugify("🎉")).toBe("link");
});

test("conversion is joins over clicks, and a dash before anyone clicks", () => {
  expect(conversion({ clicks: 0, joins: 0 })).toBe("–");
  expect(conversion({ clicks: 3, joins: 1 })).toBe("33%");
});

test("the CSV quotes commas and keeps formulas as text", () => {
  const csv = signupLinksCsv([
    { id: "1", name: "Fair, fall", slug: "fair-fall", clicks: 4, joins: 1 },
    { id: "2", name: "=1+1", slug: "1-1", clicks: 0, joins: 0 },
  ]);
  const [header, first, second] = csv.replace(/^﻿/, "").split("\r\n");
  expect(header).toBe("Name,Link,Clicks,Joins,Conversion");
  expect(first).toMatch(/^"Fair, fall",https:\/\/.+\?source=fair-fall,4,1,25%$/);
  expect(second).toMatch(/^'=1\+1,.+,0,0,$/);
});

/** Server action calls the join steps make to count a click or a join. */
function countRequests(page: import("@playwright/test").Page) {
  const paths: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) paths.push(new URL(request.url()).pathname);
  });
  return paths;
}

test("the join steps keep the link's source and visit to the end, and count the first and last step", async ({
  page,
}) => {
  const counted = countRequests(page);
  await page.goto("/join?source=fall-community-fair");
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await expect.poll(() => counted).toEqual(["/join"]);

  for (const step of ["Add your details", "Pay us", "Thank you!"]) {
    await page.getByRole("link", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: step })).toBeVisible();
    const url = new URL(page.url());
    expect(url.searchParams.get("source")).toBe("fall-community-fair");
    expect(url.searchParams.get("visit")).toMatch(/^[0-9a-f-]{36}$/);
  }
  await expect.poll(() => counted).toEqual(["/join", "/join/thank-you"]);
});

test("without a source the join steps still work and count nothing", async ({ page }) => {
  const counted = countRequests(page);
  await page.goto("/join");
  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Add your details" })).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  expect(counted).toEqual([]);
});
