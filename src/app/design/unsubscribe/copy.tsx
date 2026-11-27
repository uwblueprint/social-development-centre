import type { ReactNode } from "react";
import type { EmailType } from "./data";

/*
 * Every user-facing string for the email flow (/design/unsubscribe), plus the strings the
 * cancel-membership flow shares with it. Copy is from "SDC Unsubscribe & Cancel Membership — Step Copy"
 * (https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) where it has the string; bracketed values in
 * the doc are function arguments here.
 *
 * Strings marked "Not in doc" come from the FigJam flow, Jesse's unsubscribe page or design, and are
 * placeholders: confirm them with SDC before build. "Shallot" marks copy from the design review.
 */

export const unsubscribeCopy = {
  pageTitle: "Email preferences", // Not in doc.

  /* The emoji above each screen's heading, like the sign-in pages. Drafts: Shallot to confirm. */
  emoji: {
    preferences: "📬", // Update your email preferences
    unsubscribed: "📭", // You're unsubscribed
    closed: "👍", // You can close this tab now
  },

  /* Shared with the cancel-membership flow. */
  undoUnsubscribe: "Unsubscribed by mistake?",
  resubscribe: "Resubscribe",
  resubscribed: "You're subscribed again. You'll get emails from SDC again.", // Not in doc (Jesse's).
  unsubscribed: "You're unsubscribed", // The doc's A4 heading.
  cancelMembership: "Cancel membership",
  back: "Back", // The top-left arrow's name for screen readers.

  emails: {
    // The preferences page (footer link 1). Shallot.
    heading: "Update your email preferences",
    line: "Choose what you still want to hear about.",
    types: {
      monthly: "A monthly summary of SDC's work",
      membership: "Only emails about my membership",
    } satisfies Record<EmailType, string>,
    unsubscribeAll: "Unsubscribe from all emails",
    save: "Save my preference",
    // The toast after saving. Shallot.
    saved: "Your preference has been updated.",

    // After unsubscribing from all, for members (FigJam: "Membership is still active and will be automatically renewed").
    membership: (tier: string, date: ReactNode, amount: ReactNode) => (
      <>
        Your {tier} membership is still active. It renews on <strong>{date}</strong> for <strong>{amount}</strong>.
      </>
    ),
    soundsGood: "Sounds good", // Not in doc (FigJam).
    // "Sounds good" → the closing screen: heading `unsubscribed`, then this line.
    closeTab: "Awesome! You can close this tab now.", // Not in doc (Shallot).
  },
};
