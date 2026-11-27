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
  // The name in the card header on every step, so each step reads as part of cancelling. Shallot.
  flowName: "Cancel membership",

  /* The emoji over the heading once someone accepts an offer (Shallot). Drafts. */
  emoji: {
    switched: "🎉", // You've switched to [tier]
    paused: "🗓️", // Your membership is paused
    unsubscribed: "📭", // You're unsubscribed (membership kept)
  },


  /*
   * Pause: the offer for "I need a break" (and for a Friend who finds it too expensive), straight from
   * the survey. Presets and a live restart date (after Disney+).
   */
  pause: {
    heading: "Pause membership instead?", // Shallot.
    lengths: { "1": "1 month", "2": "2 months", "3": "3 months" } satisfies Record<PauseLength, string>, // Not in doc (copy doc: up to 3 months).
    restartsOn: (date: ReactNode) => (
      <>
        Your membership restarts on <strong>{date}</strong>.
      </>
    ), // Not in doc.
    // Shallot: in place of "How long?", above the lengths.
    whatHappens:
      "You won't be charged while paused. Your voting rights and member benefits are on hold until your membership restarts.",
    pause: "Pause membership",
  },

  /* End screen after pausing. */
  paused: {
    heading: "Your membership is paused", // The doc's B3 confirmation.
    body: (restartDate: ReactNode) => (
      <>
        It will renew on <strong>{restartDate}</strong>. We{"'"}ll email you one week before.
      </>
    ), // Shallot.
    restartQuestion: "Want to come back sooner?",
    restartNow: "Restart my membership now",
  },

  /* "Your membership is active again": after "Keep membership" (with confetti), and after restarting a pause. */
  active: {
    heading: "Your membership is active again", // Not in doc.
    thanks: "Thank you for your support!", // Shallot.
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

  /* Every step of cancelling offers this, bottom left (Shallot: "at each stage user should be able to keep membership"). */
  keepMembership: "Keep membership", // Shallot.

  /*
   * Step 2, the retention offer: one page per answer that has something to offer, each offer in a card
   * whose button accepts it (Shallot). "No longer involved" (or no answer) skips it.
   */
  offer: {
    // Too many emails → unsubscribe from emails instead (FigJam).
    emails: {
      heading: "Unsubscribe from emails instead?", // Shallot.
      line: "You'll stop getting emails from SDC and stay a member.", // Shallot.
      action: "Unsubscribe from emails", // Not in doc.
    },
    // Too expensive → a card per lower tier (Shallot: title, "$xx per month", "Choose [tier] instead").
    budget: {
      heading: "Pay less instead", // Not in doc.
      // The date on its own line (Shallot).
      line: (date: ReactNode) => (
        <>
          A lower tier starts from your next payment on
          <br />
          <strong>{date}</strong>.
        </>
      ), // Not in doc.
      current: "Current plan", // Not in doc. The badge on the member's own tier.
      price: (amount: string) => `${amount} per month`, // Shallot.
      choose: "Continue", // Shallot.
      // The accessible name, so screen readers can tell the cards' Continue buttons apart. Starts with the visible label (WCAG 2.5.3).
      chooseLabel: (tier: string) => `Continue with ${tier}`,
    },
    continueToCancel: "Continue to cancel", // Not in doc.
  },

  /*
   * After Continue on a Pay less card: what's left of this payment, then confirm (after Dribbble's
   * "Confirm your cancellation"). Continue on the current plan's card confirms keeping it.
   */
  plan: {
    daysLeft: (days: number, tier: string) => (
      <>
        You still have <strong>{days} days</strong> left on your {tier} plan.
      </>
    ), // Not in doc.
    heading: "Confirm your plan change", // Shallot.
    change: (tier: string, date: ReactNode, amount: ReactNode) => (
      <>
        From <strong>{date}</strong>, you{"'"}ll be a {tier} member for <strong>{amount}</strong> a month. You{"'"}ll have
        access to:
      </>
    ), // Not in doc.
    confirm: "Confirm plan change", // Not in doc.
    keepHeading: "Keep your plan", // Not in doc.
    keep: (tier: string, amount: ReactNode) => (
      <>
        You{"'"}ll stay a {tier} member for <strong>{amount}</strong> a month, with access to:
      </>
    ), // Not in doc.
    confirmKeep: (tier: string) => `Stay a ${tier}`, // Not in doc.
  },

  /* End screen after switching tier. */
  switched: {
    heading: (tier: string) => `You've switched to ${tier}`, // Shallot.
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
    confirm: "Confirm cancellation", // Shallot.
  },

  cancelled: {
    heading: "Your membership has been cancelled", // Shallot. Above the photo card.
    // The photo card (Shallot, after the referral page's banner): this over the photo, then the words under it.
    overlay: "Thank you for being a part of SDC", // Shallot.
    // How long they were a member: whole years, or months under a year.
    length: (years: number, months: number) =>
      years >= 1 ? `${years} ${years === 1 ? "year" : "years"}` : `${months} ${months === 1 ? "month" : "months"}`,
    // Shallot.
    membership: (from: string, to: string, length: string) => (
      <>
        We{"'"}re sorry to see you go. You{"'"}ve been an SDC member from <strong>{from}</strong> to <strong>{to}</strong>.
        That{"'"}s {length} of support!
      </>
    ),
    // Shallot; "rejoin" is the link (rejoin in the sentence, not a separate button).
    thanks: (link: ReactNode) => (
      <>
        SDC runs on the generosity of members like you, so thank you for being part of it. You{"'"}re welcome to {link}{" "}
        anytime.
      </>
    ),
    rejoinLink: "rejoin",
  },
};
