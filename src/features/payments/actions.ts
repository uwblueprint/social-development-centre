"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin, requireMember } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { createSecretClient } from "@/lib/supabase/secret";
import { findPlan } from "./config";
import { adminCopy, memberCopy } from "./copy";
import {
  activateSubscription,
  cancelSubscription,
  createSubscription,
  getSubscription,
  isPayPalConfigured,
  PayPalError,
  suspendSubscription,
} from "./paypal";
import { LIVE_STATUSES as LIVE } from "./types";

/** Subscriptions a member can cancel: they're paying, or trying to. */
const PAYING = ["active", "payment_problem", "suspended"];

/**
 * Starting, cancelling and resuming a membership subscription. Every action checks who is signed in
 * first, then writes with the secret key (members can't write payment tables themselves). PayPal's
 * webhooks keep the same rows up to date afterwards, so writing here too only makes the screens
 * update sooner.
 *
 * Cancelling stops payment, not membership (decision, 27 Nov 2026): a paying member's subscription is
 * paused in PayPal until their next billing date (cancel_at). Paying again before then reactivates the
 * same subscription; after it, they start a new one through PayPal. docs/backend/payments.md.
 */

type Db = ReturnType<typeof secretClient>;

function secretClient() {
  const db = createSecretClient();
  if (!db) throw new Error("SUPABASE_SECRET_KEY is not set");
  return db;
}

