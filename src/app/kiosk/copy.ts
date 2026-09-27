/** Booth kiosk copy. All of it is new and needs approval; see docs/ux/portal.md, "Booth kiosk". */
export const kioskCopy = {
  org: "Social Development Centre",
  heading: "Get involved in your community",
  intro:
    "Leave your name and email and we'll send you about one email a month with local ways to volunteer, learn and take part. We only use your details for these emails, and you can unsubscribe anytime.",
  nameLabel: "Name",
  emailLabel: "Email",
  submit: "Sign me up",
  nameMissing: "Enter your name.",
  emailMissing: "Enter your email address.",
  emailInvalid: "Enter an email address like name@example.org.",
  failed: "We couldn't sign you up. Check your connection and tap Sign me up again.",
  done: (name: string) => `You're in, ${name}!`,
  doneBody: "Check your inbox for a welcome email.",
  countdown: (seconds: number) => `Starting over in ${seconds}s`,
  paused: "Paused. Tap Next person when you're ready.",
  next: "Next person",
};
