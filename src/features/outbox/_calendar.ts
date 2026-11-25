import { isLive, LAST_DAY, todayDate, type Send, type Template, type TemplateKey } from "./_data";
import type { PanelMode } from "./_types";

/** Whole days from today; negative is the past. */
export const dayIndex = (d: Date, today: Date = todayDate()) => Math.round((d.getTime() - today.getTime()) / 86_400_000);

type EntryKind = "scheduled" | "review" | "notsent";

/** One automatic email on one day: how many of its emails are in this state. */
export interface DayEntry {
  template: TemplateKey;
  kind: EntryKind;
  count: number;
  /** The list tab that shows these emails. */
  tab: PanelMode;
}

export const entryText = (e: DayEntry) =>
  e.kind === "review" ? `${e.count} to review` : e.kind === "notsent" ? `${e.count} not sent` : `${e.count}`;

export function entryTone(e: DayEntry) {
  if (e.kind === "review") return "review";
  if (e.kind === "notsent") return "danger";
  return e.count >= 10 ? "strong" : undefined;
}

/** Every send grouped by its day, so each calendar cell reads its own list. */
export function groupSendsByDay(sends: Send[]) {
  const byDay = new Map<number, Send[]>();
  for (const s of sends) {
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  return byDay;
}

/**
 * A day's emails: one entry per automatic email and state, not-sent first, then to review, then
 * scheduled. After today's send, what was due has either gone out (counted as sent) or not.
 */
export function dayEntries(
  daySends: Send[],
  day: number,
  afterSend: boolean,
  templates: Record<TemplateKey, Template>,
): { entries: DayEntry[]; sent: number } {
  const sentToday = day === 0 && afterSend;
  let sent = day <= 0 ? daySends.filter((s) => s.status === "sent").length : 0;
  const map = new Map<string, DayEntry>();
  for (const s of daySends) {
    if (s.status === "sent" || s.status === "removed") continue;
    let kind: EntryKind;
    if (s.status === "review" || s.status === "couldnt") kind = day < 0 || sentToday ? "notsent" : "review";
    else if (sentToday) {
      sent += 1;
      continue;
    } else kind = "scheduled";
    const key = `${kind}:${s.template}`;
    const e = map.get(key) ?? { template: s.template, kind, count: 0, tab: kind === "scheduled" ? "all" : "review" };
    e.count += 1;
    if (s.status === "couldnt") e.tab = "failed";
    map.set(key, e);
  }
  const order: EntryKind[] = ["notsent", "review", "scheduled"];
  const entries = [...map.values()].sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || templates[a.template].name.localeCompare(templates[b.template].name),
  );
  return { entries, sent };
}

/**
 * The weeks of the next-days grid, starting on Sunday: from the week that holds today through the week
 * that holds the last day. The cells before today and after the last day are filler.
 */
export function rangeWeeks(today: Date = todayDate()): Date[][] {
  const start = new Date(today);
  start.setDate(start.getDate() - today.getDay());
  const count = Math.ceil((today.getDay() + LAST_DAY + 1) / 7);
  return Array.from({ length: count }, (_, w) =>
    Array.from({ length: 7 }, (_, c) => {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7 + c);
      return d;
    }),
  );
}

/**
 * Everything from past days that still needs attention (an unsent review or a failed send), as one
 * entry per automatic email. `day` is the earliest such day, for the list to scroll to.
 */
export function earlierEntries(sends: Send[], templates: Record<TemplateKey, Template>): { entries: DayEntry[]; day: number } {
  const past = sends.filter((s) => s.day < 0 && isLive(s) && (s.status === "review" || s.status === "couldnt"));
  if (past.length === 0) return { entries: [], day: -1 };
  return { entries: dayEntries(past, -1, false, templates).entries, day: Math.min(...past.map((s) => s.day)) };
}
