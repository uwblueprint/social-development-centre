import type { ActionState } from "@/lib/forms";
import { OTHER, OUTSIDE, locationChoices, timeChoices, topicChoices, wayChoices } from "./copy";
import type { SurveyAnswers } from "./types";

/*
 * Save seam (docs/backend/member-survey.md). The UI is finished; the backend replaces submitSurvey so it
 * writes one row to the agreed spreadsheet (or existing storage) and returns an ActionState.
 *
 * The payload is human-readable on purpose: labels, not ids, so a spreadsheet row reads as it was answered.
 * `submissionId` is created once per page load and sent again on every retry, so the backend can treat a
 * repeated id as the same submission instead of saving a second row.
 */
export interface SurveySubmission {
  submissionId: string;
  /** UTC ISO 8601 with a Z. */
  submittedAt: string;
  name: string;
  email: string;
  topics: string[];
  topicsOther: string;
  ways: string[];
  waysOther: string;
  location: string;
  locationOther: string;
  timeAvailable: string;
  hopes: string;
}

type Choices = { id: string; label: string }[];
const label = (choices: Choices, id: string) => choices.find((c) => c.id === id)?.label ?? "";
const labels = (choices: Choices, ids: string[]) => ids.map((id) => label(choices, id)).filter(Boolean);

export function toSubmission(submissionId: string, a: SurveyAnswers): SurveySubmission {
  return {
    submissionId,
    submittedAt: new Date().toISOString(),
    name: a.name.trim(),
    email: a.email.trim(),
    topics: labels(topicChoices, a.topics),
    topicsOther: a.topics.includes(OTHER) ? a.topicsOther.trim() : "",
    ways: labels(wayChoices, a.ways),
    waysOther: a.ways.includes(OTHER) ? a.waysOther.trim() : "",
    location: label(locationChoices, a.location),
    locationOther: a.location === OUTSIDE ? a.locationOther.trim() : "",
    timeAvailable: label(timeChoices, a.time),
    hopes: a.hopes.trim(),
  };
}

/** In development, add ?fail to the page address to make the first save fail, to try the retry path. */
let failedOnce = false;

export async function submitSurvey(submission: SurveySubmission): Promise<ActionState> {
  // Fails closed in production until the backend exists, so no one is told their answers were saved when they weren't.
  if (process.env.NODE_ENV === "production") throw new Error("submitSurvey is not implemented (docs/backend/member-survey.md).");

  await new Promise((resolve) => setTimeout(resolve, 700));
  if (!failedOnce && new URLSearchParams(window.location.search).has("fail")) {
    failedOnce = true;
    return { status: "error" };
  }
  console.debug("[survey submit]", submission);
  return { status: "success" };
}
