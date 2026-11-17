import type { ReactNode } from "react";
import type { MembershipReason, PauseUnit } from "../unsubscribe/data";

/*
 * Every user-facing string for the cancel-membership flow (/design/cancel-membership). Strings shared
 * with the email flow (Unsubscribe, Resubscribe, Cancel membership) are in ../unsubscribe/copy.tsx.
 * Copy is from "SDC Unsubscribe & Cancel Membership — Step Copy"
 * (https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) or from Shallot where marked; strings marked
 * "Not in doc" are placeholders: confirm them with SDC before build.
 */

export const cancelCopy = {
  pageTitle: "Cancel your membership", // Not in doc.

  reasons: {
    heading: "Before you go", // Shallot.
    /** Under the heading. `[events / workshops / resources]` is for SDC to fill with what's true. */
    line: (since: string) =>
      `You've supported SDC since ${since}. Member contributions are what keep SDC running, including events, workshops and resources.`, // Shallot; the list is a placeholder.
    question: "What's the main reason you're cancelling?", // Shallot.
    options: {
      emails: "I get too many emails",
      budget: "It's too expensive right now", // Shallot.
      break: "I need a break",
      done: "I don't want to be involved with SDC anymore",
    } satisfies Record<MembershipReason, string>,

    // Too many emails → unsubscribe from emails instead (FigJam).
    emailsBody: "You can stop getting emails and keep your membership.", // Not in doc.
    emailsAction: "Unsubscribe from emails instead", // Not in doc.

    // Too expensive → a lower tier, or pause (FigJam: "Pause / discontinue completely").
    lowerTierBody: (tier: string, amount: string, date: string) =>
      `You're a ${tier} member at ${amount} a month. Pay less instead: a change starts on your next payment, ${date}.`, // Not in doc.
    /** What each tier includes. Placeholders until SDC says what the tiers include. */
    tierIncludes: {
      friend: "Voting rights and member updates", // Placeholder.
      supporter: "Everything in Friend, plus early event invitations", // Placeholder.
      sustainer: "Everything in Supporter, plus a yearly impact report", // Placeholder.
    } as Record<string, string>,
    perMonth: "/ month", // Not in doc.
    switchTo: (tier: string) => `Switch to ${tier}`, // The doc's "Switch to [lower tier]".
    switched: (tier: string) => `You'll switch to ${tier}`, // Not in doc.
    switchedBody: (date: ReactNode, amount: ReactNode) => (
      <>
        From <strong>{date}</strong>, you{"'"}ll pay <strong>{amount}</strong> a month.
      </>
    ), // Not in doc.
    switchBackQuestion: "Changed your mind?", // Not in doc.
    switchBack: (tier: string) => `Stay a ${tier}`, // Not in doc.
    stayed: (tier: string) => `You'll stay a ${tier} member.`, // Not in doc.
    pauseInsteadQuestion: "Or take a break:", // Not in doc.
    pauseInstead: "Pause instead", // Not in doc.

    // Need a break → pause.
    pauseLength: "How long?",
    pauseUnit: "Weeks, months or years", // Not in doc.
    pauseUnits: { weeks: "Weeks", months: "Months", years: "Years" } satisfies Record<PauseUnit, string>,
    pauseLengthError: "Enter a whole number, like 2.", // Not in doc.
    /** Updates as they type, before they press Pause (after Disney+). */
    restartsOn: (date: ReactNode) => (
      <>
        Your membership restarts on <strong>{date}</strong>.
      </>
    ), // Not in doc.
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
    thanks: "Thank you for being part of SDC. You can rejoin anytime.", // Not in doc.

    continueToCancel: "Continue to cancel", // Not in doc.
  },

  confirm: {
    heading: "Cancel your membership?",
    noMoreCharges: "You won't be charged again.",
    endsToday: "Your voting rights and member benefits end today.",
    endsAtPeriodEnd: (periodEndDate: string) => `Your voting rights and member benefits continue until ${periodEndDate}.`,
    notRefundable: (lastBillingDate: string) => `Your payment on ${lastBillingDate} isn't refundable.`,
    rejoin: "You can rejoin anytime.",
    keepMembership: "Keep my membership",
    noteLabel: "Anything you'd like us to know? (optional)",
  },

  cancelled: {
    heading: "We're sorry to see you go", // Shallot.
    line: (since: string) =>
      `You've been an SDC supporter since ${since}. SDC runs on the generosity of members like you, so thank you for being part of it.`, // Shallot.
    confirmationSent: (email: string) => `We've sent a confirmation to ${email}.`,
    emailQuestion: "Want to keep hearing about SDC's work?",
    keepEmails: "Keep getting emails",
    emailsKept: "You'll keep getting emails", // Not in doc.
  },
};
