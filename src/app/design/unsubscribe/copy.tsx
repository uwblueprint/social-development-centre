import type { ReactNode } from "react";
import type { EmailReason } from "./data";

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
  pageTitle: "Unsubscribe from SDC emails", // Not in doc.


  /* Shared with the cancel-membership flow. */
  undoUnsubscribe: "Unsubscribed by mistake?",
  resubscribe: "Resubscribe",
  resubscribed: "You're subscribed again. You'll get emails from SDC again.", // Not in doc (Jesse's).
  unsubscribed: "You're unsubscribed", // The doc's A4 heading.
  cancelMembership: "Cancel membership",
  back: "Back", // The top-left arrow's name for screen readers.

  emails: {
    // The unsubscribe page (footer link 1): a one-answer survey, optional, then the button. Shallot.
    heading: "Unsubscribe from SDC emails",
    // The first two answers are from the first version of this page; placeholders until SDC confirms them.
    question: "Mind telling us why you are unsubscribing?", // Shallot.
    reasons: {
      "too-many": "I get too many emails",
      "not-relevant": "The emails aren't relevant to me",
      done: "I don't want to be involved with SDC anymore", // Shallot.
    } satisfies Record<EmailReason, string>,
    unsubscribe: "Unsubscribe", // Shallot.

    // After unsubscribing from all, for members (FigJam: "Membership is still active and will be automatically renewed").
    membership: (tier: string, date: ReactNode, amount: ReactNode) => (
      <>
        Your {tier} membership is still active.
        <br />
        It renews on <strong>{date}</strong> for <strong>{amount}</strong>.
      </>
    ),
    soundsGood: "Sounds good", // Not in doc (FigJam).
    // "Sounds good" → the closing screen: heading `unsubscribed`, then this line.
    closeTab: "Awesome! You can close this tab now.", // Not in doc (Shallot).
  },
};
