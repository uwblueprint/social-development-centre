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
  hopes: "",
};

export const QUESTION_COUNT = 5;

/** `left` is someone choosing "maybe later": nothing is saved, so the survey is offered again. */
export type Step = "welcome" | "contact" | "topics" | "ways" | "location" | "time" | "hopes" | "done" | "left";
