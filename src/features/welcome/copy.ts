import { BookOpen, Coffee, HandHeart, HeartHandshake, Home, KeyRound, Leaf, Megaphone, MessagesSquare, Scale, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/*
 * Ride for Refuge pilot survey copy, from the "letter" prototype (8 Oct 2026). All of it is DRAFT
 * until SDC confirms the membership terms and the topic labels (docs/decisions/member-survey.md).
 */

export interface Choice {
  id: string;
  label: string;
}
export interface IconChoice extends Choice {
  icon: LucideIcon;
}

/** Every question's "Other" choice. It sits below a divider and turns into a text box when chosen. */
export const OTHER = "other";

export const topicChoices: IconChoice[] = [
  { id: "housing", label: "Housing and homelessness", icon: Home },
  { id: "tenant-rights", label: "Tenant rights and eviction prevention", icon: KeyRound },
  { id: "community", label: "Community connections and neighbourhood life", icon: Users },
  { id: "social-justice", label: "Social justice and local civic issues", icon: Scale },
  { id: "climate", label: "Climate and the environment", icon: Leaf },
  { id: "newcomers", label: "Refugee and newcomer support", icon: HeartHandshake },
];

export const wayChoices: IconChoice[] = [
  { id: "learn", label: "Learn about local issues and SDC’s work", icon: BookOpen },
  { id: "meet", label: "Meet people at community lunches or events", icon: Coffee },
  { id: "petition", label: "Support a petition or community action", icon: Megaphone },
  { id: "volunteer", label: "Volunteer my time or skills", icon: HandHeart },
  { id: "workshop", label: "Join a workshop or discussion", icon: MessagesSquare },
];

export const locationChoices: Choice[] = [
  { id: "kitchener", label: "Kitchener" },
  { id: "waterloo", label: "Waterloo" },
  { id: "cambridge", label: "Cambridge" },
];

export const timeChoices: Choice[] = [
  { id: "5-plus", label: "5+ hours a week" },
  { id: "3-4", label: "3–4 hours a week" },
  { id: "1-2", label: "1–2 hours a week" },
  { id: "under-1", label: "Less than 1 hour a week" },
  { id: "unsure", label: "Unsure" },
];

/** "Other" plus the stored label, for questions where people can write their own answer. */
export const otherLabel = "Other";

export const surveyCopy = {
  brand: "Social Development Centre",
  title: "Welcome to the SDC community",
  logos: {
    sdc: "Social Development Centre Waterloo Region",
    rideForRefuge: "Ride for Refuge",
  },

  envelope: {
    to: "To",
    /** Read by screen readers; the envelope itself is the button. */
    open: "Open your letter from SDC",
    hintClick: "Click the envelope to open your letter",
    hintTap: "Tap the envelope to open your letter",
    /** The envelope addresses someone without a name on file. */
    fallbackName: "Friend of SDC",
  },

  welcome: {
    heading: "Welcome to the SDC community",
    greeting: (firstName: string) => `Hi ${firstName}, thank you for supporting Ride for Refuge!`,
    greetingNoName: "Hi, thank you for supporting Ride for Refuge!",
    invitation:
      "Your support means a lot, and we’d love to welcome you into the SDC community with a complimentary membership.",
    benefits:
      "As a member, you’ll have better visibility into what’s happening at SDC and easier access to opportunities across our community.",
    askBefore: "To help us share the opportunities that fit you best, please answer ",
    askBold: "5 quick questions",
    askAfter: " (about 2 minutes).",
    privacy: "Your answers are used only by SDC and are never shared.",
    signOff: "Sincerely,",
    signature: "SDC Team",
    start: "Begin survey",
  },

  contact: {
    heading: "Confirm your details",
    body: "We’ll use your email to send your membership welcome and event invites that match your answers.",
    nameLabel: "Name (optional)",
    emailLabel: "Signed in as",
  },

  progressContact: "Your details",
  progressQuestion: (n: number, total: number) => `Question ${n} of ${total}`,
  progressLabel: "Survey progress",

  topics: {
    heading: "Which issues would you like to hear about?",
    hint: "Select all that apply.",
    otherLabel: "What other issues matter to you?",
  },
  ways: {
    heading: "How would you like to be involved with SDC?",
    hint: "Select all that apply.",
    otherLabel: "How else would you like to be involved?",
  },
  location: {
    heading: "Where are you based?",
    hint: "Select one.",
    otherLabel: "Where are you based?",
  },
  time: {
    heading: "How much time can you commit to local community events a week?",
    hint: "Select one.",
    otherLabel: "How much time could you give?",
  },
  hopes: {
    heading: "What would make SDC membership meaningful to you?",
    hint: "Fill in the text box below.",
    label: "Your answer (optional)",
    placeholder: "For example: something you’d like to learn, people you’d like to meet, or a way you’d like to help.",
  },

  back: "Back",
  next: "Next",
  submit: "Submit answers",
  submitFailed: "We couldn’t save your answers. They’re still here, so check your connection and choose Submit answers again.",

  done: {
    heading: "Thanks for sharing!",
    body: "Your answers will help us improve what we share with you as a member.",
    next: "Go to SDC",
    goose: "A Canada goose in a party hat, wings up, honking in celebration",
  },

  unsubscribe: {
    link: "Unsubscribe",
    heading: "Stop SDC invitations?",
    body: "We won’t email you about SDC membership again. You’ll still hear from Ride for Refuge as usual.",
    keep: "Keep me in",
    confirm: "Unsubscribe",
  },

  unsubscribed: {
    heading: "You’re unsubscribed",
    body: "You won’t receive any more SDC membership invitations.",
    signOut: "Sign out",
  },
};
