import "server-only";

/**
 * Membership payments settings. docs/backend/payments.md explains where each env var comes from.
 */

/** A membership members can pay for. Each one is a Plan in SDC's PayPal account. */
export interface MembershipPlan {
  /** Our own id for it, sent from the members' area form. Never shown. */
  key: string;
  /**
   * The PayPal Plan id (starts with "P-"). Sandbox and live Plans have different ids, so it's an env
   * var. The name and price members see are read from this Plan in PayPal (queries.ts).
   */
  paypalPlanId: string | undefined;
}

/** One entry per membership price SDC offers. Add an entry and an env var for each new Plan. */
export const PLANS: MembershipPlan[] = [{ key: "individual", paypalPlanId: process.env.PAYPAL_PLAN_ID_INDIVIDUAL }];

export function findPlan(key: string): MembershipPlan | undefined {
  return PLANS.find((plan) => plan.key === key);
}

/**
 * Failed payment attempts (the first charge plus PayPal's retries, 5 days apart) before we suspend the
 * subscription ourselves (decision, 19 Nov 2026). PayPal's own Plan setting only counts whole failed
 * billing cycles, so we count attempts in the webhook. Set the Plan's "payment failure threshold" to 1
 * as a backstop.
 */
export const FAILED_ATTEMPTS_BEFORE_SUSPEND = 2;

/** Sandbox until PAYPAL_ENV is "live". */
export function paypalEnvironment(): "sandbox" | "live" {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

export function paypalApiBase(): string {
  return paypalEnvironment() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

/** Where a member updates the card or bank account PayPal charges (their automatic payments). */
export function paypalManagePaymentsUrl(): string {
  return paypalEnvironment() === "live"
    ? "https://www.paypal.com/myaccount/autopay/"
    : "https://www.sandbox.paypal.com/myaccount/autopay/";
}

/** The name PayPal shows on its approval page. */
export const PAYPAL_BRAND_NAME = "Social Development Centre Waterloo Region";
