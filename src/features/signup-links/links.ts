/**
 * Signup links, as the screens receive them, and the helpers both the browser and the server use.
 * Backend: docs/backend/signup-links.md.
 */

export interface SignupLink {
  id: string;
  /** The event the link was made for, as the admin typed it. */
  name: string;
  /** What the link carries as `?source=`: lowercase and hyphenated, unique across links, never changed. */
  slug: string;
  /** Times the join page was opened from this link. */
  clicks: number;
  /** Times someone reached the end of the join steps after opening this link. */
  joins: number;
}

/** The longest event name the database takes. */
export const MAX_EVENT_NAME_LENGTH = 500;

/**
 * The join page every link points at. Printed QR codes carry it, so set NEXT_PUBLIC_JOIN_URL only to
 * point local and preview builds at themselves (e.g. http://localhost:3000/join).
 */
const JOIN_URL = process.env.NEXT_PUBLIC_JOIN_URL || "https://join.socialdevelopmentcentre.ca/join";

export function signupLinkUrl(slug: string): string {
  return `${JOIN_URL}?source=${slug}`;
}

/**
 * "Fall community fair" becomes "fall-community-fair": accents stripped, anything that isn't a letter or
 * digit collapsed to one hyphen. The database adds -2, -3 and so on when another link has it.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "link";
}

const percent = new Intl.NumberFormat("en-CA", { style: "percent", maximumFractionDigits: 0 });

/** Joins as a share of clicks, or an en dash when nobody has clicked yet. */
export function conversion(link: Pick<SignupLink, "clicks" | "joins">): string {
  return link.clicks === 0 ? "–" : percent.format(link.joins / link.clicks);
}
