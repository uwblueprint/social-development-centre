/**
 * Signup links, as the design screen receives them. Demo data only: the real list, creation and
 * counts are specified in docs/backend/signup-links.md.
 */

export interface SignupLink {
  id: string;
  /** The event the link was made for, as the admin typed it. */
  name: string;
  /** What the link carries as `?source=`: lowercase and hyphenated, unique across links. */
  slug: string;
  /** Times the join page was opened from this link. */
  clicks: number;
  /** Times Join was clicked after opening this link. */
  joins: number;
}

const JOIN_URL = "https://join.socialdevelopmentcentre.ca/join";

export function signupLinkUrl(slug: string): string {
  return `${JOIN_URL}?source=${slug}`;
}

/** "Fall community fair" becomes "fall-community-fair". */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "link";
}

/** The slug for a name, with -2, -3 and so on added when another link already has it. */
export function uniqueSlug(name: string, taken: string[]): string {
  const base = slugify(name);
  let slug = base;
  for (let n = 2; taken.includes(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

const percent = new Intl.NumberFormat("en-CA", { style: "percent", maximumFractionDigits: 0 });

/** Joins as a share of clicks, or an en dash when nobody has clicked yet. */
export function conversion(link: Pick<SignupLink, "clicks" | "joins">): string {
  return link.clicks === 0 ? "–" : percent.format(link.joins / link.clicks);
}

/** Newest first. */
export const demoSignupLinks: SignupLink[] = [
  { id: "l6", name: "Library pop-up: Kitchener", slug: "library-pop-up-kitchener", clicks: 118, joins: 52 },
  { id: "l5", name: "Volunteer open house", slug: "volunteer-open-house", clicks: 96, joins: 31 },
  { id: "l4", name: "Newcomer welcome night", slug: "newcomer-welcome-night", clicks: 64, joins: 47 },
  {
    id: "l3",
    name: "Community conversation on housing, tenant rights and eviction prevention: Waterloo Region town hall",
    slug: "community-conversation-on-housing-tenant-rights-and-eviction-prevention-waterloo-region-town-hall",
    clicks: 73,
    joins: 22,
  },
  { id: "l2", name: "Fall community fair", slug: "fall-community-fair", clicks: 482, joins: 37 },
  { id: "l1", name: "Summer block party", slug: "summer-block-party", clicks: 207, joins: 58 },
];
