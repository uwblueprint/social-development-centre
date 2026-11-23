import { expect, test } from "@playwright/test";
import { normalize, rank, scoreText } from "../src/features/search/rank";

/* Unit tests for the palette's ranking (no browser). */

const people = [
  { label: "Joan Smith", detail: "joan.smith@example.com" },
  { label: "Jo Anderson", detail: "jo@example.com" },
  { label: "Zoë Tremblay", detail: "zoe.t@example.com" },
  { label: "Dan Joseph", detail: "dan@example.com" },
  { label: "Settings", keywords: ["account", "preferences"] },
];
const labels = (query: string) => rank(people, query).map((r) => r.item.label);

test("a whole word beats the start of a name, which beats the start of a later word", () => {
  expect(labels("jo")).toEqual(["Jo Anderson", "Joan Smith", "Dan Joseph"]);
  expect(labels("joan smith")[0]).toBe("Joan Smith");
});

test("case and accents don't matter, and the range still lines up with the original text", () => {
  const [hit] = rank(people, "ZOE");
  expect(hit.item.label).toBe("Zoë Tremblay");
  expect(hit.range).toEqual([0, 3]);
  expect(normalize("Zoë").length).toBe("Zoë".length);
});

test("several words match when each starts a word, in any order", () => {
  expect(labels("jo sm")).toEqual(["Joan Smith"]);
  expect(labels("smith jo")).toEqual(["Joan Smith"]);
  expect(labels("jo xy")).toEqual([]);
});

test("anywhere in a word only counts from three letters", () => {
  expect(scoreText("Anderson", "de").score).toBe(0);
  expect(scoreText("Anderson", "der")).toEqual({ score: 30, range: [2, 5] });
});

test("keywords and details find a result without bolding the label", () => {
  expect(rank(people, "prefer")).toEqual([{ item: people[4], range: null }]);
  expect(rank(people, "zoe.t")[0]).toEqual({ item: people[2], range: null });
});

test("an empty or blank query matches nothing", () => {
  expect(labels("")).toEqual([]);
  expect(labels("   ")).toEqual([]);
});

test("extra spaces are ignored and the limit holds", () => {
  expect(labels("  jo   sm ")).toEqual(["Joan Smith"]);
  expect(rank(people, "o", 2)).toHaveLength(0);
  expect(rank([...Array(10)].map((_, i) => ({ label: `Row ${i}` })), "row", 5)).toHaveLength(5);
});
