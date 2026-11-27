import { OTHER, otherLabel, type Choice } from "@/features/intake/copy";

/*
 * Demo data for the intake form design. The real form gets the person from the invitation link and the
 * welcome message from SDC's settings; see docs/backend/intake-form.md for what the backend needs to provide.
 */

/** Who the invitation was sent to. The form never asks for these: they come from the contact record. */
export interface IntakeContact {
  firstName: string | null;
  email: string;
}

export const demoContact: IntakeContact = { firstName: "Alex", email: "alex@example.org" };

/**
 * The welcome message. SDC admins can replace it; this is the default. `{firstName}` is filled in from
 * the contact record ("there" when it's missing) and `{questionCount}` from the number of questions.
 */
export interface WelcomeMessage {
  heading: string;
  greeting: string;
  intro: string;
  askBefore: string;
  askBold: string;
  askAfter: string;
  privacy: string;
  signOff: string;
  signature: string;
}

export const defaultWelcome: WelcomeMessage = {
  heading: "We’d love to get to know you",
  greeting: "Hi {firstName},",
  intro:
    "Thanks for being part of our community. Everyone who connects with the Social Development Centre (SDC) cares about different things, and we’d like to know what matters most to you.",
  askBefore: "Tell us a little about yourself in ",
  askBold: "{questionCount} quick questions",
  askAfter: " (about 2 minutes). Your answers help us share the events, updates and ways to get involved that fit your interests.",
  privacy: "Only the SDC team sees your answers, and every question is optional.",
  signOff: "Thank you,",
  signature: "The SDC team",
};

export function fillWelcome(text: string, contact: IntakeContact, questionCount: number) {
  return text
    .replaceAll("{firstName}", contact.firstName?.trim() || "there")
    .replaceAll("{questionCount}", String(questionCount));
}

export type QuestionKind = "many" | "one" | "text";

export interface Question {
  id: "issues" | "involvement" | "location" | "time" | "meaning";
  kind: QuestionKind;
  heading: string;
  /** Under the heading: how to answer. */
  hint?: string;
  /** Listed options; "Other" with a text box is added after them for "many" and "one". */
  options?: Choice[];
  /** Describes the "Other" text box. */
  otherLabel?: string;
}

export const questions: Question[] = [
  {
    id: "issues",
    kind: "many",
    heading: "Which issues would you like to hear about?",
    hint: "Select all that apply.",
    options: [
      { id: "housing", label: "Housing and homelessness" },
      { id: "tenants", label: "Tenant rights and eviction prevention" },
      { id: "community", label: "Community connections and neighbourhood life" },
      { id: "justice", label: "Social justice and local civic issues" },
      { id: "climate", label: "Climate and the environment" },
      { id: "newcomers", label: "Refugee and newcomer support" },
    ],
    otherLabel: "What other issues matter to you?",
  },
  {
    id: "involvement",
    kind: "many",
    heading: "How would you like to be involved with SDC?",
    hint: "Select all that apply.",
    options: [
      { id: "delegation", label: "Council delegation training" },
      { id: "organizing", label: "Tenant organizing workshops" },
      { id: "rights", label: "Know-your-rights education" },
      { id: "research", label: "Research and policy briefings" },
      { id: "networking", label: "Networking lunches and events" },
      { id: "newsletter", label: "Newsletter only" },
    ],
    otherLabel: "How else would you like to be involved?",
  },
  {
    id: "location",
    kind: "one",
    heading: "Where are you based?",
    hint: "Select one.",
    options: [
      { id: "kitchener", label: "Kitchener" },
      { id: "waterloo", label: "Waterloo" },
      { id: "cambridge", label: "Cambridge" },
    ],
    otherLabel: "Where are you based?",
  },
  {
    id: "time",
    kind: "one",
    heading: "How much time can you commit to local community events a week?",
    hint: "Select one.",
    options: [
      { id: "5-plus", label: "5+ hours a week" },
      { id: "3-4", label: "3–4 hours a week" },
      { id: "1-2", label: "1–2 hours a week" },
      { id: "under-1", label: "Less than 1 hour a week" },
      { id: "unsure", label: "Unsure" },
    ],
    otherLabel: "How much time could you give?",
  },
  {
    id: "meaning",
    kind: "text",
    heading: "What would make SDC membership meaningful to you?",
  },
];

export const textAnswerLabel = "Your answer";
export const textAnswerPlaceholder =
  "For example: something you’d like to learn, people you’d like to meet, or a way you’d like to help.";

/** Answers keyed by question id: chosen option ids (with OTHER for "Other"), the Other text, or free text. */
export interface IntakeAnswers {
  choices: Record<string, string[]>;
  other: Record<string, string>;
  text: Record<string, string>;
}

export const emptyAnswers = (): IntakeAnswers => ({ choices: {}, other: {}, text: {} });

export { OTHER, otherLabel };
