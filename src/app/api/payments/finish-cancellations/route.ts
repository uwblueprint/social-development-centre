import { cancelSubscription, isPayPalConfigured, PayPalError } from "@/features/payments/paypal";
import { createSecretClient } from "@/lib/supabase/secret";

export const maxDuration = 60;

/**
 * Daily (vercel.json). Ends, for good, every cancelled subscription whose billing date has passed
 * without the member resubscribing. Until then it's only paused in PayPal, which charges nothing; this
 * makes sure nobody can reactivate it later (e.g. from PayPal's dashboard) and charge the skipped time.
 * The member stays a member who isn't paying. Running it twice does nothing twice.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = createSecretClient();
  if (!db || !isPayPalConfigured()) {
    console.error("[payments] finish-cancellations: SUPABASE_SECRET_KEY or PayPal isn't configured");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  const { data: due, error } = await db
    .from("subscriptions")
    .select("id, paypal_subscription_id")
    .eq("status", "cancelling")
    .lte("cancel_at", new Date().toISOString());
  if (error) {
    console.error("[payments] finish-cancellations lookup failed:", error.message);
    return Response.json({ error: "Couldn't read subscriptions" }, { status: 500 });
  }

  let ended = 0;
  const failed: string[] = [];
  for (const subscription of due) {
    try {
      await cancelSubscription(subscription.paypal_subscription_id, "Cancelled: not resubscribed by the billing date");
    } catch (cause) {
      // 422: already cancelled in PayPal. 404: PayPal never kept it. Anything else: try again tomorrow.
      if (!(cause instanceof PayPalError && (cause.status === 422 || cause.status === 404))) {
        console.error(`[payments] couldn't cancel ${subscription.paypal_subscription_id}:`, cause);
        failed.push(subscription.paypal_subscription_id);
        continue;
      }
    }
    // No race with resubscribing: after cancel_at, Pay starts a new subscription instead of reactivating.
    const { error: endError } = await db.rpc("end_paid_membership", { p_subscription_id: subscription.id });
    if (endError) {
      console.error(`[payments] couldn't end ${subscription.id}:`, endError.message);
      failed.push(subscription.paypal_subscription_id);
      continue;
    }
    ended++;
  }

  return Response.json({ ended, failed });
}
