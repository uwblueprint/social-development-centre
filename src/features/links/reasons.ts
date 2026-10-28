/**
 * The optional "why" after someone unsubscribes (a short dropdown, per the Unsubscribe & Cancel
 * Membership PRD). PLACEHOLDER: the PRD doesn't list the reasons yet; replace these with SDC's once
 * they're agreed. Ids are stored (`subscription_events.reason`), so keep an id when rewording a label.
 */
export const unsubscribeReasons = [
  { value: "too_many", label: "I get too many emails" },
  { value: "not_relevant", label: "The emails aren’t relevant to me" },
  { value: "didnt_sign_up", label: "I didn’t sign up for these" },
  { value: "other", label: "Something else" },
];

export function isUnsubscribeReason(value: unknown): value is string {
  return unsubscribeReasons.some((reason) => reason.value === value);
}