async function origin(): Promise<string> {
  const h = await headers();
  const fromHeader = h.get("origin");
  if (fromHeader) return fromHeader;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

const now = () => new Date().toISOString();

// ---------- member ----------

/**
 * The Pay / Resubscribe button. Form field: `plan`. In order:
 * - Cancelled, but before cancel_at: reactivate the same PayPal subscription. No PayPal page, no new charge.
 * - Cancelled, after cancel_at: end the old one for good in PayPal, then start anew.
 * - Pending (they went to PayPal before): ask PayPal what happened first, so nobody pays twice.
 * - Otherwise: create the subscription in PayPal and send the member to PayPal to approve it.
 */
export async function startSubscription(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  if (!isPayPalConfigured()) return { status: "error", message: memberCopy.errors.notConfigured };
  const plan = findPlan(String(formData.get("plan") ?? ""));
  if (!plan?.paypalPlanId) return { status: "error", message: memberCopy.errors.unknownPlan };

  const db = secretClient();
  const { data: live, error } = await db
    .from("subscriptions")
    .select("id, status, paypal_subscription_id, cancel_at")
    .eq("person_id", member.id)
    .in("status", LIVE)
    .maybeSingle();
  if (error) return failed("startSubscription lookup", error);

  if (live?.status === "cancelling") {
    const stillPaidFor = live.cancel_at !== null && new Date(live.cancel_at) > new Date();
    if (stillPaidFor) {
      const reactivated = await reactivate(db, live);
      if (reactivated) return reactivated;
      // PayPal wouldn't reactivate it (e.g. the member cancelled it in their PayPal account): start anew.
    }
    // Past the billing date: end the paused one for good (nothing else does yet), then start anew.
    const ended = await endForGood(db, live, "Cancelled: billing date passed before resubscribing");
    if (ended) return ended;
  } else if (live?.status === "pending") {
    const settled = await settlePending(db, live);
    if (settled) return settled;
  } else if (live) {
    return { status: "error", message: memberCopy.errors.alreadyPaying };
  }

  const base = await origin();
  let approveUrl: string;
  try {
    const created = await createSubscription({
      planId: plan.paypalPlanId,
      personId: member.id,
      email: member.email,
      returnUrl: `${base}/membership/thanks`,
      cancelUrl: `${base}/`,
    });
    const saved = await db.from("subscriptions").insert({
      person_id: member.id,
      paypal_subscription_id: created.id,
      paypal_plan_id: plan.paypalPlanId,
      status: "pending",
    });
    // 23505: another tab started one at the same moment (one live subscription per member). The one
    // we just created is never approved, so it can't charge anyone.
    if (saved.error?.code === "23505") return { status: "error", message: memberCopy.errors.alreadyStarted };
    if (saved.error) return failed("startSubscription save", saved.error);
    approveUrl = created.approveUrl;
  } catch (cause) {
    return paypalFailed("startSubscription", cause, memberCopy.errors.paypalDown);
  }
  redirect(approveUrl);
}

/** Reactivates a paused subscription. Null when PayPal refuses (422), so the caller starts a new one. */
async function reactivate(
  db: Db,
  live: { id: string; paypal_subscription_id: string },
): Promise<ActionState | null> {
  try {
    await activateSubscription(live.paypal_subscription_id, "Resubscribed before the next billing date");
  } catch (cause) {
    if (cause instanceof PayPalError && cause.status === 422) {
      console.error(`[payments] reactivate ${live.paypal_subscription_id} refused: ${cause.body}`);
      return null;
    }
    return paypalFailed("reactivate", cause, memberCopy.errors.paypalDown);
  }

  let nextBillingAt: string | null = null;
  try {
    nextBillingAt = (await getSubscription(live.paypal_subscription_id)).billing_info?.next_billing_time ?? null;
  } catch (cause) {
    console.error(`[payments] couldn't refresh ${live.paypal_subscription_id}:`, cause);
  }
  const updated = await db
    .from("subscriptions")
    .update({
      status: "active",
      cancel_at: null,
      cancelled_at: null,
      cancelled_by: null,
      failed_attempts: 0,
      last_failed_at: null,
      ...(nextBillingAt ? { next_billing_at: nextBillingAt } : {}),
      updated_at: now(),
    })
    .eq("id", live.id);
  if (updated.error) return failed("reactivate save", updated.error);

  revalidatePath("/");
  revalidatePath("/admin/payments");
  return { status: "success", message: memberCopy.resubscribed };
}

/** Cancels it in PayPal for good and marks it cancelled. Null on success, or the error to show. */
async function endForGood(
  db: Db,
  live: { id: string; paypal_subscription_id: string },
  reason: string,
  cancelledBy?: string,
): Promise<ActionState | null> {
  try {
    await cancelSubscription(live.paypal_subscription_id, reason);
  } catch (cause) {
    // 422: already cancelled (or can't be) in PayPal. 404: PayPal never kept it. Either way it can't charge.
    if (!(cause instanceof PayPalError && (cause.status === 422 || cause.status === 404))) {
      return paypalFailed("endForGood", cause, memberCopy.errors.paypalDown);
    }
  }
  const ended = await db.rpc("end_paid_membership", {
    p_subscription_id: live.id,
    ...(cancelledBy ? { p_cancelled_by: cancelledBy } : {}),
  });
  if (ended.error) return failed("end_paid_membership", ended.error);
  return null;
}

/**
 * The member went to PayPal before and we haven't heard how it ended. Ask PayPal:
 * - Active: they did pay. Mark it active and stop, so no second subscription is made.
 * - Approved but not active yet: cancel it so it never charges, then the caller starts a new one.
 * - Never approved (or gone): drop our row; the caller starts a new one.
 * Null when the caller should go on and start a new subscription.
 */
async function settlePending(
  db: Db,
  live: { id: string; paypal_subscription_id: string },
): Promise<ActionState | null> {
  let paypalStatus: string | null = null;
  let nextBillingAt: string | null = null;
  try {
    const subscription = await getSubscription(live.paypal_subscription_id);
    paypalStatus = subscription.status;
    nextBillingAt = subscription.billing_info?.next_billing_time ?? null;
  } catch (cause) {
    if (!(cause instanceof PayPalError && cause.status === 404)) {
      return paypalFailed("settlePending lookup", cause, memberCopy.errors.paypalDown);
    }
  }

  if (paypalStatus === "ACTIVE") {
    const updated = await db
      .from("subscriptions")
      .update({ status: "active", next_billing_at: nextBillingAt, updated_at: now() })
      .eq("id", live.id)
      .eq("status", "pending");
    if (updated.error) return failed("settlePending activate", updated.error);
    revalidatePath("/");
    revalidatePath("/admin/payments");
    return { status: "success", message: memberCopy.alreadyActive };
  }

  if (paypalStatus === "APPROVED") {
    try {
      await cancelSubscription(live.paypal_subscription_id, "Replaced by a new subscription before it started");
    } catch (cause) {
      if (!(cause instanceof PayPalError && cause.status === 422)) {
        return paypalFailed("settlePending cancel", cause, memberCopy.errors.paypalDown);
      }
    }
  }

  const removed = await db.from("subscriptions").delete().eq("id", live.id).eq("status", "pending");
  if (removed.error) return failed("settlePending replace", removed.error);
  return null;
}

/**
 * Stops payment; they stay a member. A paying member's subscription is paused until their next billing
 * date, so resubscribing before then needs no PayPal page. One with a failed payment has no paid time
 * left, so it ends right away. Shared by the member's and an admin's Cancel.
 */
async function stopPayments(
  db: Db,
  live: { id: string; status: string; paypal_subscription_id: string; next_billing_at: string | null },
  who: "member" | "admin",
  cancelledBy?: string,
): Promise<ActionState | null> {
  const reason = who === "member" ? "Cancelled by the member" : "Cancelled by an SDC admin";
  if (live.status !== "active") return endForGood(db, live, reason, cancelledBy);

  // Remember the billing date ourselves: PayPal may stop reporting it once the subscription is paused.
  let cancelAt = live.next_billing_at;
  try {
    cancelAt = (await getSubscription(live.paypal_subscription_id)).billing_info?.next_billing_time ?? cancelAt;
  } catch (cause) {
    return paypalFailed("stopPayments lookup", cause, memberCopy.errors.paypalDown);
  }
  if (!cancelAt) return endForGood(db, live, reason, cancelledBy);

  // Our row first, so PayPal's SUSPENDED webhook for this pause isn't taken for a payment problem.
  const marked = await db
    .from("subscriptions")
    .update({ status: "cancelling", cancel_at: cancelAt, cancelled_at: now(), cancelled_by: cancelledBy ?? null, updated_at: now() })
    .eq("id", live.id);
  if (marked.error) return failed("stopPayments mark", marked.error);

  try {
    await suspendSubscription(live.paypal_subscription_id, reason);
  } catch (cause) {
    await db
      .from("subscriptions")
      .update({ status: live.status, cancel_at: null, cancelled_at: null, cancelled_by: null, updated_at: now() })
      .eq("id", live.id);
    return paypalFailed("stopPayments suspend", cause, memberCopy.errors.paypalDown);
  }
  return null;
}

/** The member cancels: PayPal stops charging and they stay a member who isn't paying. */
export async function cancelMyMembership(): Promise<ActionState> {
  const member = await requireMember();
  const db = secretClient();
  const { data: live, error } = await db
    .from("subscriptions")
    .select("id, status, paypal_subscription_id, next_billing_at")
    .eq("person_id", member.id)
    .in("status", PAYING)
    .maybeSingle();
  if (error) return failed("cancelMyMembership lookup", error);
  if (!live) return { status: "error", message: memberCopy.errors.nothingToCancel };

  const stopped = await stopPayments(db, live, "member");
  if (stopped) return stopped;

  revalidatePath("/");
  revalidatePath("/admin/payments");
  return { status: "success" };
}

/** Resumes a suspended subscription, after the member has fixed their payment method in PayPal. */
export async function resumeMyMembership(): Promise<ActionState> {
  const member = await requireMember();
  const db = secretClient();
  const { data: live, error } = await db
    .from("subscriptions")
    .select("id, paypal_subscription_id")
    .eq("person_id", member.id)
    .eq("status", "suspended")
    .maybeSingle();
  if (error) return failed("resumeMyMembership lookup", error);
  if (!live) return { status: "error", message: memberCopy.errors.nothingToResume };

  try {
    await activateSubscription(live.paypal_subscription_id, "Resumed by the member");
  } catch (cause) {
    return paypalFailed("resumeMyMembership", cause, memberCopy.errors.resumeFailed);
  }
  const updated = await db
    .from("subscriptions")
    .update({ status: "active", failed_attempts: 0, last_failed_at: null, updated_at: now() })
    .eq("id", live.id);
  if (updated.error) return failed("resumeMyMembership save", updated.error);

  revalidatePath("/");
  revalidatePath("/admin/payments");
  return { status: "success" };
}

// ---------- admin ----------

/** An admin cancels a member's subscription. Same result as the member cancelling. */
export async function cancelMemberSubscription(personId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  const db = secretClient();
  const { data: live, error } = await db
    .from("subscriptions")
    .select("id, status, paypal_subscription_id, next_billing_at")
    .eq("person_id", personId)
    .in("status", PAYING)
    .maybeSingle();
  if (error) return failed("cancelMemberSubscription lookup", error);
  if (!live) return { status: "error", message: adminCopy.errors.generic };

  const stopped = await stopPayments(db, live, "admin", admin.id);
  if (stopped) return stopped.message === memberCopy.errors.paypalDown ? { status: "error", message: adminCopy.errors.paypalDown } : stopped;

  revalidatePath("/admin/payments");
  revalidatePath("/admin/members");
  return { status: "success" };
}

/** Links an unmatched payment to a member. Form field: `personId`. */
export async function assignPayment(paymentId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const personId = String(formData.get("personId") ?? "");
  if (!personId) return { status: "error", fieldErrors: { personId: adminCopy.errors.chooseMember } };

  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_payment", { p_payment_id: paymentId, p_person_id: personId });
  if (error) return failed("assign_payment", error);
  revalidatePath("/admin/payments");
  return { status: "success", message: adminCopy.assignDone };
}

// ---------- shared ----------

function failed(what: string, error: { message: string }): ActionState {
  console.error(`[payments] ${what} failed:`, error.message);
  return { status: "error", message: memberCopy.errors.generic };
}

function paypalFailed(what: string, cause: unknown, message: string): ActionState {
  console.error(`[payments] ${what}: PayPal call failed:`, cause instanceof PayPalError ? `${cause.status} ${cause.body}` : cause);
  return { status: "error", message };
}
