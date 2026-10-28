export interface IntakeAnswers {
  firstName: string;
  lastName: string;
  email: string;
  /** Topic id to rank, where 1 is the highest priority and null means unranked. */
  topicRanks: Record<string, number | null>;
  topicsOther: string;
  /** Choice ids (see copy.ts). */
  ways: string[];
  waysOther: string;
  location: string;
  time: string;
  hopes: string;
}

export const emptyAnswers: IntakeAnswers = {
  firstName: "",
  lastName: "",
  email: "",
  topicRanks: {},
  topicsOther: "",
  ways: [],
  waysOther: "",
  location: "",
  time: "",
  hopes: "",
};

export const QUESTION_COUNT = 5;

/** The details step's three fields, for keying validation errors. */
export type ContactField = "firstName" | "lastName" | "email";

/**
 * `envelope` is the closed letter people open first. `left` is someone choosing "maybe later":
 * nothing is saved, so the form can be filled in later.
 */
export type Step = "envelope" | "welcome" | "contact" | "topics" | "ways" | "location" | "time" | "hopes" | "done" | "left";
