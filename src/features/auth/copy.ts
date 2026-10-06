/**
 * Sign-in copy for the three kinds of user, from the Figma working file (SDC Working File, "Auth —
 * Paying members", "Auth — Admins", "Auth — CivicHub partners"). Keep it word for word; change it in
 * Figma first. Copy marked "New, needs approval" was written for this build where Figma has only an
 * annotation (member screens 8–11) or no frame at all.
 */

/** "0:48", "14:32". */
export function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const sharedCopy = {
  logoAlt: "Social Development Centre Waterloo Region",
  invalidEmail: "Enter an email address like name@example.org.",
  /** New, needs approval: kept from the shared sign-in it replaces. */
  temporary: "We couldn't send a sign-in link. Try again in a minute.",
  backToSignIn: "Back to sign-in",
  resend: "Resend link",
  resendIn: (seconds: number) => `Resend in ${formatCountdown(seconds)}`,
  resendCooldown: "We just sent a link. You can request another in 60 seconds.",
  /** Shown above the form after signing out (platform decision 4). */
  signedOut: (name?: string) => (name ? `You're signed out. See you soon, ${name}.` : "You're signed out. See you soon."),
  expired: {
    title: "This link has expired",
    description: (email: string) =>
      `Sign-in links work once and expire after 15 minutes. We can send a new one to ${email}.`,
    /** New, needs approval: the browser doesn't remember which email asked for the link. */
    descriptionNoEmail: "Sign-in links work once and expire after 15 minutes. Enter your email to get a new one.",
    sendNew: "Send a new link",
    differentEmail: "Use a different email",
  },
};

export const memberCopy = {
  pageTitle: "Sign in",
  title: "Sign in to SDC",
  description:
    "Paying members can view the members-only opportunities feed. Enter the email you use with SDC and we’ll send you a sign-in link.",
  /** New, needs approval (screen 11): reached from "Member sign in" on a shared opportunity. */
  returnNote: "After you sign in, we’ll take you back to the opportunity you were looking at.",
  emailLabel: "Email address",
  submit: "Email me a sign-in link",
  footnote: "No password needed. The link expires in 15 minutes.",
  sent: {
    title: "Check your email",
    description: (email: string) =>
      `We sent a sign-in link to ${email}. Open it on this device to continue. The link expires in 15 minutes.`,
    footnote: "Can’t find it? Check your spam or promotions folder.",
  },
  notMember: {
    title: "This email isn’t on our paying member list",
    description:
      "The members-only feed is for SDC paying members. You can become a member, or join our free newsletter to hear about opportunities in Waterloo Region.",
    becomeMember: "Become a paying member",
    joinNewsletter: "Join the newsletter",
    differentEmail: "Try a different email",
    footnoteBefore: "Already a member? Contact SDC at ",
    footnoteAfter: " and we’ll update your email.",
  },
};

export const partnerCopy = {
  pageTitle: "CivicHub partner sign in",
  title: "CivicHub partner sign in",
  description: "Enter the email SDC invited you with and we’ll send you a sign-in link.",
  emailLabel: "Organization email",
  submit: "Email me a sign-in link",
  footnoteBefore: "Lost access to this email? Contact SDC at ",
  footnoteAfter: " and an admin will move your account to a new email.",
  notFound: "Email not found",
  /** New, needs approval: why the button waits after "Email not found". */
  editToRetry: "Change the email to try again.",
  help: {
    title: "Not sure which email to use?",
    tips: [
      "Check for typos in the address.",
      "Use the email SDC sent your invitation to. Search your inbox for “CivicHub invitation.”",
      "Try your organization’s shared inbox if you have one.",
    ],
    contactBefore: "If SDC has the wrong email on file, or your organization isn’t a partner yet, contact SDC at ",
    contactAfter: ".",
    contact: "Contact SDC",
  },
  sent: {
    title: "Check your email",
    description: (email: string) =>
      `We sent a sign-in link to ${email}. You’ll stay signed in on this device until you sign out.`,
    differentEmail: "Use a different email",
    footnote: "Work email filters sometimes hold these messages. Check spam or quarantine if it doesn’t arrive.",
  },
};

export const adminCopy = {
  pageTitle: "Admin sign in",
  badge: "SDC staff only",
  title: "Admin sign in",
  description: "Use the shared SDC admin account.",
  emailLabel: "Email",
  passwordLabel: "Password",
  submit: "Sign in",
  footnote: "You’ll stay signed in for 30 days on this device.",
  /** New, needs approval. */
  passwordRequired: "Enter the admin password.",
  incorrectPassword: (attemptsLeft: number) =>
    `Incorrect password. ${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} left before sign-in is paused.`,
  paused: {
    title: "Sign-in paused for 15 minutes",
    description:
      "There were too many incorrect password attempts on the shared admin account. Wait for the timer, or ask another admin who knows the current password.",
    /** New, needs approval: the disabled email field's reason. */
    fieldReason: "Sign-in is paused. Wait for the timer to finish.",
    tryAgainIn: (seconds: number) => `Try again in ${formatCountdown(seconds)}`,
  },
  sessionEnded: {
    title: "Your session has ended",
    // Figma reads "required to sign in 30 days"; fixed with the owner's OK (6 Oct 2026).
    description:
      "For security, admins sign in again every 30 days. Sign in again to keep managing members and partners.",
    action: "Sign in again",
  },
};

/** New, needs approval: the public page for a shared opportunity (member screens 8–11). */
export const sharedOpportunityCopy = {
  memberSignIn: "Member sign in",
  postedBy: (organization: string) => `Posted by ${organization}`,
  openLink: "Open link",
  unavailable: {
    title: "This opportunity is no longer available",
    description: "It may have ended, or the organization that posted it may have taken it down.",
  },
  newsletter: {
    title: "Get opportunities like this by email",
    description:
      "SDC’s free monthly newsletter shares volunteer roles, events and other ways to get involved in Waterloo Region.",
    emailLabel: "Email address",
    submit: "Subscribe",
    subscribed: {
      title: "You’re subscribed",
      description: (email: string) => `We’ll send the next newsletter to ${email}.`,
    },
    alreadySubscribed: {
      title: "You’re already subscribed",
      description: (email: string) => `${email} is already on our newsletter list, so there’s nothing else to do.`,
    },
    temporary: "We couldn't subscribe you just now. Try again in a minute.",
  },
};
