/*
 * Analytics seam (docs/backend/member-survey.md). The UI only calls trackSurveyEvent; the real
 * implementation sends the event to SDC's analytics tool. Until then it logs in development.
 */
export type SurveyEvent =
  | { name: "survey_step_viewed"; step: string }
  | { name: "survey_unsubscribe_clicked" }
  | { name: "survey_submitted" };

export function trackSurveyEvent(event: SurveyEvent): void {
  if (process.env.NODE_ENV !== "production") console.debug("[survey analytics]", event);
}
