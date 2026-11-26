/**
 * Every member-facing and admin-facing string for membership payments, in one place, so wording can be
 * reviewed with SDC and changed here.
 */

export const memberCopy = {
  cardTitle: "Your membership",
  status: {
    none: "Pay for your membership with PayPal. It renews automatically until you cancel.",
    pending: "We’re confirming your payment with PayPal. This usually takes less than a minute.",
    active: "Your membership is active.",
    payment_problem: "Your last membership payment didn’t go through. PayPal will try again in a few days.",
    suspended: "Your membership payments are paused because two payments didn’t go through.",
    cancelled: "Your membership is cancelled.",
  },
  nextPayment: (date: string) => `Your next payment is on ${date}.`,
  payButton: "Pay membership",
  payAgainButton: "Start again",
  updatePaymentLink: "Update your payment method in PayPal",
  resumeButton: "Resume membership",
  resumeHint: "Update your payment method in PayPal first, then resume.",
  cancelButton: "Cancel membership",
  cancelTitle: "Cancel your membership?",
  cancelDescription:
    "PayPal will stop charging you, and you’ll no longer be able to sign in to the members’ area. You can become a member again later.",
  cancelConfirm: "Yes, cancel membership",
  cancelKeep: "Keep membership",
  thanksTitle: "Thank you!",
  thanksConfirming: "We’re confirming your payment with PayPal. This page updates by itself.",
  thanksDone: "Your membership is active. PayPal will email you a receipt.",
  thanksSlow: "PayPal is taking longer than usual. You can leave this page; your membership updates by itself.",
  defaultPlanName: "Membership",
  perInterval: { DAY: "day", WEEK: "week", MONTH: "month", YEAR: "year" } as Record<string, string>,
  backToMembersArea: "Back to the members’ area",
  cancelledTitle: "Your membership is cancelled",
  cancelledDescription: "PayPal won’t charge you again. Thank you for being part of SDC.",
  errors: {
    notConfigured: "Payments aren’t set up yet. Please try again later.",
    unknownPlan: "That membership isn’t available. Refresh the page and try again.",
    alreadyPaying: "You already have a membership subscription.",
    paypalDown: "We couldn’t reach PayPal. Try again in a few minutes.",
    nothingToCancel: "You don’t have a membership subscription to cancel.",
    nothingToResume: "Your membership isn’t paused.",
    resumeFailed: "PayPal couldn’t resume your membership. Check your payment method in PayPal, then try again.",
    generic: "Something went wrong. Try again.",
  },
};

/** Why a button is off, shown beside it (AGENTS.md rule 5). */
export const disabledReasons = {
  planNotSetUp: "This membership isn’t available yet.",
};

export const adminCopy = {
  pageTitle: "Payments",
  membersHeading: "Members and payments",
  unmatchedHeading: "Unmatched payments",
  unmatchedIntro: "PayPal payments we couldn’t link to a member, for example someone who paid SDC’s PayPal directly.",
  noMembers: "No members or payments yet.",
  noUnmatched: "Every payment is linked to a member.",
  status: {
    none: "Not paying",
    pending: "Confirming",
    active: "Active",
    payment_problem: "Payment problem",
    suspended: "Suspended",
    cancelled: "Cancelled",
  },
  cancelButton: "Cancel",
  cancelAccessible: (name: string) => `Cancel ${name}’s membership`,
  cancelTitle: (name: string) => `Cancel ${name}’s membership?`,
  cancelDescription:
    "PayPal stops charging them, and they lose the members’ area. They stay on SDC’s list with their payment history.",
  cancelConfirm: "Yes, cancel membership",
  cancelKeep: "Keep membership",
  cancelDone: (name: string) => `${name}’s membership is cancelled.`,
  assignButton: "Assign",
  assignAccessible: (amount: string, date: string) => `Assign the ${amount} payment from ${date} to a member`,
  assignTitle: "Assign payment to a member",
  assignMemberLabel: "Member",
  assignMemberPlaceholder: "Select a member",
  assignSubmit: "Assign payment",
  assignDone: "Payment assigned.",
  errors: {
    chooseMember: "Choose a member.",
    generic: "Something went wrong. Try again.",
    paypalDown: "We couldn’t reach PayPal, so nothing changed. Try again in a few minutes.",
  },
};
