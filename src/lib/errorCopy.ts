/**
 * Strings for the route error boundaries (error.tsx) of areas that don't have a copy file of their own
 * yet, or whose copy file is being edited elsewhere. Community's live in its `_copy.ts` (`loadError`).
 * The owner edits them here. Every boundary carries an `escalation` line (see RouteError). See the owner's UX spec (retired), "Empty and error states".
 */
import { BSF_SUPPORT_EMAIL } from "./contact";

const body = "Your data is safe; this is a loading problem.";
const retry = "Try again";
/** Admins escalate to BSF by email; partners and anyone else tell an SDC admin. */
export const adminEscalation = { text: "If it keeps happening, email", email: BSF_SUPPORT_EMAIL };
export const partnerEscalation = { text: "If it keeps happening, tell an SDC admin." };

export const errorCopy = {
  admin: {
    /** /admin: any admin page without a boundary of its own (e.g. Insights, Documentation). */
    portal: { title: "We couldn't load this page.", body, retry, escalation: adminEscalation },
    opportunities: { title: "We couldn't load Opportunities.", body, retry, escalation: adminEscalation },
    partners: { title: "We couldn't load Partners.", body, retry, escalation: adminEscalation },
  },
  partner: {
    /** /partner: any partner page without a boundary of its own (e.g. Documentation). */
    portal: { title: "We couldn't load this page.", body, retry, escalation: partnerEscalation },
    opportunities: { title: "We couldn't load your opportunities.", body, retry, escalation: partnerEscalation },
    organization: { title: "We couldn't load your organization.", body, retry, escalation: partnerEscalation },
  },
} as const;
