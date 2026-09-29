import { expect, test } from "@playwright/test";
import { firstName } from "../src/app/kiosk/firstName";

// A plain unit test: no page needed. Keep in step with docs/decisions/kiosk.md, "Greeting by first name".
const cases: [string, string][] = [
  ["  Jane Smith  ", "Jane"],
  ["Smith, Jane", "Jane"],
  ["Dr. Jane Smith", "Jane"],
  ["dr jane smith", "Jane"],
  ["MRS. Amara Okafor", "Amara"],
  ["Prof Rev Kim Lee", "Kim"],
  ["Okafor, Mx. Sam", "Sam"],
  ["jean-luc", "Jean-luc"],
  ["de la Cruz", "de"],
  ["JANE", "JANE"],
  ["Smith,", "Smith"],
  ["Dr.", "Dr."],
  ["Madame Curie", "Madame"],
];

test("kiosk greets people by first name", () => {
  for (const [input, expected] of cases) expect(firstName(input), input).toBe(expected);
});
