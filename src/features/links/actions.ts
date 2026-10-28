"use server";

import { normalizeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { isUnsubscribeReason } from "./reasons";
import { parseLinkToken } from "./urls";

/*
 * The actions behind the email link pages. Nobody is signed in: the link's token is the proof, and the
 * database functions accept it from anyone (see supabase/migrations/20261023000300_email_links.sql).
 * Results are plain words the page switches on; a token that isn't real comes back as "unknown-link".
 */

export type SubscriptionResult = "done" | "already" | "unknown-link" | "failed";

/** "done": unsubscribed now. "already": they were unsubscribed before. */
export async function unsubscribe(token: string): Promise<SubscriptionResult> {
  return changeSubscription(token, "unsubscribe_by_link");
}

/** Only the member can undo an unsubscribe, from the same page. */
export async function resubscribe(token: string): Promise<SubscriptionResult> {
  return changeSubscription(token, "resubscribe_by_link");
}

async function changeSubscription(
  token: string,
  fn: "unsubscribe_by_link" | "resubscribe_by_link",
): Promise<SubscriptionResult> {
  const link = parseLinkToken(token);
  if (!link) return "unknown-link";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, { p_token: link });
  if (error) {
    console.error(`${fn} failed:`, error.message);
    return "failed";
  }
  if (data === null) return "unknown-link";
  return data === "already" ? "already" : "done";
}

export type ReasonResult = "saved" | "invalid-reason" | "failed";

/** The optional "why" after unsubscribing. */
export async function giveUnsubscribeReason(token: string, reason: unknown): Promise<ReasonResult> {
  const link = parseLinkToken(token);
  if (!isUnsubscribeReason(reason)) return "invalid-reason";
  if (!link) return "failed";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("give_unsubscribe_reason", { p_token: link, p_reason: reason });
  if (error) console.error("give_unsubscribe_reason failed:", error.message);
  return data ? "saved" : "failed";
}

export type ReferralResult = "recorded" | "invalid-email" | "unknown-link" | "failed";

/**
 * A friend leaves their details on a member's referral link. Someone already referred by this member
 * gets the same "recorded" answer, so the page never says who has been referred.
 */
export async function referFriend(token: string, name: string, email: string): Promise<ReferralResult> {
  const link = parseLinkToken(token);
  if (!link) return "unknown-link";
  const address = normalizeEmail(email);
  if (!address) return "invalid-email";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("refer_by_link", {
    p_token: link,
    p_email: address,
    p_full_name: name.trim().slice(0, 120),
  });
  if (error) {
    console.error("refer_by_link failed:", error.message);
    return "failed";
  }
  return data === null ? "unknown-link" : "recorded";
}
