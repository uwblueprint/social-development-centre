import { OTHER, locationChoices, otherLabel, timeChoices, topicChoices, wayChoices } from "./copy";
import type { SurveyAnswers } from "./types";

/*
 * The payload is human-readable on purpose: labels, not ids, so a stored row reads as it was
 * answered. `submissionId` is created once per page load and sent again on every retry, so the
 * save can treat a repeated id as the same submission instead of writing a second row.
 *
 * There is no email field: the survey is behind sign-in, so the person is `auth.uid()` and the
 * save reads it from the session rather than trusting anything the browser sends.
 */
export interface SurveySubmission {
  submissionId: string;
  /** UTC ISO 8601 with a Z. */
  submittedAt: string;
  name: string;
  topics: string[];
  topicsOther: string;
  ways: string[];
  waysOther: string;
  location: string;
  locationOther: string;
  timeAvailable: string;
  timeOther: string;
  hopes: string;
}

type Choices = { id: string; label: string }[];
const label = (choices: Choices, id: string) => (id === OTHER ? otherLabel : (choices.find((c) => c.id === id)?.label ?? ""));
const labels = (choices: Choices, ids: string[]) => ids.map((id) => label(choices, id)).filter(Boolean);

export function toSubmission(submissionId: string, a: SurveyAnswers): SurveySubmission {
  return {
    submissionId,
    submittedAt: new Date().toISOString(),
    name: a.name.trim(),
    topics: labels(topicChoices, a.topics),
    topicsOther: a.topics.includes(OTHER) ? a.topicsOther.trim() : "",
    ways: labels(wayChoices, a.ways),
    waysOther: a.ways.includes(OTHER) ? a.waysOther.trim() : "",
    location: label(locationChoices, a.location),
    locationOther: a.location === OTHER ? a.locationOther.trim() : "",
    timeAvailable: label(timeChoices, a.time),
    timeOther: a.time === OTHER ? a.timeOther.trim() : "",
    hopes: a.hopes.trim(),
  };
}
