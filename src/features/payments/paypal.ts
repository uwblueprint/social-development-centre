import "server-only";
import { paypalApiBase, PAYPAL_BRAND_NAME } from "./config";

/**
 * The few PayPal REST calls membership payments need (Subscriptions v1, Webhooks v1). Server only:
 * it uses SDC's PayPal secret. No PayPal script ever runs in the browser.
 *
 * Field names follow PayPal's docs as of Nov 2026; PayPal's developer dashboard shows real payloads.
 */

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** An access token from the app's Client ID and Secret, reused until a minute before it expires. */
async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set");

  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new PayPalError("PayPal sign-in failed", response.status, await response.text());
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in - 60) * 1000 };
  return body.access_token;
}

async function call<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  requestId?: string,
  revalidateSeconds?: number,
): Promise<T> {
  const response = await fetch(`${paypalApiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      // Makes a retried POST safe: PayPal returns the first result instead of acting twice.
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...(revalidateSeconds ? { next: { revalidate: revalidateSeconds } } : { cache: "no-store" as const }),
  });
  const text = await response.text();
  if (!response.ok) throw new PayPalError(`PayPal ${method} ${path} failed`, response.status, text);
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---------- plans ----------

export interface PayPalPlan {
  id: string;
  name: string;
  status: "CREATED" | "ACTIVE" | "INACTIVE";
  billing_cycles: {
    tenure_type: "TRIAL" | "REGULAR";
    frequency: { interval_unit: "DAY" | "WEEK" | "MONTH" | "YEAR"; interval_count: number };
    pricing_scheme?: { fixed_price?: { value: string; currency_code: string } };
  }[];
}

/** A Plan's name and price, as set in PayPal. Cached for an hour: Plans rarely change. */
export function getPlan(id: string): Promise<PayPalPlan> {
  return call("GET", `/v1/billing/plans/${encodeURIComponent(id)}`, undefined, undefined, 3600);
}

// ---------- subscriptions ----------

export type PayPalSubscriptionStatus =
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

export interface PayPalSubscription {
  id: string;
  status: PayPalSubscriptionStatus;
  plan_id: string;
  custom_id?: string;
  billing_info?: {
    next_billing_time?: string;
    failed_payments_count?: number;
  };
  links?: { href: string; rel: string; method?: string }[];
}

/**
 * Starts a subscription for one member and returns PayPal's page where they approve it. `custom_id`
 * is the member's person id, set here on the server, so a payment can never be claimed by someone else.
 */
export async function createSubscription(input: {
  planId: string;
  personId: string;
  email: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const subscription = await call<PayPalSubscription>(
    "POST",
    "/v1/billing/subscriptions",
    {
      plan_id: input.planId,
      custom_id: input.personId,
      subscriber: { email_address: input.email },
      application_context: {
        brand_name: PAYPAL_BRAND_NAME,
        locale: "en-CA",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    },
    crypto.randomUUID(),
  );
  const approveUrl = subscription.links?.find((link) => link.rel === "approve")?.href;
  if (!approveUrl) throw new Error("PayPal didn't return an approval link");
  return { id: subscription.id, approveUrl };
}

export function getSubscription(id: string): Promise<PayPalSubscription> {
  return call("GET", `/v1/billing/subscriptions/${encodeURIComponent(id)}`);
}

/** `reason` is kept on the subscription in PayPal, up to 128 characters. */
export async function cancelSubscription(id: string, reason: string): Promise<void> {
  await call("POST", `/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, { reason: reason.slice(0, 128) });
}

export async function suspendSubscription(id: string, reason: string): Promise<void> {
  await call("POST", `/v1/billing/subscriptions/${encodeURIComponent(id)}/suspend`, { reason: reason.slice(0, 128) });
}

export async function activateSubscription(id: string, reason: string): Promise<void> {
  await call("POST", `/v1/billing/subscriptions/${encodeURIComponent(id)}/activate`, { reason: reason.slice(0, 128) });
}

// ---------- webhooks ----------

/**
 * Asks PayPal whether it really sent this webhook. Anyone can POST to our URL, so nothing is
 * trusted until this says SUCCESS.
 */
export async function verifyWebhook(headers: Headers, event: unknown): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID must be set");
  const result = await call<{ verification_status: string }>("POST", "/v1/notifications/verify-webhook-signature", {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: event,
  });
  return result.verification_status === "SUCCESS";
}

/** PayPal money amounts are decimal strings ("25.00"). */
export function toCents(value: string | undefined): number | null {
  if (value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}
