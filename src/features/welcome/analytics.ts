/*
 * Analytics seam. The UI only calls trackSurveyEvent; step views are what show where people drop
 * out of the survey, `survey_envelope_opened` shows how many get past the closed letter, and the
 * two unsubscribe events record someone starting and confirming "Unsubscribe".
 *
 * NOT IMPLEMENTED: there is no event log in the database yet, so this only logs in development.
 * See docs/backend/member-survey.md §3 for what it needs. Deliberately not invented here — the
 * survey's own tables already exist and an events table is a separate decision.
 */
export type SurveyEvent =
  | { name: "survey_step_viewed"; step: string }
  | { name: "survey_envelope_opened" }
  | { name: "survey_unsubscribe_clicked" }
  | { name: "survey_unsubscribed" }
  | { name: "survey_submitted" };

export function trackSurveyEvent(event: SurveyEvent): void {
  if (process.env.NODE_ENV !== "production") console.debug("[survey analytics]", event);
}
