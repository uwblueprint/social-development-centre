import { MEMBERS, TEMPLATES, type Member, type Template, type TemplateKey } from "./_data";
import { MANY_MEMBERS } from "./_manyItems";
import { SEED_DATA, type OutboxData } from "./_outboxData";

/*
 * State lab data variants: "Long text" (very long member names, tag lists and automatic email names so
 * truncation, wrapping and tooltips can be checked), "Many items" (500 more members) and "Partial data"
 * (some members with no name). Pure: each derives a copy and never touches the seed.
 */

const LONG_NAMES = [
  "Maria-Alexandra Fitzgerald-Montgomery-Vandenberghe",
  "Bartholomew Oluwaseun Adebayo-Ramanathan",
  "Christopher Wolfeschlegelstein-Hausenberger",
];
const LONG_TAGS = [
  "Ride for Refuge: fall fundraising team captain",
  "Monthly donor since 2019",
  "Volunteer: Waterloo Region welcome table",
  "Board committee on governance and nominations",
];
const LONG_TEMPLATE_NAMES: Record<TemplateKey, string> = {
  thanks: "Thank-you for joining the Social Development Centre Waterloo Region community: standard",
  big: "Thank-you for a gift of $1,000 or more to the Social Development Centre Waterloo Region: personal note",
  month: "One-month check-in for new members of the Social Development Centre Waterloo Region",
  update: "Monthly member update from the Social Development Centre Waterloo Region team",
  gala: "Invitation to the annual Social Development Centre Waterloo Region community gala and auction",
};

// Every third member gets a long name and tags; the rest keep theirs so short and long rows sit side by side.
const withLongText = (members: Member[]): Member[] =>
  members.map((m, i) => {
    if (i % 3 !== 0) return m;
    const name = LONG_NAMES[(i / 3) % LONG_NAMES.length];
    return {
      ...m,
      name,
      first: name.split(" ")[0],
      email: `${name.toLowerCase().split(" ").join(".")}@a-very-long-organization-domain.example.org`,
      // Long tags first; the member's own stay so the rule-based "Why this email" still finds its match.
      tags: [...LONG_TAGS, ...m.tags],
    };
  });

// Every fifth member has no name on file: the email address stands in, and the greeting falls back to "there".
const withPartialData = (members: Member[]): Member[] =>
  members.map((m, i) => (i % 5 === 2 ? { ...m, name: m.email, first: "there", unnamed: true } : m));

const cache = new Map<string, OutboxData>();

/** The data the screen shows: the seed, or a copy with the lab's data variants applied. */
export function outboxData(opts: { longText?: boolean; manyItems?: boolean; partialData?: boolean }): OutboxData {
  const { longText = false, manyItems = false, partialData = false } = opts;
  if (!longText && !manyItems && !partialData) return SEED_DATA;
  const key = `${longText}|${manyItems}|${partialData}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let members = manyItems ? [...MEMBERS, ...MANY_MEMBERS] : MEMBERS;
  if (partialData) members = withPartialData(members);
  if (longText) members = withLongText(members);
  const templates = longText
    ? (Object.fromEntries(
        (Object.keys(TEMPLATES) as TemplateKey[]).map((k): [TemplateKey, Template] => [k, { ...TEMPLATES[k], name: LONG_TEMPLATE_NAMES[k] }]),
      ) as Record<TemplateKey, Template>)
    : TEMPLATES;
  const data: OutboxData = { members, templates };
  cache.set(key, data);
  return data;
}
