import type { NextRequest } from "next/server";
import { renderDelivery, type Delivery } from "@/features/automatic-emails/render";
import { createSender } from "@/features/automatic-emails/sender";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel's Hobby limit. Sends left when time runs out stay ready and go in the next run.
export const maxDuration = 60;
const TIME_BUDGET_MS = 50_000;

/**
 * The daily automatic emails run, at 10:30 am in Waterloo Region (PM, 3 Nov 2026). Vercel cron
 * calls it at 14:30 and 15:30 UTC, because 10:30 Toronto is one or the other depending on daylight
 * saving time; the call outside the 10 o'clock hour does nothing. `?force=1` runs it any time.
 * Running twice sends nothing twice: the database only hands out each send once.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (request.nextUrl.searchParams.get("force") !== "1" && torontoHour() !== 10) {
    return Response.json({ skipped: "Not 10 am in Toronto" });
  }

  const supabase = createAdminClient();
  const prepared = await supabase.rpc("prepare_due_sends");
  if (prepared.error) {
    console.error("[automatic-emails] prepare_due_sends failed:", prepared.error.message);
    return Response.json({ error: "Couldn't prepare sends" }, { status: 500 });
  }

  const deliveries = await supabase.rpc("email_deliveries");
  if (deliveries.error) {
    console.error("[automatic-emails] email_deliveries failed:", deliveries.error.message);
    return Response.json({ error: "Couldn't load sends" }, { status: 500 });
  }

  const sender = createSender();
  const started = Date.now();
  let sent = 0;
  let failed = 0;
  // One at a time: Gmail throttles bursts, and SDC sends a few hundred a day at most.
  for (const delivery of deliveries.data as Delivery[]) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    const result = await sender.send(renderDelivery(delivery, request.nextUrl.origin));
    const recorded = await supabase.rpc("record_send_result", {
      p_send_id: delivery.send_id,
      p_provider_message_id: result.ok ? result.messageId : null,
      p_error: result.ok ? null : result.error,
    });
    if (recorded.error) {
      console.error("[automatic-emails] record_send_result failed:", delivery.send_id, recorded.error.message);
    }
    if (result.ok) sent++;
    else failed++;
  }

  return Response.json({ ready: prepared.data, sent, failed, left: deliveries.data.length - sent - failed });
}

function torontoHour() {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", hourCycle: "h23" }).format(
      new Date(),
    ),
  );
}
