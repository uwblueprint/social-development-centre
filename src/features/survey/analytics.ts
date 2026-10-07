/*
 * Analytics seam. The UI only calls trackSurveyEvent; step views are what show where people drop
 * out of the survey, and `survey_left` records someone choosing "Maybe later".
 *
 * NOT IMPLEMENTED: there is no event log in the database yet, so this only logs in development.
 * See docs/backend/member-survey.md §3 for what it needs. Deliberately not invented here — the
 * survey's own tables already exist and an events table is a separate decision.
 */
export type SurveyEvent =
  | { name: "survey_step_viewed"; step: string }
  | { name: "survey_left" }
  | { name: "survey_submitted" };

export function trackSurveyEvent(event: SurveyEvent): void {
  if (process.env.NODE_ENV !== "production") console.debug("[survey analytics]", event);
}
