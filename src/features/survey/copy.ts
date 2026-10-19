import {
  BookOpen,
  Coffee,
  HandHeart,
  Home,
  Landmark,
  Leaf,
  Mail,
  Megaphone,
  MessagesSquare,
  PenLine,
  CircleHelp,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/*
 * Ride for Refuge pilot survey copy. All of it is DRAFT until SDC confirms the membership terms and the
 * topic labels (docs/decisions/member-survey.md). Question wording comes from the client questionnaire.
 */

export interface Choice {
  id: string;
  label: string;
}
export interface IconChoice extends Choice {
  icon: LucideIcon;
  /** Choosing it clears every other choice, and choosing another clears it. */
  exclusive?: boolean;
}

/** The "Other" choice's id in the multi-select questions; it reveals a short text field. */
export const OTHER = "other";

export const topicChoices: IconChoice[] = [
  { id: "housing", label: "Housing and homelessness", icon: Home },
  { id: "tenant-rights", label: "Tenant rights and eviction prevention", icon: Scale },
  { id: "community", label: "Community connections and neighbourhood life", icon: Users },
  { id: "social-justice", label: "Social justice and local civic issues", icon: Landmark },
  { id: "climate", label: "Climate and the environment", icon: Leaf },
  { id: OTHER, label: "Other", icon: PenLine },
  { id: "not-sure", label: "I’m not sure yet", icon: CircleHelp, exclusive: true },
];

export const wayChoices: IconChoice[] = [
  { id: "learn", label: "Learn about local issues and SDC’s work", icon: BookOpen },
  { id: "meet", label: "Meet people at community lunches or events", icon: Coffee },
  { id: "workshop", label: "Join a workshop or discussion", icon: MessagesSquare },
  { id: "volunteer", label: "Volunteer my time or skills", icon: HandHeart },
  { id: "petition", label: "Support a petition or another community action", icon: Megaphone },
  { id: "informed", label: "Stay informed for now", icon: Mail },
  { id: OTHER, label: "Other", icon: PenLine },
];

export const OUTSIDE = "outside";
export const locationChoices: Choice[] = [
  { id: "kitchener", label: "Kitchener" },
  { id: "waterloo", label: "Waterloo" },
  { id: "cambridge", label: "Cambridge" },
  { id: "region", label: "Elsewhere in Waterloo Region" },
  { id: OUTSIDE, label: "Outside Waterloo Region" },
  { id: "no-answer", label: "Prefer not to say" },
];

export const timeChoices: Choice[] = [
  { id: "quick", label: "A few minutes for a quick action" },
  { id: "hour", label: "Up to an hour" },
  { id: "few-hours", label: "A few hours for an event or activity" },
  { id: "ongoing", label: "I’m open to an ongoing volunteer role" },
  { id: "depends", label: "It depends on the opportunity" },
  { id: "informed", label: "I just want to stay informed for now" },
];

export const surveyCopy = {
  brand: "Social Development Centre",
  title: "Help shape SDC’s membership community",

  welcome: {
    heading: "Your complimentary SDC membership",
    body: [
      "Thank you for supporting Ride for Refuge! As a thank-you, we’d like to offer you a complimentary membership in SDC’s new community, where people can learn, connect and contribute in ways that work for them.",
      "Tell us what you care about and how you’d like to be involved. It takes about two minutes. There’s no payment request, and you can opt out any time.",
    ],
    start: "Get started",
    unsubscribe: "Unsubscribe",
  },

  unsubscribed: {
    heading: "You’re unsubscribed",
    body: "We won’t send you any more membership emails. Thank you for supporting Ride for Refuge.",
  },

  contact: {
    heading: "Let’s start with your details",
    body: "We use your email to connect your answers to your SDC contact record.",
    nameLabel: "Name",
    nameHint: "Optional",
    emailLabel: "Email address",
    emailHint: "We filled this in from your invitation. Change it if it isn’t right.",
    emailMissing: "Enter your email address.",
    emailInvalid: "Enter an email address like name@example.org.",
  },

  progressContact: "Your details",
  progressQuestion: (n: number, total: number) => `Question ${n} of ${total}`,
  progressLabel: "Survey progress",

  topics: {
    heading: "Which issues would you like to hear about or get involved in?",
    hint: "Select any that interest you.",
    otherLabel: "Tell us which issue",
  },
  ways: {
    heading: "How would you like to be involved with SDC?",
    hint: "Select any that feel right for you. You don’t need experience to get involved, and you can change your mind later.",
    otherLabel: "Tell us how",
  },
  location: {
    heading: "Where are you based?",
    hint: "City or region only. We never ask for your address.",
    outsideLabel: "City or town",
    outsideHint: "Optional",
  },
  time: {
    heading: "When you choose to get involved, how much time would usually feel manageable?",
    hint: "Choose the closest answer. This isn’t a commitment.",
  },
  hopes: {
    heading: "What would make being part of SDC useful or meaningful to you?",
    hint: "Optional.",
    label: "Your answer",
    placeholder: "Something you’d like to learn, a connection you’d like to make, or a way you’d like to contribute.",
  },

  otherPlaceholder: "A few words is plenty",
  selected: (n: number) => `${n} selected`,
  notSureNote: "Choosing “I’m not sure yet” clears your other picks.",

  back: "Back",
  next: "Next",
  skip: "Skip for now",
  submit: "Share my preferences",
  submitFailed:
    "We couldn’t save your answers. They’re still here, so check your connection and choose Share my preferences again.",

  done: {
    heading: "Thanks for sharing!",
    body: "Your answers will help SDC shape its membership community and understand the ways people would like to be involved. You can change your mind or opt out any time.",
  },

  /** The decorative icon on the welcome screen. */
  welcomeIcon: Sparkles,
};
