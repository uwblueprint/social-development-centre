import type { ReactNode } from "react";
import type { MembershipReason, PauseLength } from "../unsubscribe/data";

/*
 * Every user-facing string for the cancel-membership flow (/design/cancel-membership). Strings shared
 * with the email flow (Unsubscribe, Resubscribe, Cancel membership, "You can close this tab now") are
 * in ../unsubscribe/copy.tsx. Copy is from "SDC Unsubscribe & Cancel Membership — Step Copy"
 * (https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) or from Shallot where marked; strings marked
 * "Not in doc" are placeholders: confirm them with SDC before build.
 */

export const cancelCopy = {
  pageTitle: "Pause or cancel your membership", // Not in doc.
  back: "Back", // Not in doc.

  /* Pause: presets and a live restart date (after Disney+). */
  pause: {
    heading: "Pause your membership", // Not in doc.
    question: "How long?",
    lengths: { "1": "1 month", "2": "2 months", "3": "3 months" } satisfies Record<PauseLength, string>, // Not in doc (copy doc: up to 3 months).
    restartsOn: (date: ReactNode) => (
      <>
        Your membership restarts on <strong>{date}</strong>.
      </>
    ), // Not in doc.
    whatHappens:
      "You won't be charged while paused. Your voting rights and member benefits are on hold until your membership restarts.",
    pause: "Pause membership",
  },

  /* End screen after pausing. */
  paused: {
    heading: "Your membership is paused", // The doc's B3 confirmation.
    body: (restartDate: ReactNode, amount: ReactNode) => (
      <>
        It restarts on <strong>{restartDate}</strong>, and you{"'"}ll be charged <strong>{amount}</strong> that day.
        We{"'"}ll email you a week before.
      </>
    ),
    restartQuestion: "Want to come back sooner?",
    restartNow: "Restart my membership now",
  },

  /* "Your membership is active again": after "Keep my membership", and after restarting a pause. */
  active: {
    heading: "Your membership is active again", // Not in doc.
    thanks: "Thank you for your support.", // Shallot: "a thank you note for your support".
  },

  /* Step 1, the survey: one question, no follow-ups on this page. */
  reasons: {
    heading: "Before you go", // Shallot.
    question: "What's the main reason you're cancelling?", // Shallot.
    options: {
      emails: "I get too many emails",
      budget: "It's too expensive right now", // Shallot.
      break: "I need a break",
      done: "I don't want to be involved with SDC anymore",
    } satisfies Record<MembershipReason, string>,
    continue: "Continue", // Not in doc.
  },

  /* Step 2, the retention offer: one page per answer that has something to offer. "No longer involved" (or no answer) skips it. */
  offer: {
    // Too many emails → unsubscribe from emails instead (FigJam).
    emails: {
      heading: "Stop the emails, keep your membership", // Not in doc.
      line: "You can stop getting emails from SDC and still be a member.", // Not in doc.
      action: "Unsubscribe from emails instead", // Not in doc.
    },
    // Too expensive → a lower tier, or a pause (FigJam: "Pause / discontinue completely").
    budget: {
      heading: "Pay less instead", // Not in doc.
      line: (date: ReactNode) => (
        <>
          Switch to a lower tier from your next payment on <strong>{date}</strong>, or take a break.
        </>
      ), // Not in doc.
      switchTo: (tier: string, amount: string) => `Switch to ${tier} · ${amount} a month`, // The doc's "Switch to [lower tier]", with the price.
    },
    // Need a break, or too expensive with no lower tier → pause.
    break: {
      heading: "Take a break instead", // Not in doc.
      line: "Pause for up to 3 months. You won't be charged while paused.", // Not in doc.
    },
    pauseInstead: "Pause instead", // Not in doc.
    continueToCancel: "Continue to cancel", // Not in doc.
  },

  /* End screen after switching tier. */
  switched: {
    heading: (tier: string) => `You'll switch to ${tier}`, // Not in doc.
    body: (date: ReactNode, amount: ReactNode) => (
      <>
        From <strong>{date}</strong>, you{"'"}ll pay <strong>{amount}</strong> a month.
      </>
    ), // Not in doc.
    undoQuestion: "Changed your mind?", // Not in doc.
    undo: (tier: string) => `Stay a ${tier}`, // Not in doc.
    stayed: (tier: string) => `You'll stay a ${tier} member`, // Not in doc. The heading after the undo.
  },

  /* End screen after "Unsubscribe from emails instead": the heading after Resubscribe. */
  resubscribed: "You're subscribed again", // Not in doc.

  /* Confirm: what ends, then how to ask for a refund in small grey text. */
  confirm: {
    heading: "Cancel your membership?",
    whatEnds: "Your voting rights and member benefits end at the end of the month, and you won't be charged again.", // Shallot.
    refund: (lastBillingDate: string, email: string) =>
      `If you'd like a refund for your payment on ${lastBillingDate}, please email ${email}.`, // Shallot.
    refundEmail: "admin@sdc.com", // Shallot. Confirm the real address with SDC.
    keepMembership: "Keep my membership",
  },

  cancelled: {
    heading: "We're sorry to see you go", // Shallot.
    line: (since: string) =>
      `You've been an SDC supporter since ${since}. SDC runs on the generosity of members like you, so thank you for being part of it.`, // Shallot.
    confirmationSent: (email: string) => `We've sent a confirmation to ${email}.`,
    // Shallot. Only for people still getting emails; "unsubscribe here" links to the email flow.
    unsubscribe: (link: ReactNode) => <>If you would no longer like to hear from SDC, you can {link}.</>,
    unsubscribeLink: "unsubscribe here",
  },
};
