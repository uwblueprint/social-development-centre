/**
 * Membership payments, as the screens receive them. Safe to import from client components.
 * docs/backend/payments.md describes the tables behind them.
 */

/**
 * "none" = not paying: never started, or their subscription ended. The others mirror
 * public.subscriptions.status. "cancelling" = they cancelled; paused in PayPal until cancel_at, and
 * reactivated if they resubscribe before then.
 */
export type PaymentStatus =
  | "none"
  | "pending"
  | "active"
  | "payment_problem"
  | "suspended"
  | "cancelling"
  | "cancelled";

/** Subscriptions that still exist in PayPal. A member has at most one (a unique index says so). */
export const LIVE_STATUSES = ["pending", "active", "payment_problem", "suspended", "cancelling"];

/** A plan as the members' area shows it (no PayPal ids). */
export interface PlanOption {
  key: string;
  name: string;
  priceLabel: string;
  /** False until its PayPal Plan id is set; the Pay button explains why it's off. */
  available: boolean;
}

/** The signed-in member's own membership card. */
export interface MyMembership {
  status: PaymentStatus;
  nextBillingAt: string | null;
  lastFailedAt: string | null;
  /** When a cancelling subscription ends for good; resubscribing before then keeps the same one. */
  cancelAt: string | null;
}

/** A row on the admin Payments page: a current member, or anyone with payment history. */
export interface MemberPaymentRow {
  personId: string;
  name: string | null;
  email: string;
  /** False once they're no longer a member (an admin removed them); kept for their payment history. */
  isMember: boolean;
  status: PaymentStatus;
  failedAttempts: number;
  nextBillingAt: string | null;
  cancelAt: string | null;
  lastPaidAt: string | null;
  lastAmountCents: number | null;
  currency: string | null;
  /** Payments minus refunds since 1 January (Toronto time), in cents. */
  paidThisYearCents: number;
}

/** A PayPal payment we couldn't link to a member, for an admin to assign. */
export interface UnmatchedPayment {
  id: string;
  kind: "payment" | "refund" | "reversal";
  paidAt: string;
  amountCents: number;
  currency: string;
  payerEmail: string | null;
  paypalTransactionId: string;
}

/** "$25.00" for CAD; other currencies keep their code ("US$25.00"). */
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}
