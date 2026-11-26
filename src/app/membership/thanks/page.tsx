import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { styled } from "next-yak";
import { AuthColumn, AuthHeading, AuthScreen, SdcLogo } from "@/features/auth/AuthScreen";
import { requireMember } from "@/features/auth/session";
import { AutoRefresh } from "@/features/payments/AutoRefresh";
import { memberCopy } from "@/features/payments/copy";
import { getSubscription, isPayPalConfigured } from "@/features/payments/paypal";
import { createSecretClient } from "@/lib/supabase/secret";

export const metadata: Metadata = { title: "Thank you" };

/**
 * Where PayPal sends a member after they approve their subscription (the return_url). PayPal adds
 * `?subscription_id=…`. We ask PayPal directly, so the member sees "active" right away even before the
 * webhook arrives (and when testing locally without one). The webhook still records the payment.
 */
export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ subscription_id?: string }> }) {
  const member = await requireMember();
  const { subscription_id: returnedId } = await searchParams;
  const db = createSecretClient();
  if (!db) redirect("/");

  const { data: subscription } = await db
    .from("subscriptions")
    .select("id, status, paypal_subscription_id")
    .eq("person_id", member.id)
    .in("status", ["pending", "active", "payment_problem", "suspended"])
    .maybeSingle();
  if (!subscription) redirect("/");

  let status = subscription.status;
  const isTheOneTheyApproved = !returnedId || returnedId === subscription.paypal_subscription_id;
  if (status === "pending" && isTheOneTheyApproved && isPayPalConfigured()) {
    try {
      const paypal = await getSubscription(subscription.paypal_subscription_id);
      if (paypal.status === "ACTIVE") {
        await db
          .from("subscriptions")
          .update({
            status: "active",
            next_billing_at: paypal.billing_info?.next_billing_time ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)
          .eq("status", "pending");
        status = "active";
      }
    } catch (cause) {
      // Not a problem for the member: the webhook will confirm it.
      console.error("[payments] thanks page couldn't check PayPal:", cause);
    }
  }

  const confirmed = status !== "pending";
  return (
    <AuthScreen>
      <AuthColumn>
        <SdcLogo />
        <AuthHeading title={memberCopy.thanksTitle} description={confirmed ? memberCopy.thanksDone : undefined} />
        {!confirmed && <AutoRefresh />}
        <BackLink href="/">{memberCopy.backToMembersArea}</BackLink>
      </AuthColumn>
    </AuthScreen>
  );
}

const BackLink = styled(Link)`
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:hover {
    text-decoration-thickness: 2px;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;
