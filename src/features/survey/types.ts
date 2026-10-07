export interface SurveyAnswers {
  name: string;
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

export const emptyAnswers: SurveyAnswers = {
  name: "",
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

export type Step = "welcome" | "contact" | "topics" | "ways" | "location" | "time" | "hopes" | "done" | "unsubscribed";
