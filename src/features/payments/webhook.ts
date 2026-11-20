import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { FAILED_ATTEMPTS_BEFORE_SUSPEND } from "./config";
import { getSubscription, PayPalError, suspendSubscription, toCents, type PayPalSubscription } from "./paypal";

/**
 * What each PayPal webhook does to our records. The route (src/app/api/webhooks/paypal) has already
 * checked the event really came from PayPal and that it hasn't been processed before. Any error is
 * thrown, so the route answers 500 and PayPal sends the event again later.
 */

type Db = SupabaseClient<Database>;

export interface PayPalEvent {
  id: string;
  event_type: string;
  resource: Record<string, unknown>;
}

/** The events to tick when registering the webhook in PayPal. Everything else is acknowledged and ignored. */
export const HANDLED_EVENTS = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.SALE.REFUNDED",
  "PAYMENT.SALE.REVERSED",
] as const;

export async function handleEvent(db: Db, event: PayPalEvent): Promise<void> {
  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      return subscriptionActivated(db, event.resource as unknown as PayPalSubscription);
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      return paymentFailed(db, event.resource as unknown as PayPalSubscription);
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      return setStatus(db, String(event.resource.id), "suspended");
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
      return subscriptionEnded(db, String(event.resource.id));
    case "PAYMENT.SALE.COMPLETED":
      return saleCompleted(db, event.resource as unknown as Sale);
    case "PAYMENT.SALE.REFUNDED":
      return moneyBack(db, event.resource as unknown as Refund, "refund");
    case "PAYMENT.SALE.REVERSED":
      return moneyBack(db, event.resource as unknown as Refund, "reversal");
    default:
      return;
  }
}

// ---------- subscriptions ----------

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

async function findSubscription(db: Db, paypalId: string): Promise<SubscriptionRow | null> {
  const { data, error } = await db.from("subscriptions").select("*").eq("paypal_subscription_id", paypalId).maybeSingle();
  if (error) throw error;
  return data;
}

