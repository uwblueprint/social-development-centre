import type { EmailReason, EmailType, MembershipReason, PauseUnit } from "./data";

/*
 * Every user-facing string for the email page (A4) and the membership pages (B1, B4, B5). Copy is from
 * "SDC Unsubscribe & Cancel Membership — Step Copy" (https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV)
 * where it has the string; bracketed values in the doc are function arguments here.
 *
 * Strings marked "Not in doc" come from the FigJam flow, Jesse's unsubscribe page or design, and are
 * placeholders: confirm them with SDC before build.
 */

export const unsubscribeCopy = {
  pageTitle: "Email preferences and membership", // Not in doc.
  back: "Back", // Not in doc.

  /* Shared: the button a person pressed changes its text to the result and stops doing anything. */
  undoUnsubscribe: "Unsubscribed by mistake?",
  resubscribe: "Resubscribe",
  resubscribed: "You're subscribed again. You'll get emails from SDC again.", // Not in doc (Jesse's).
  unsubscribe: "Unsubscribe", // Not in doc (design).
  unsubscribed: "You're unsubscribed", // The doc's A4 heading, as a button.
  cancelMembership: "Cancel membership",

  emails: {
    heading: "Unsubscribe from SDC emails", // Not in doc (Jesse's).
    question: "What's going on?",
    reasons: {
      "too-many": "I get too many emails",
      "not-relevant": "The emails aren't relevant to me",
      "no-more": "I don't want to hear from SDC anymore",
    } satisfies Record<EmailReason, string>,

    // Too many emails → fewer emails → preference saved.
    typesQuestion: "Choose what you still want to hear about.",
    types: {
      monthly: "A monthly summary of SDC's work",
      events: "Event and workshop invitations", // Not in doc (adapted).
      campaigns: "Campaigns and calls to action", // Not in doc.
    } satisfies Record<EmailType, string>,
    save: "Save my preference",
    saved: "Your preference is saved", // The doc's A2 confirmation, as a button.

    // Not relevant → the intake form, to update interests.
    interestsBody: "We'll only email you about the topics you pick. You can change this anytime from the link in any SDC email.",
    interestsLink: "Tell us what you care about",

    /** Jesse's note under the unsubscribe button. */
    unsubscribeNote: (isMember: boolean) =>
      isMember ? "You'll stop getting emails from SDC. You'll still be a member." : "You'll stop getting emails from SDC.",

    // After unsubscribing, for members (FigJam: "Membership is still active and will be automatically renewed").
    membership: (tier: string, date: string, amount: string) =>
      `Your ${tier} membership is still active. It renews on ${date} for ${amount}.`,
    soundsGood: "Sounds good", // Not in doc (FigJam).
  },

  membership: {
    heading: "Pause or cancel your membership",
    summary: (tier: string, amount: string, date: string) => `${tier} membership · ${amount} a month · next payment ${date}`,
    question: "What's going on?",
    reasons: {
      emails: "I get too many emails",
      budget: "It costs too much right now",
      break: "I need a break",
      done: "I don't want to be involved with SDC anymore",
    } satisfies Record<MembershipReason, string>,

    // Too many emails → unsubscribe from emails instead (FigJam).
    emailsBody: "You can stop getting emails and keep your membership.", // Not in doc.
    emailsAction: "Unsubscribe from emails instead", // Not in doc.

    // Budget → pause, or cancel completely (the cancel button below). Need a break → pause.
    budgetBody: "You can pause instead.", // Not in doc. "Discontinue completely" is the cancel button below.
    pauseLength: "How long?",
    pauseUnit: "Weeks, months or years", // Not in doc.
    pauseUnits: { weeks: "Weeks", months: "Months", years: "Years" } satisfies Record<PauseUnit, string>,
    pauseLengthError: "Enter a whole number, like 2.", // Not in doc.
    whatHappens:
      "You won't be charged while paused. Your voting rights and member benefits are on hold until your membership restarts.",
    pause: "Pause membership",
    paused: "Your membership is paused", // The doc's B3 confirmation, as a button.
    pausedBody: (restartDate: string, amount: string, reminderDate: string) =>
      `It restarts on ${restartDate}, and you'll be charged ${amount} that day. We'll email you on ${reminderDate} before that happens.`,
    restartQuestion: "Want to come back sooner?",
    restartNow: "Restart my membership now",
    restarted: "Your membership is active again.", // Not in doc.

    // No longer want to be involved → thank them (FigJam), then the cancel button.
    thanks: "Thank you for being part of SDC. You can cancel below, and you can rejoin anytime.", // Not in doc.
  },

  cancel: {
    heading: "Cancel your membership?",
    noMoreCharges: "You won't be charged again.",
    endsToday: "Your voting rights and member benefits end today.",
    endsAtPeriodEnd: (periodEndDate: string) =>
      `Your voting rights and member benefits continue until ${periodEndDate}.`,
    notRefundable: (lastBillingDate: string) => `Your payment on ${lastBillingDate} isn't refundable.`,
    rejoin: "You can rejoin anytime.",
    keepMembership: "Keep my membership",
    noteLabel: "Anything you'd like us to know? (optional)",
  },

  cancelled: {
    heading: "Your membership is cancelled",
    body: (email: string) => `You won't be charged again. We've sent a confirmation to ${email}.`,
    emailQuestion: "Want to keep hearing about SDC's work?",
    keepEmails: "Keep getting emails",
    emailsKept: "You'll keep getting emails", // Not in doc.
  },
};
