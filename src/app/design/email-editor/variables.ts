/**
 * Personalized text: member details an email can show, like a first name.
 * Each appears in the editor as a chip ("{ First name }"), never as code. See the Email Editor PRD.
 */

export type EmailMoment = "one_off" | "joins_referral" | "refers" | "referral_joins";
export type VariableGroup = "member" | "referrer" | "referred";

export interface PersonalizationVariable {
  id: string;
  group: VariableGroup;
  /** Shown in the Personalize list under its group, e.g. "First name". */
  shortLabel: string;
  /** Shown on the chip, e.g. "Referrer's first name". */
  label: string;
  /** What a member with this detail might see. */
  example: string;
  /** Shown when the member has no value. Empty string shows nothing. */
  fallback: string;
  /** Every member has one (email, join date), so there is no fallback to edit. */
  alwaysPresent?: boolean;
}

export const VARIABLES: readonly PersonalizationVariable[] = [
  { id: "first_name", group: "member", shortLabel: "First name", label: "First name", example: "Maya", fallback: "there" },
  { id: "last_name", group: "member", shortLabel: "Last name", label: "Last name", example: "Chen", fallback: "" },
  { id: "full_name", group: "member", shortLabel: "Full name", label: "Full name", example: "Maya Chen", fallback: "friend" },
  { id: "email", group: "member", shortLabel: "Email", label: "Email", example: "maya.chen@example.org", fallback: "", alwaysPresent: true },
  { id: "join_date", group: "member", shortLabel: "Join date", label: "Join date", example: "March 4, 2026", fallback: "", alwaysPresent: true },
  { id: "referrer_first_name", group: "referrer", shortLabel: "First name", label: "Referrer's first name", example: "Daniel", fallback: "a friend" },
  { id: "referrer_last_name", group: "referrer", shortLabel: "Last name", label: "Referrer's last name", example: "Osei", fallback: "" },
  { id: "referrer_full_name", group: "referrer", shortLabel: "Full name", label: "Referrer's full name", example: "Daniel Osei", fallback: "a friend" },
  { id: "referred_first_name", group: "referred", shortLabel: "First name", label: "Referred person's first name", example: "Priya", fallback: "a friend" },
  { id: "referred_last_name", group: "referred", shortLabel: "Last name", label: "Referred person's last name", example: "Nair", fallback: "" },
  { id: "referred_full_name", group: "referred", shortLabel: "Full name", label: "Referred person's full name", example: "Priya Nair", fallback: "a friend" },
];

/** Group headings in the Personalize list. Member details are listed first without a heading. */
export const GROUP_LABELS: Record<VariableGroup, string> = {
  member: "Member",
  referrer: "Referrer",
  referred: "Referred person",
};

/** Who the "no value" sentence talks about in the fallback popover. */
export const GROUP_SUBJECTS: Record<VariableGroup, string> = {
  member: "a member",
  referrer: "the referrer",
  referred: "the referred person",
};

export const MOMENT_LABELS: Record<EmailMoment, string> = {
  one_off: "One-off email",
  joins_referral: "Member joins via referral",
  refers: "Member refers someone",
  referral_joins: "Member's referral joins",
};

/** Which details exist for each email moment. Member details always do. */
const MOMENT_GROUPS: Record<EmailMoment, readonly VariableGroup[]> = {
  one_off: ["member"],
  joins_referral: ["member", "referrer"],
  refers: ["member", "referred"],
  referral_joins: ["member", "referred"],
};

export function variableById(id: string | null | undefined) {
  return VARIABLES.find((v) => v.id === id);
}

export function isAvailable(id: string, moment: EmailMoment) {
  const v = variableById(id);
  return !!v && MOMENT_GROUPS[moment].includes(v.group);
}

/** The variables offered for a moment, filtered by what was typed after "{". */
export function variablesFor(moment: EmailMoment, query = "") {
  const q = query.trim().toLowerCase();
  return VARIABLES.filter(
    (v) =>
      MOMENT_GROUPS[moment].includes(v.group) &&
      (!q || v.label.toLowerCase().includes(q) || v.shortLabel.toLowerCase().includes(q) || GROUP_LABELS[v.group].toLowerCase().includes(q)),
  );
}
