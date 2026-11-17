import type { EmailType, UnsubscribeReason } from "./data";

/*
 * Every user-facing string for the email-preferences (A1–A4) and membership (B1–B5) screens, word for
 * word from "SDC Unsubscribe & Cancel Membership — Step Copy"
 * (https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV). Bracketed values in the doc are function
 * arguments here, filled from the member's record.
 *
 * `notInDoc` at the bottom holds the few strings the doc doesn't have. They are placeholders: confirm
 * them with SDC before build.
 */

export const unsubscribeCopy = {
  /*
   * A1 folds the doc's A1–A3 into one screen (design): the doc's A2 question with the email types as
   * checkboxes. The checkbox labels and the two button labels below marked "design" aren't the doc's:
   * confirm with SDC.
   */
  a1: {
    /** Screen readers only: there are no visible headings (design). */
    heading: "What would you like to change?",
    subtext: (email: string) => `Emails sent to ${email}`,
    question: "Choose what you still want to hear about.",
    types: {
      monthly: "A monthly summary of SDC's work",
      events: "Event and workshop invitations",
      campaigns: "Campaigns and calls to action",
    } satisfies Record<EmailType, string>,
    save: "Save my preference",
    /** Replaces the Save button's text after saving, until a tick changes. */
    saved: "Your preference is saved",
    /** Design. */
    unsubscribeAll: "Unsubscribe from all communications",
  },

  /*
   * The unsubscribe page, laid out after Luma's (design): the reasons in a card, then the Unsubscribe
   * button, which the result replaces. Opening the page never unsubscribes; the button does.
   */
  a4: {
    /** Screen readers only. Jesse's heading, without the question mark. */
    heading: "Unsubscribe from SDC emails",
    /** Design. */
    cardLabel: "Unsubscribe from",
    cardLabelDone: "Unsubscribed from",
    org: "Social Development Centre",
    reasonQuestion: "Mind telling us why?",
    reasons: {
      "too-many": "Too many emails",
      "not-relevant": "Not relevant to me",
      "didnt-sign-up": "I didn't sign up for these",
      other: "Other",
    } satisfies Record<UnsubscribeReason, string>,
    /** Jesse's button and description. */
    confirm: "Unsubscribe",
    confirmNote: (isMember: boolean) =>
      isMember ? "You'll stop getting emails from SDC. You'll still be a member." : "You'll stop getting emails from SDC.",
    done: "You're unsubscribed.",
    undoQuestion: "Unsubscribed by mistake?",
    resubscribe: "Resubscribe",
    /** Design: the way to stay, like Luma's "All notification preferences". */
    fewerEmails: "Stay in the loop with fewer emails",
    membership: (tier: string, date: string, amount: string) =>
      `Your ${tier} membership is still active. It renews on ${date} for ${amount}.`,
    cancelMembership: "Cancel membership",
  },

  b1: {
    heading: "Pause or cancel your membership",
    summary: (tier: string, amount: string, date: string) => `${tier} membership · ${amount} a month · next payment ${date}`,
    question: "What's going on? (optional)",
    tooManyEmails: "I get too many emails",
    costsTooMuch: "It costs too much right now",
    needBreak: "I need a break",
    notInvolved: "I don't want to be involved with SDC anymore",
    cancelMembership: "Cancel membership",
  },

  b2: {
    heading: "Ways to pay less",
    body: "Here's what you can do instead of cancelling.",
    switchTier: (lowerTier: string, price: string, whatChanges: string) =>
      `Switch to ${lowerTier} for ${price} a month. ${whatChanges}`,
    pause: "Pause for up to 3 months. You won't be charged while paused.",
    cancelMembership: "Cancel membership",
    switchedHeading: (lowerTier: string) => `You're on ${lowerTier} now`,
    switchedBody: (nextBillingDate: string, price: string) => `Starting ${nextBillingDate}, you'll pay ${price} a month.`,
  },

  b3: {
    heading: "Pause your membership",
    question: "How long?",
    months: (n: number) => (n === 1 ? "1 month" : `${n} months`),
    whatHappens:
      "You won't be charged while paused. Your voting rights and member benefits are on hold until your membership restarts.",
    pause: "Pause membership",
    cancelInstead: "Cancel instead",
    pausedHeading: "Your membership is paused",
    pausedBody: (restartDate: string, amount: string, reminderDate: string) =>
      `It restarts on ${restartDate}, and you'll be charged ${amount} that day. We'll email you on ${reminderDate} before that happens.`,
    restartQuestion: "Want to come back sooner?",
    restartNow: "Restart my membership now",
  },

  b4: {
    heading: "Cancel your membership?",
    noMoreCharges: "You won't be charged again.",
    endsToday: "Your voting rights and member benefits end today.",
    endsAtPeriodEnd: (periodEndDate: string) =>
      `Your voting rights and member benefits continue until ${periodEndDate}.`,
    notRefundable: (lastBillingDate: string) => `Your payment on ${lastBillingDate} isn't refundable.`,
    rejoin: "You can rejoin anytime.",
    cancelMembership: "Cancel membership",
    keepMembership: "Keep my membership",
    noteLabel: "Anything you'd like us to know? (optional)",
  },

  b5: {
    heading: "Your membership is cancelled",
    body: (email: string) => `You won't be charged again. We've sent a confirmation to ${email}.`,
    emailQuestion: "Want to keep hearing about SDC's work?",
    keepEmails: "Keep getting emails",
    unsubscribeAll: "Unsubscribe from all emails",
  },

  /** Placeholders: the doc doesn't give these. Confirm with SDC before build. */
  notInDoc: {
    pageTitle: "Email preferences and membership",
    back: "Back",
    reasonThanks: "Thanks for telling us.",
    // From Jesse's unsubscribe page (origin/jesse/email-links).
    resubscribedHeading: "You're subscribed again",
    resubscribedBody: "You'll get emails from SDC again.",
    emailsKept: "You'll keep getting emails from SDC.",
    restarted: "Your membership is active again.",
  },
};
