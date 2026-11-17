import type { ReactNode } from "react";
import type { EmailReason, EmailType } from "./data";

/*
 * Every user-facing string for the email flow (/design/unsubscribe), plus the strings the
 * cancel-membership flow shares with it. Copy is from "SDC Unsubscribe & Cancel Membership — Step Copy"
 * (https://claude.ai/artifact/9oi6VCBrW5R1xkz3uA9DzV) where it has the string; bracketed values in
 * the doc are function arguments here.
 *
 * Strings marked "Not in doc" come from the FigJam flow, Jesse's unsubscribe page or design, and are
 * placeholders: confirm them with SDC before build.
 */

export const unsubscribeCopy = {
  pageTitle: "Email preferences", // Not in doc.

  /* Shared: the button a person pressed changes its text to the result and stops doing anything. */
  undoUnsubscribe: "Unsubscribed by mistake?",
  resubscribe: "Resubscribe",
  resubscribed: "You're subscribed again. You'll get emails from SDC again.", // Not in doc (Jesse's).
  unsubscribe: "Unsubscribe", // Not in doc (design).
  unsubscribed: "You're unsubscribed", // The doc's A4 heading: the email page's heading after unsubscribing, and a button's result elsewhere.
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
