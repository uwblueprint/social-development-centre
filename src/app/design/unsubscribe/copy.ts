import type { EmailType } from "./data";

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
   * A1 is one screen now (design): the doc's A2 question with the email types as checkboxes, and the
   * doc's A2 and A4 results as confirmations under the buttons. The checkbox labels and the
   * unsubscribe button are design's, not the doc's: confirm with SDC.
   */
  a1: {
    /** Screen readers only: the visible heading is gone (design). */
    heading: "What would you like to change?",
    subtext: (email: string) => `Emails sent to ${email}`,
    question: "Choose what you still want to hear about.",
    types: {
      monthly: "A monthly summary of SDC's work",
      events: "Event and workshop invitations",
      campaigns: "Campaigns and calls to action",
    } satisfies Record<EmailType, string>,
    requiredNotices:
      "Because you're a voting member, you'll still get notices SDC is legally required to send, like annual meeting notices and votes.",
    save: "Save my preference",
    unsubscribeAll: "Unsubscribe from all communications",
    savedHeading: "Your preference is saved",
    savedBody: (chosenOption: string) =>
      `You'll get ${chosenOption} from now on. One email already scheduled may still arrive while this takes effect.`,
    unsubscribedHeading: "You're unsubscribed",
    unsubscribedBody: "You won't get newsletters, event invitations or campaign emails from SDC anymore.",
    membership: (tier: string, date: string, amount: string) =>
      `Your ${tier} membership is still active. It renews on ${date} for ${amount}.`,
    cancelMembership: "Cancel membership",
    resubscribe: "Resubscribe",
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
    // From Jesse's unsubscribe page (origin/jesse/email-links).
    resubscribedHeading: "You're subscribed again",
    resubscribedBody: "You'll get emails from SDC again.",
    emailsKept: "You'll keep getting emails from SDC.",
    restarted: "Your membership is active again.",
  },
};
