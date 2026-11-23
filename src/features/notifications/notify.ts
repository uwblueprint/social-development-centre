import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import { createSecretClient } from "@/lib/supabase/secret";
import type { NotificationData, NotificationType } from "./types";

/**
 * Writes an admin notification from server code that runs without an admin signed in: the PayPal webhook,
 * the cancel and pause flow. Database events (joins, unsubscribes) and the Outbox write their own.
 *
 * `groupKey` names the situation, so a webhook PayPal sends twice still makes one notification: use the
 * provider's event or payment id, e.g. `paymentDeclined:${event.id}`. Timed now, when it's written, never
 * at the provider's event time: an older time would fall behind admins' "seen" and never show as new.
 * Never throws: a notification must not break the work that triggered it. Returns whether it was written.
 *
 *   await notifyAdmins("paymentDeclined", `paymentDeclined:${event.id}`, { person: { id, name } });
 */
export async function notifyAdmins<K extends NotificationType>(
  type: K,
  groupKey: string,
  data: NotificationData[K],
): Promise<boolean> {
  const supabase = createSecretClient();
  if (!supabase) {
    console.error("[notifications] SUPABASE_SECRET_KEY is not set; not written:", groupKey);
    return false;
  }
  const { error } = await supabase.rpc("notify_admins", {
    p_type: type,
    p_group_key: groupKey,
    p_data: data as unknown as Json,
  });
  if (error) {
    console.error("[notifications] notify_admins failed:", groupKey, error.message);
    return false;
  }
  return true;
}
