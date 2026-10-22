import {
  Accessibility,
  BookOpen,
  Coffee,
  HandHeart,
  KeyRound,
  Landmark,
  Mail,
  Megaphone,
  MessagesSquare,
  Tent,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/*
 * Ride for Refuge pilot intake form copy, written as a letter (prototype, 8 Oct 2026). All of it is
 * DRAFT until SDC confirms the membership terms, the topic labels and the contact-details wording
 * (docs/decisions/intake-form.md). Question wording comes from the client questionnaire.
 */

export interface Choice {
  id: string;
  label: string;
}
export interface IconChoice extends Choice {
  icon: LucideIcon;
}

/** The "Other" choice's id in the multi-select questions. */
export const OTHER = "other";
/** "Other" is drawn by OtherChoice below a divider, so it is never one of the listed choices. */
export const otherLabel = "Other";

export const topicChoices: IconChoice[] = [
  { id: "homelessness", label: "Homelessness and encampments", icon: Tent },
  { id: "tenant-rights", label: "Tenant rights and evictions", icon: KeyRound },
  { id: "community", label: "Neighbourhood events and community life", icon: Users },
  { id: "civic", label: "Local elections and civic engagement", icon: Landmark },
  { id: "accessibility", label: "Disability rights and accessibility", icon: Accessibility },
];

export const wayChoices: IconChoice[] = [
  { id: "learn", label: "Learn about local issues and SDC’s work", icon: BookOpen },
  { id: "meet", label: "Meet people at community lunches or events", icon: Coffee },
  { id: "workshop", label: "Join a workshop or discussion", icon: MessagesSquare },
  { id: "volunteer", label: "Volunteer my time or skills", icon: HandHeart },
  { id: "petition", label: "Support a petition or another community action", icon: Megaphone },
  { id: "informed", label: "Stay informed for now", icon: Mail },
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

export const intakeCopy = {
  title: "Help shape SDC’s membership community",
  logos: {
    sdc: "Social Development Centre Waterloo Region",
    rideForRefuge: "Ride for Refuge",
  },

  envelope: {
    /** Read by screen readers; the envelope itself is the button. */
    open: "Open your letter from SDC",
    hintClick: "Click the envelope to open your letter",
    hintTap: "Tap the envelope to open your letter",
  },

  welcome: {
    heading: "Welcome to the SDC member community",
    greeting: "Thank you for supporting Ride for Refuge!",
    invitation:
      "Your support means a lot, and we’d love to welcome you into the SDC community with a complimentary (non-voting) membership.",
    benefits:
      "As a member, you’ll have better visibility into what’s happening at SDC and easier access to opportunities across our community.",
    askBefore: "To help us share the opportunities that fit you best, please answer ",
    askBold: "5 quick questions",
    askAfter: " (about 2 minutes).",
    privacy: "Your answers are linked to your name and email and are seen only by SDC. Every question is optional.",
    signOff: "Sincerely,",
    signature: "SDC Team",
    start: "Begin survey",
    leave: "Not interested",
  },

  /** Shown after "Not interested". Nothing is saved and nothing is recorded, so this screen cannot
      promise SDC will stop emailing — suppressing that needs a backend (docs/backend/intake-form.md). */
  left: {
    heading: "No problem",
    body: "Nothing was saved. If you change your mind, this link will still work. Thank you for supporting Ride for Refuge.",
    restart: "Fill it in after all",
  },

  contact: {
    heading: "Details",
    body: "We’ll use your email to send your membership welcome and event invites that match your answers.",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Email address",
  },

  /** Field errors on the details step: what’s wrong and what to do about it. */
  errors: {
    firstName: "Enter your first name.",
    lastName: "Enter your last name.",
    emailMissing: "Enter your email address.",
    emailInvalid: "Enter an email address like name@example.com.",
  },

  progressContact: "Your details",
  progressQuestion: (n: number, total: number) => `Question ${n} of ${total}`,
  progressLabel: "Form progress",

  topics: {
    heading: "Which issues would you like to hear about or get involved in?",
    otherLabel: "Tell us which issue",
  },
  ways: {
    heading: "How would you like to be involved with SDC?",
    otherLabel: "Tell us how",
  },
  location: {
    heading: "Where are you based?",
    outsideLabel: "City or town",
  },
  time: {
    heading: "When you choose to get involved, how much time would usually feel manageable?",
  },
  hopes: {
    heading: "What would make being part of SDC useful or meaningful to you?",
    label: "Your answer",
    placeholder: "Something you’d like to learn, a connection you’d like to make, or a way you’d like to contribute.",
  },

  back: "Back",
  next: "Next",
  skip: "Skip for now",
  submit: "Share my preferences",
  submitFailed:
    "We couldn’t save your answers. They’re still here, so check your connection and choose Share my preferences again.",
  submitInvalidDetails:
    "Check your first name, last name and email on the details step, then choose Share my preferences again.",

  done: {
    heading: "Thanks for sharing!",
    body: "Your answers will help SDC shape its membership community and understand the ways people would like to be involved.",
    goose: "A Canada goose in a party hat, wings up, honking in celebration",
  },
};
