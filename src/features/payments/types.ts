/**
 * Membership payments, as the screens receive them. Safe to import from client components.
 * docs/backend/payments.md describes the tables behind them.
 */

/** "none" = never started a subscription. The others mirror public.subscriptions.status. */
export type PaymentStatus = "none" | "pending" | "active" | "payment_problem" | "suspended" | "cancelled";

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
}

/** A row on the admin Payments page. */
export interface MemberPaymentRow {
  personId: string;
  name: string | null;
  email: string;
  status: PaymentStatus;
  failedAttempts: number;
  nextBillingAt: string | null;
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
