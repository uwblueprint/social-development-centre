export const INTAKE_FORM_SOURCES = ["ride-for-refuage", "sdc-members"] as const;
export type IntakeFormSource = (typeof INTAKE_FORM_SOURCES)[number];

export interface Choice {
  id: string;
  label: string;
}

export const OTHER = "other";
export const OUTSIDE = "outside";
export const otherLabel = "Other";

export const topicChoices: Choice[] = [
  { id: "housing", label: "Housing, tenant rights, and eviction prevention" },
  { id: "homelessness", label: "Homelessness, encampments, and ending chronic homelessness" },
  { id: "climate", label: "Climate resilience, environmental justice, and community-led climate action" },
  { id: "lived-expertise", label: "Lived expertise and community-led policy change" },
  { id: "grassroots", label: "Grassroots groups, community organizing, and the Civic Hub" },
  { id: "neighbourhood", label: "Neighbourhood connections and community-building" },
  { id: "research", label: "Research, policy, and social justice" },
  { id: "arts", label: "Arts-based approaches to civic and community engagement" },
  { id: OTHER, label: otherLabel },
];

export const wayChoices: Choice[] = [
  { id: "events", label: "Receive invitations to occasional workshops, discussions, or community events" },
  { id: "expertise", label: "Be contacted about opportunities to share my knowledge, skills, or lived experience" },
  { id: "campaigns", label: "Receive invitations to participate in campaigns or community actions" },
  { id: "informed", label: "For now, I'd prefer to just stay informed about SDC's work on local issues" },
];

export const locationChoices: Choice[] = [
  { id: "cambridge", label: "Cambridge" },
  { id: "kitchener", label: "Kitchener" },
  { id: "waterloo", label: "Waterloo" },
  { id: "north-dumfries", label: "North Dumfries" },
  { id: "woolwich", label: "Woolwich" },
  { id: "wellesley", label: "Wellesley" },
  { id: "wilmot", label: "Wilmot" },
  { id: OUTSIDE, label: "Outside Waterloo Region" },
];

export const timeChoices: Choice[] = [
  { id: "quick", label: "A few minutes for a quick action" },
  { id: "few-hours", label: "A few hours for an event or activity" },
  { id: "ongoing", label: "I’m open to an ongoing volunteer role" },
  { id: "depends", label: "It depends on the opportunity" },
  { id: "informed", label: "I just want to stay informed for now" },
];

const commonCopy = {
  logos: {
    sdc: "Social Development Centre Waterloo Region",
    rideForRefuge: "Ride for Refuge",
  },
  envelope: {
    open: "Open your letter from SDC",
    hintClick: "Click the envelope to open your letter",
    hintTap: "Tap the envelope to open your letter",
  },
  welcome: {
    invitation:
      "Your support means a lot, and we’d love to welcome you into the SDC community with a complimentary (non-voting) membership.",
    benefits:
      "As a member, you’ll have better visibility into what’s happening at SDC and easier access to opportunities across our community.",
    askBefore: "To help us share the opportunities that fit you best, please answer ",
    askBold: "5 quick questions",
    askAfter: " (about 2 minutes).",
    privacy:
      "SDC records which pages you visit, how long you spend on them, and answers you enter. If you enter an email, SDC checks whether it matches an existing record. Your answers are linked to your name and email and seen only by SDC. Every question is optional.",
    signOff: "Sincerely,",
    signature: "The team at SDC",
    start: "Begin survey",
    leave: "Not interested",
  },
  left: {
    heading: "No problem",
    body: "Your submission wasn't saved. If you change your mind, this link will still work. Thank you for your time.",
    restart: "Fill it in after all",
  },
  contact: {
    heading: "Details",
    body: "We’ll use your contact info to send member-only emails and event invites that match your answers.",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Email address",
  },
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
    heading: "Which topics would you most like to see featured in SDC’s monthly member emails?",
    rankingHint: "Drag topics into your preferred order, with your top choice first. You can also use the move buttons. Choose Skip for now to skip ranking.",
    otherLabel: "What topic would you like to see featured?",
  },
  ways: {
    heading: "How would you most like to connect with SDC? (Select all that apply.)",
    otherLabel: "Tell us how you'd like to connect",
  },
  location: {
    heading: "Where are you based?",
  },
  time: {
    heading:
      "If an opportunity becomes available for you to get involved (in an SDC campaign, event, focus group, etc.), how much time would usually feel manageable?",
  },
  hopes: {
    heading: "What would make being part of SDC useful or meaningful to you?",
    label: "Your answer",
    placeholder: "E.g. something you’d like to learn, a connection you’d like to make, or a way you’d like to contribute.",
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

export const intakeForms = {
  "ride-for-refuage": {
    ...commonCopy,
    title: "Welcome to the SDC member community",
    showRideForRefugeLogo: true,
    welcome: {
      ...commonCopy.welcome,
      heading: "Welcome to the SDC member community",
      greeting: "Thank you for supporting the 2026 Ride for Refuge!",
    },
  },
  "sdc-members": {
    ...commonCopy,
    title: "Help us get to know you better",
    showRideForRefugeLogo: false,
    welcome: {
      ...commonCopy.welcome,
      heading: "Help us get to know you better",
      greeting:
        "Thank you for being an SDC member. Your support means a lot, and we’d love to improve the way we keep you informed, connected, and engaged with our work.",
      invitation:
        "As a member, we want you to have better visibility into what’s happening at SDC and easier access to opportunities across our community.",
    },
  },
} as const;

export type IntakeCopy = (typeof intakeForms)[IntakeFormSource];

/** Retained for server-side validation messages that are shared by both forms. */
export const intakeCopy = intakeForms["ride-for-refuage"];
