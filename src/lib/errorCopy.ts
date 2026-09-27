/**
 * Strings for the route error boundaries (error.tsx) of areas that don't have a copy file of their own
 * yet, or whose copy file is being edited elsewhere. Community's live in its `_copy.ts` (`loadError`).
 * The owner edits them here. See docs/ux/portal.md, "Empty and error states".
 */
import { SDC_CONTACT_EMAIL } from "./contact";

const body = "Your data is safe; this is a loading problem.";
const retry = "Try again";
/** Partner portal only: admins are SDC. */
const contact = `If it keeps happening, contact SDC at ${SDC_CONTACT_EMAIL}.`;

export const errorCopy = {
  admin: {
    /** /admin: any admin page without a boundary of its own (My account, Insights). */
    portal: { title: "We couldn't load this page.", body, retry },
    opportunities: { title: "We couldn't load Opportunities.", body, retry },
    partners: { title: "We couldn't load Partners.", body, retry },
  },
  partner: {
    /** /partner: any partner page without a boundary of its own (My account). */
    portal: { title: "We couldn't load this page.", body, retry, contact },
    opportunities: { title: "We couldn't load your opportunities.", body, retry, contact },
    organization: { title: "We couldn't load your organization.", body, retry, contact },
  },
} as const;
