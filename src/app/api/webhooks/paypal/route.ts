import { isPayPalConfigured, verifyWebhook } from "@/features/payments/paypal";
import { handleEvent, type PayPalEvent } from "@/features/payments/webhook";
import { createSecretClient } from "@/lib/supabase/secret";

/**
 * PayPal calls this, server to server, whenever something happens to a subscription or payment in
 * SDC's PayPal account. Registered in PayPal's developer dashboard (docs/backend/payments.md).
 * Exempt from sign-in in signInPathFor (src/features/auth/portals.ts).
 *
 * Answers 200 once an event is handled or was handled before, and 4xx/5xx otherwise, so PayPal
 * sends it again later (it keeps retrying for a few days).
 */
export async function POST(request: Request) {
  if (!isPayPalConfigured()) {
    console.error("[paypal] webhook received but PayPal isn't configured");
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  let event: PayPalEvent;
  try {
    event = (await request.json()) as PayPalEvent;
  } catch {
    return Response.json({ error: "Not JSON" }, { status: 400 });
  }
  if (!event?.id || !event.event_type || typeof event.resource !== "object") {
    return Response.json({ error: "Not a PayPal event" }, { status: 400 });
  }

  // Anyone can POST here: nothing is trusted until PayPal confirms it sent this.
  let verified = false;
  try {
    verified = await verifyWebhook(request.headers, event);
  } catch (cause) {
    console.error("[paypal] couldn't verify a webhook:", cause);
    return Response.json({ error: "Couldn't verify" }, { status: 502 });
  }
  if (!verified) return Response.json({ error: "Invalid signature" }, { status: 401 });

  const db = createSecretClient();
  if (!db) {
    console.error("[paypal] SUPABASE_SECRET_KEY is not set");
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  // Log it first. A repeat of an event we already processed is acknowledged and skipped.
  const logged = await db.from("paypal_events").upsert(
    {
      id: event.id,
      event_type: event.event_type,
      resource_id: typeof event.resource.id === "string" ? event.resource.id : null,
      payload: JSON.parse(JSON.stringify(event)),
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (logged.error) {
    console.error("[paypal] couldn't log event:", logged.error.message);
    return Response.json({ error: "Couldn't save" }, { status: 500 });
  }
  const { data: seen, error: seenError } = await db.from("paypal_events").select("processed_at").eq("id", event.id).single();
  if (seenError) return Response.json({ error: "Couldn't save" }, { status: 500 });
  if (seen.processed_at) return Response.json({ ok: true, duplicate: true });

  try {
    await handleEvent(db, event);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.error(`[paypal] ${event.event_type} ${event.id} failed:`, message);
    await db.from("paypal_events").update({ error: message.slice(0, 1000) }).eq("id", event.id);
    return Response.json({ error: "Couldn't process" }, { status: 500 });
  }

  await db.from("paypal_events").update({ processed_at: new Date().toISOString(), error: null }).eq("id", event.id);
  return Response.json({ ok: true });
}
