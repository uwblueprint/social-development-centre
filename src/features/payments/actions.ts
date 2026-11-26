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
  isPayPalConfigured,
  PayPalError,
} from "./paypal";

/**
 * Starting, cancelling and resuming a membership subscription. Every action checks who is signed in
 * first, then writes with the secret key (members can't write payment tables themselves). PayPal's
 * webhooks keep the same rows up to date afterwards, so writing here too only makes the screens
 * update sooner.
 */

const LIVE = ["pending", "active", "payment_problem", "suspended"];

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

// ---------- member ----------

/** Creates the subscription in PayPal and sends the member to PayPal to approve it. Form field: `plan`. */
export async function startSubscription(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  if (!isPayPalConfigured()) return { status: "error", message: memberCopy.errors.notConfigured };
  const plan = findPlan(String(formData.get("plan") ?? ""));
  if (!plan?.paypalPlanId) return { status: "error", message: memberCopy.errors.unknownPlan };

  const db = secretClient();
  const { data: live, error } = await db
    .from("subscriptions")
    .select("id, status")
    .eq("person_id", member.id)
    .in("status", LIVE)
    .maybeSingle();
  if (error) return failed("startSubscription lookup", error);
  if (live && live.status !== "pending") return { status: "error", message: memberCopy.errors.alreadyPaying };
  // A pending one was never approved (they left PayPal's page). Replace it.
  if (live) {
    const removed = await db.from("subscriptions").delete().eq("id", live.id);
    if (removed.error) return failed("startSubscription replace", removed.error);
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
    if (saved.error) return failed("startSubscription save", saved.error);
    approveUrl = created.approveUrl;
  } catch (cause) {
    return paypalFailed("startSubscription", cause, memberCopy.errors.paypalDown);
  }
  redirect(approveUrl);
}

/** The member cancels: PayPal stops charging and the membership ends (decision, 19 Nov 2026). */
export async function cancelMyMembership(): Promise<ActionState> {
  const member = await requireMember();
  const db = secretClient();
  const { data: live, error } = await db
    .from("subscriptions")
    .select("id, status, paypal_subscription_id")
    .eq("person_id", member.id)
    .in("status", LIVE)
    .maybeSingle();
  if (error) return failed("cancelMyMembership lookup", error);
  if (!live) return { status: "error", message: memberCopy.errors.nothingToCancel };

  try {
    // A pending one was never approved, so there's nothing to cancel in PayPal.
    if (live.status !== "pending") await cancelSubscription(live.paypal_subscription_id, "Cancelled by the member");
  } catch (cause) {
    return paypalFailed("cancelMyMembership", cause, memberCopy.errors.paypalDown);
  }
  const ended = await db.rpc("end_paid_membership", { p_subscription_id: live.id });
  if (ended.error) return failed("cancelMyMembership end", ended.error);

  revalidatePath("/admin/payments");
  redirect("/membership/cancelled");
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
    .update({ status: "active", failed_attempts: 0, last_failed_at: null, updated_at: new Date().toISOString() })
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
    .select("id, status, paypal_subscription_id")
    .eq("person_id", personId)
    .in("status", LIVE)
    .maybeSingle();
  if (error) return failed("cancelMemberSubscription lookup", error);
  if (!live) return { status: "error", message: adminCopy.errors.generic };

  try {
    if (live.status !== "pending") await cancelSubscription(live.paypal_subscription_id, "Cancelled by an SDC admin");
  } catch (cause) {
    return paypalFailed("cancelMemberSubscription", cause, adminCopy.errors.paypalDown);
  }
  const ended = await db.rpc("end_paid_membership", { p_subscription_id: live.id, p_cancelled_by: admin.id });
  if (ended.error) return failed("cancelMemberSubscription end", ended.error);

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
