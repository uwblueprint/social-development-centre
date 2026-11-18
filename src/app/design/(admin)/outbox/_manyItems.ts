import { withDemoTags, type Member, type Send } from "./_data";

/*
 * State lab "Many items": 500 more emails to review on one day, all loaded at once (no paging). They belong
 * to 500 extra members numbered after the seed's 90, so every row has a real person behind it.
 */

export const MANY_COUNT = 500;
/** The day (from today) the extra emails are due. */
export const MANY_DAY = 4;
/** Where the extra members start in the members list. */
export const MANY_FIRST_MEMBER = 90;

const FIRST = ["Aiden", "Bianca", "Callum", "Deepa", "Elias", "Fatima", "Gabriel", "Hana", "Ivan", "Jamila", "Kofi", "Leila", "Mateo", "Nadia", "Omar", "Paloma", "Rhys", "Salma", "Tomas", "Yara"];
const LAST = ["Abara", "Baptiste", "Castillo", "Dhillon", "Eriksen", "Fofana", "Gagnon", "Hossain", "Ivanov", "Jaffer", "Kowalski", "Lavoie", "Mensah", "Novak", "Ortiz", "Pereira", "Quinn", "Rahman", "Silva", "Tanaka"];

export const MANY_MEMBERS: Member[] = Array.from({ length: MANY_COUNT }, (_, i) => {
  const name = `${FIRST[i % 20]} ${LAST[(i * 7 + Math.floor(i / 20)) % 20]}`;
  return {
    id: `x${i}`,
    name,
    first: FIRST[i % 20],
    email: `${name.toLowerCase().split(" ").join(".")}${i}@example.org`,
    tags: withDemoTags(MANY_FIRST_MEMBER + i, []),
    since: -(45 + ((i * 37) % 700)),
  };
});

/** Ids start with this, so the page can keep them apart from the seed's emails. */
export const MANY_PREFIX = "many:";

export const manySends = (): Send[] =>
  MANY_MEMBERS.map((_, i) => ({
    id: `${MANY_PREFIX}${i}`,
    member: MANY_FIRST_MEMBER + i,
    template: "update",
    day: MANY_DAY,
    status: "review",
    subject: null,
    body: null,
  }));
