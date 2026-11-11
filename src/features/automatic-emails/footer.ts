/**
 * The footer on every automatic email, from the design (src/app/design/automatic-emails in #53). The
 * editor shows it under the message, the preview shows it, and the sender appends it with the
 * unsubscribe link.
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
