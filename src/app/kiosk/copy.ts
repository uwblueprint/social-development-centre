/** Booth kiosk copy. */
export const kioskCopy = {
  heading: "Get involved with your community",
  intro:
    "Leave your name and email and we'll send you opportunities that matter to you. We only use these details for those emails, and you can unsubscribe at any time.",
  /** The shorter intro shown on phones and small tablets. */
  introShort: "We'll email you opportunities that matter to you. We only use your details for that, and you can unsubscribe at any time.",
  nameLabel: "Name",
  emailLabel: "Email",
  submit: "Sign me up",
  nameMissing: "Enter your name.",
  emailMissing: "Enter your email address.",
  emailInvalid: "Enter an email address like name@example.org.",
  failed: "We couldn't sign you up. Check your connection and tap Sign me up again.",
  /** `firstName` comes from src/app/kiosk/firstName.ts. */
  done: (firstName: string) => `You're in, ${firstName}!`,
  doneBody: (email: string) => `Check ${email} for a welcome email.`,
  countdown: (seconds: number) => `Starting over in ${seconds}s`,
  paused: "Paused. Tap Next person when you're ready.",
  next: "Next person",
};
