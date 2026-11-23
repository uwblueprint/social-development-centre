"use server";

import { redirect } from "next/navigation";
import { portals } from "@/features/auth/portals";
import { createClient } from "@/lib/supabase/server";
import { decodeCursor, encodeCursor, parseNotification, type NotificationRow } from "./parse";
import type { NotificationsPage } from "./types";

/*
 * The notifications panel's reads and writes: one database call each. The admin check is the database's
 * (every function raises 42501 unless is_admin(), which also ends admin sessions after 7 days), so it
 * isn't repeated here; a refusal sends the person to sign in, as requireAdmin() would. Other failures
 * throw a plain Error, which the panel shows as "couldn't load" or by putting a checked-off row back.
 */

const PAGE_SIZE = 15;
const NOT_ADMIN = "42501";

function check<T>(what: string, result: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (result.error?.code === NOT_ADMIN) redirect(portals.admin.signInPath);
  if (result.error) {
    console.error(`[notifications] ${what} failed:`, result.error.message);
    throw new Error(`Couldn't ${what}`);
  }
  return result.data as T;
}

/** The red count on the bell: not done, newer than this admin's last look. */
export async function loadNewCount(): Promise<number> {
  const supabase = await createClient();
  return check("load the notification count", await supabase.rpc("admin_notifications_new_count")) ?? 0;
}

/** Opening the panel: the first page, now seen for this admin (open_admin_notifications). */
export async function openPanel(): Promise<NotificationsPage> {
  const supabase = await createClient();
  return toPage(check("load notifications", await supabase.rpc("open_admin_notifications", { p_limit: PAGE_SIZE + 1 })));
}

/** The pages after the first. */
export async function loadPage(cursor: string): Promise<NotificationsPage> {
  const before = decodeCursor(cursor);
  if (!before) throw new Error("Couldn't load notifications");
  const supabase = await createClient();
  const rows = check(
    "load notifications",
    await supabase.rpc("admin_notifications_page", { p_before_at: before.at, p_before_id: before.id, p_limit: PAGE_SIZE + 1 }),
  );
  return toPage(rows);
}

/** Done for every admin, or Undo. */
export async function setDone(id: string, done: boolean): Promise<void> {
  const supabase = await createClient();
  check(done ? "mark the notification done" : "undo", await supabase.rpc("set_admin_notification_done", { p_id: id, p_done: done }));
}

/** One more row than a page is fetched, to know whether there's another page. */
function toPage(data: (NotificationRow & { seen_at: string | null })[] | null): NotificationsPage {
  const rows = data ?? [];
  const page = rows.slice(0, PAGE_SIZE);
  const last = page.at(-1);
  return {
    notifications: page.flatMap((row) => parseNotification(row) ?? []),
    // Same format as each notification's occurredAt (parse.ts), so the panel can compare them as text.
    seenAt: rows[0]?.seen_at ? new Date(rows[0].seen_at).toISOString() : null,
    // From the last row fetched (even one skipped as malformed, so paging never stalls on it), with the
    // database's own timestamp: Postgres keeps microseconds and a JS Date only milliseconds, so a rounded
    // cursor could skip rows inside the same millisecond.
    nextCursor: rows.length > PAGE_SIZE && last ? encodeCursor({ occurredAt: last.occurred_at, id: last.id }) : null,
  };
}