/** A member's subscription went live (or came back after a suspension). */
async function subscriptionActivated(db: Db, resource: PayPalSubscription): Promise<void> {
  const existing = await findSubscription(db, resource.id);
  const fields = {
    status: "active",
    failed_attempts: 0,
    last_failed_at: null,
    next_billing_at: resource.billing_info?.next_billing_time ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    if (existing.status === "cancelled") return;
    const { error } = await db.from("subscriptions").update(fields).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  // Not started from our site (or our row was lost): link it through custom_id when that's a member.
  const personId = await memberIdFrom(db, resource.custom_id);
  const { error } = await db
    .from("subscriptions")
    .insert({ ...fields, paypal_subscription_id: resource.id, paypal_plan_id: resource.plan_id, person_id: personId });
  // A second live subscription for the same member breaks the one-live-per-person index. Keep it
  // visible to admins instead of failing the webhook forever.
  if (error?.code === "23505") {
    const retry = await db
      .from("subscriptions")
      .insert({ ...fields, paypal_subscription_id: resource.id, paypal_plan_id: resource.plan_id, person_id: null });
    if (retry.error) throw retry.error;
    console.error(`[paypal] subscription ${resource.id} duplicates a live one; saved without a member`);
    return;
  }
  if (error) throw error;
}

/**
 * A charge or one of PayPal's retries failed. The member stays active with a warning until the
 * FAILED_ATTEMPTS_BEFORE_SUSPEND-th failure, when we suspend it in PayPal.
 */
async function paymentFailed(db: Db, resource: PayPalSubscription): Promise<void> {
  const subscription = await findSubscription(db, resource.id);
  if (!subscription || subscription.status === "cancelled") return;

  const failedAttempts = subscription.failed_attempts + 1;
  const suspend = failedAttempts >= FAILED_ATTEMPTS_BEFORE_SUSPEND || resource.status === "SUSPENDED";
  if (suspend && resource.status !== "SUSPENDED" && subscription.status !== "suspended") {
    try {
      await suspendSubscription(resource.id, "Payment failed twice");
    } catch (cause) {
      // 422 = PayPal says it can't be suspended from its current state (e.g. PayPal already did it).
      // Anything else (PayPal down) is thrown, so the webhook is retried.
      if (!(cause instanceof PayPalError && cause.status === 422)) throw cause;
      console.error(`[paypal] suspend ${resource.id} refused: ${cause.body}`);
    }
  }

  const { error } = await db
    .from("subscriptions")
    .update({
      status: suspend ? "suspended" : "payment_problem",
      failed_attempts: failedAttempts,
      last_failed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);
  if (error) throw error;
}

async function setStatus(db: Db, paypalId: string, status: "suspended"): Promise<void> {
  const { error } = await db
    .from("subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("paypal_subscription_id", paypalId)
    .neq("status", "cancelled");
  if (error) throw error;
}

/** Cancelled anywhere (our site, the member's PayPal account, an admin): the membership ends. */
async function subscriptionEnded(db: Db, paypalId: string): Promise<void> {
  const subscription = await findSubscription(db, paypalId);
  if (!subscription) return;
  const { error } = await db.rpc("end_paid_membership", { p_subscription_id: subscription.id });
  if (error) throw error;
}

// ---------- money ----------

interface Sale {
  id: string;
  amount: { total: string; currency: string };
  transaction_fee?: { value: string; currency: string };
  billing_agreement_id?: string;
  create_time: string;
}

interface Refund {
  id: string;
  sale_id?: string;
  amount: { total: string; currency: string };
  create_time: string;
}

/** A subscription payment went through: record it and clear any payment problem. */
async function saleCompleted(db: Db, sale: Sale): Promise<void> {
  const subscription = sale.billing_agreement_id ? await findSubscription(db, sale.billing_agreement_id) : null;
  const amount = toCents(sale.amount.total);
  if (amount === null) throw new Error(`Sale ${sale.id} has no amount`);

  const { error } = await db.from("payments").upsert(
    {
      person_id: subscription?.person_id ?? null,
      subscription_id: subscription?.id ?? null,
      kind: "payment",
      amount_cents: amount,
      fee_cents: toCents(sale.transaction_fee?.value),
      currency: sale.amount.currency,
      paid_at: sale.create_time,
      paypal_transaction_id: sale.id,
    },
    { onConflict: "paypal_transaction_id", ignoreDuplicates: true },
  );
  if (error) throw error;
  if (!subscription || subscription.status === "cancelled") return;

  // The sale doesn't say when the next charge is; ask PayPal. Not worth failing the webhook over.
  let nextBillingAt = subscription.next_billing_at;
  try {
    nextBillingAt = (await getSubscription(subscription.paypal_subscription_id)).billing_info?.next_billing_time ?? nextBillingAt;
  } catch (cause) {
    console.error(`[paypal] couldn't refresh ${subscription.paypal_subscription_id}:`, cause);
  }

  const update = await db
    .from("subscriptions")
    .update({
      status: "active",
      failed_attempts: 0,
      last_failed_at: null,
      next_billing_at: nextBillingAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);
  if (update.error) throw update.error;
}

/** A refund (from SDC) or a reversal (a chargeback): a negative row, on the same member as the sale. */
async function moneyBack(db: Db, refund: Refund, kind: "refund" | "reversal"): Promise<void> {
  const cents = toCents(refund.amount.total);
  if (cents === null) throw new Error(`${kind} ${refund.id} has no amount`);

  let original: { person_id: string | null; subscription_id: string | null } | null = null;
  if (refund.sale_id) {
    const { data, error } = await db
      .from("payments")
      .select("person_id, subscription_id")
      .eq("paypal_transaction_id", refund.sale_id)
      .maybeSingle();
    if (error) throw error;
    original = data;
  }

  const { error } = await db.from("payments").upsert(
    {
      person_id: original?.person_id ?? null,
      subscription_id: original?.subscription_id ?? null,
      kind,
      amount_cents: -Math.abs(cents),
      currency: refund.amount.currency,
      paid_at: refund.create_time,
      paypal_transaction_id: refund.id,
    },
    { onConflict: "paypal_transaction_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

// ---------- shared ----------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** custom_id is the person id our server set. Only trusted when it names a current member. */
async function memberIdFrom(db: Db, customId: string | undefined): Promise<string | null> {
  if (!customId || !UUID.test(customId)) return null;
  const { data, error } = await db.from("memberships").select("person_id").eq("person_id", customId).maybeSingle();
  if (error) throw error;
  return data?.person_id ?? null;
}
