export interface SurveyAnswers {
  name: string;
  /** Choice ids (see copy.ts). */
  topics: string[];
  topicsOther: string;
  ways: string[];
  waysOther: string;
  location: string;
  locationOther: string;
  time: string;
  timeOther: string;
  hopes: string;
}

export const emptyAnswers: SurveyAnswers = {
  name: "",
  topics: [],
  topicsOther: "",
  ways: [],
  waysOther: "",
  location: "",
  locationOther: "",
  time: "",
  timeOther: "",
  hopes: "",
};

export const QUESTION_COUNT = 5;

/**
 * `envelope` is the closed letter people open first. `unsubscribe` asks them to confirm, and
 * `unsubscribed` confirms it: nothing is saved, so the survey is offered again at the next sign-in.
 */
export type Step =
  | "envelope"
  | "welcome"
  | "contact"
  | "topics"
  | "ways"
  | "location"
  | "time"
  | "hopes"
  | "done"
  | "unsubscribe"
  | "unsubscribed";
