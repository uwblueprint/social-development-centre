import { OTHER, OUTSIDE, locationChoices, otherLabel, timeChoices, topicChoices, wayChoices } from "./copy";
import type { IntakeAnswers } from "./types";

/*
 * The payload is human-readable on purpose: labels, not ids, so a stored row reads as it was
 * answered. `submissionId` is created once per page load and sent again on every retry, so the
 * save can treat a repeated id as the same submission instead of writing a second row.
 *
 * The form is open to anyone, so the person's name and email are answers like any other: they come
 * from the browser and are validated and normalized again on the server before anything is stored.
 */
export interface IntakeSubmission {
  submissionId: string;
  /** UTC ISO 8601 with a Z. */
  submittedAt: string;
  firstName: string;
  lastName: string;
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
/* "Other" is drawn below the listed choices rather than being one of them, so add its label here:
   a stored row still reads as it was answered, with the typed text in the matching `*Other` field. */
const withOther = (choices: Choices, ids: string[]) =>
  ids.includes(OTHER) ? [...labels(choices, ids), otherLabel] : labels(choices, ids);

export function toSubmission(submissionId: string, a: IntakeAnswers): IntakeSubmission {
  return {
    submissionId,
    submittedAt: new Date().toISOString(),
    firstName: a.firstName.trim(),
    lastName: a.lastName.trim(),
    email: a.email.trim(),
    topics: withOther(topicChoices, a.topics),
    topicsOther: a.topics.includes(OTHER) ? a.topicsOther.trim() : "",
    ways: withOther(wayChoices, a.ways),
    waysOther: a.ways.includes(OTHER) ? a.waysOther.trim() : "",
    location: label(locationChoices, a.location),
    locationOther: a.location === OUTSIDE ? a.locationOther.trim() : "",
    timeAvailable: label(timeChoices, a.time),
    hopes: a.hopes.trim(),
  };
}

/** Shared with the form so the browser and the server agree on what counts as an address. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
