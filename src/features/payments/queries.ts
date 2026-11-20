import "server-only";
import { dayKey } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "./config";
import { memberCopy } from "./copy";
import { getPlan, isPayPalConfigured, type PayPalPlan } from "./paypal";
import {
  formatMoney,
  type MemberPaymentRow,
  type MyMembership,
  type PaymentStatus,
  type PlanOption,
  type UnmatchedPayment,
} from "./types";

const LIVE = ["pending", "active", "payment_problem", "suspended"];

/**
 * The plans the members' area offers, with the name and price set on each Plan in PayPal (so the page
 * always matches what PayPal charges). A plan with no id, or one PayPal can't return, shows as unavailable.
 */
export async function planOptions(): Promise<PlanOption[]> {
  return Promise.all(
    PLANS.map(async (plan): Promise<PlanOption> => {
      const unavailable = { key: plan.key, name: memberCopy.defaultPlanName, priceLabel: "", available: false };
      if (!plan.paypalPlanId || !isPayPalConfigured()) return unavailable;
      try {
        const paypalPlan = await getPlan(plan.paypalPlanId);
        if (paypalPlan.status !== "ACTIVE") return { ...unavailable, name: paypalPlan.name };
        return { key: plan.key, name: paypalPlan.name, priceLabel: priceLabel(paypalPlan), available: true };
      } catch (cause) {
        console.error(`[payments] couldn't load PayPal plan ${plan.paypalPlanId}:`, cause);
        return unavailable;
      }
    }),
  );
}

/** "$25.00 a year", "$10.00 a month", "$40.00 every 2 years", from the Plan's regular billing cycle. */
function priceLabel(plan: PayPalPlan): string {
  const cycle = plan.billing_cycles.find((c) => c.tenure_type === "REGULAR") ?? plan.billing_cycles.at(-1);
  const price = cycle?.pricing_scheme?.fixed_price;
  if (!cycle || !price) return "";
  const amount = formatMoney(Math.round(Number(price.value) * 100), price.currency_code);
  const unit = memberCopy.perInterval[cycle.frequency.interval_unit] ?? cycle.frequency.interval_unit.toLowerCase();
  const count = cycle.frequency.interval_count;
  return count === 1 ? `${amount} a ${unit}` : `${amount} every ${count} ${unit}s`;
}

/** The signed-in member's own subscription (row-level security lets them read only theirs). */
export async function getMyMembership(personId: string): Promise<MyMembership> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, next_billing_at, last_failed_at")
    .eq("person_id", personId)
    .in("status", LIVE)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { status: "none", nextBillingAt: null, lastFailedAt: null };
  return {
    status: data.status as PaymentStatus,
    nextBillingAt: data.next_billing_at,
    lastFailedAt: data.last_failed_at,
  };
}

/** Every current member with their payment status, A–Z. Admins only (row-level security). */
export async function listMemberPayments(): Promise<MemberPaymentRow[]> {
  const supabase = await createClient();
  const [members, subscriptions, payments] = await Promise.all([
    supabase.from("memberships").select("person:people!person_id(id, email, full_name)"),
    supabase
      .from("subscriptions")
      .select("person_id, status, failed_attempts, next_billing_at")
      .in("status", LIVE),
    supabase
      .from("payments")
      .select("person_id, kind, amount_cents, currency, paid_at")
      .not("person_id", "is", null)
      .order("paid_at", { ascending: false }),
  ]);
  if (members.error) throw members.error;
  if (subscriptions.error) throw subscriptions.error;
  if (payments.error) throw payments.error;

  const subscriptionOf = new Map(subscriptions.data.map((s) => [s.person_id, s]));
  const thisYear = dayKey(new Date().toISOString()).slice(0, 4);
  const paymentsOf = new Map<string, typeof payments.data>();
  for (const payment of payments.data) {
    const list = paymentsOf.get(payment.person_id!) ?? [];
    list.push(payment);
    paymentsOf.set(payment.person_id!, list);
  }

  return members.data
    .map(({ person }) => {
      const subscription = subscriptionOf.get(person.id);
      const history = paymentsOf.get(person.id) ?? [];
      const last = history.find((p) => p.kind === "payment");
      return {
        personId: person.id,
        name: person.full_name,
        email: person.email,
        status: (subscription?.status ?? "none") as PaymentStatus,
        failedAttempts: subscription?.failed_attempts ?? 0,
        nextBillingAt: subscription?.next_billing_at ?? null,
        lastPaidAt: last?.paid_at ?? null,
        lastAmountCents: last?.amount_cents ?? null,
        currency: last?.currency ?? null,
        paidThisYearCents: history
          .filter((p) => dayKey(p.paid_at).slice(0, 4) === thisYear)
          .reduce((sum, p) => sum + p.amount_cents, 0),
      };
    })
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, "en", { sensitivity: "base" }));
}

/** Payments no member is linked to, newest first. Admins only. */
export async function listUnmatchedPayments(): Promise<UnmatchedPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, kind, paid_at, amount_cents, currency, payer_email, paypal_transaction_id")
    .is("person_id", null)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    kind: p.kind as UnmatchedPayment["kind"],
    paidAt: p.paid_at,
    amountCents: p.amount_cents,
    currency: p.currency,
    payerEmail: p.payer_email,
    paypalTransactionId: p.paypal_transaction_id,
  }));
}
