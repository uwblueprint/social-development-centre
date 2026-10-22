export interface IntakeAnswers {
  firstName: string;
  lastName: string;
  email: string;
  /** Choice ids (see copy.ts). */
  topics: string[];
  topicsOther: string;
  ways: string[];
  waysOther: string;
  location: string;
  locationOther: string;
  time: string;
  hopes: string;
}

export const emptyAnswers: IntakeAnswers = {
  firstName: "",
  lastName: "",
  email: "",
  topics: [],
  topicsOther: "",
  ways: [],
  waysOther: "",
  location: "",
  locationOther: "",
  time: "",
  hopes: "",
};

export const QUESTION_COUNT = 5;

/** The details step's three fields, for keying validation errors. */
export type ContactField = "firstName" | "lastName" | "email";

/** `left` is someone choosing "maybe later": nothing is saved, so the form can be filled in later. */
export type Step = "welcome" | "contact" | "topics" | "ways" | "location" | "time" | "hopes" | "done" | "left";
