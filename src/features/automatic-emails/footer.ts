/**
 * The footer on every automatic email, from the design (src/app/design/automatic-emails in #53). The
 * editor shows it under the message, the preview shows it, and the sender appends it with the
 * unsubscribe and refer links.
 */
export const EMAIL_FOOTER = {
  reason: "You're getting this because you're an SDC member.",
  organization: "Social Development Centre Waterloo Region",
  // Still a placeholder in the design. Replace it before production sending.
  address: "Mailing address to come",
  contact: "suhanya@waterlooregion.org",
};

/** Replies go to Suhanya, as the preview's Reply-to line says. */
export const REPLY_TO = EMAIL_FOOTER.contact;

/**
 * The refer link: always in the footer, next to Unsubscribe and Cancel membership. Admins can change
 * its text in Settings but can't remove it. These rules match `set_refer_link_text` and the
 * `email_settings` table's check (supabase/migrations/20261127000000_refer_link_text.sql).
 */
export const REFER_LINK = {
  defaultText: "Refer a friend",
  maxLength: 40,
};

/** Line breaks, tabs and runs of spaces become one space; then trimmed. What the database stores. */
export function normalizeReferLinkText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

// Control and invisible formatting characters (soft hyphen, zero-width, bidi overrides, BOM), and < >.
const UNSAFE = /[<>\p{Cc}\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/u;
// Text that reads as an address: spam filters flag a link whose text doesn't match where it goes.
const LOOKS_LIKE_ADDRESS = /@|:\/\/|www\./i;

/** The error to show for refer link text, or undefined if it can be saved. Expects normalized text. */
export function referLinkTextError(text: string): string | undefined {
  if (!text) return "Enter the link text. The link stays in every email, so it needs words.";
  // Counted in characters as the database counts them, so an emoji is one.
  if ([...text].length > REFER_LINK.maxLength) return `Use ${REFER_LINK.maxLength} characters or fewer.`;
  if (LOOKS_LIKE_ADDRESS.test(text)) return "Use words, not a web or email address.";
  if (UNSAFE.test(text)) return "Remove the < or > or any hidden characters.";
  return undefined;
}

/** Saved text, or the default if it's missing or something the footer can't show. Never blank. */
export function referLinkTextOrDefault(value: string | null | undefined) {
  const text = normalizeReferLinkText(value ?? "");
  return text && !referLinkTextError(text) ? text : REFER_LINK.defaultText;
}
