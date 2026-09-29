import { AREA_LABEL } from "./catalog";
import type { Opportunity, OpportunityStatus, ClosedReason } from "./types";

/*
 * Pure helpers shared by server and client. Dates are local to Waterloo Region;
 * the dev server and browser are assumed to share a time zone.
 */

const parseDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** The date that decides when a listing ends and how it sorts: event date, or deadline/apply-by. */
export function keyDate(o: Opportunity): string | undefined {
  switch (o.kind) {
    case "event":
      return o.details.date;
    case "petition":
      return o.details.deadline;
    case "volunteer":
      return o.details.applyBy;
    case "job":
      return o.details.applyBy;
    case "other":
      return o.details.deadline;
  }
}

/** When the listing ends on its own: an event at its start time, anything else at the end of its key date. */
export function endsAt(o: Opportunity): Date | undefined {
  const date = keyDate(o);
  if (!date) return undefined;
  if (o.kind === "event") {
    const [h, min] = (o.details.startTime ?? "00:00").split(":").map(Number);
    const start = parseDate(date);
    start.setHours(h, min);
    return start;
  }
  const endOfDay = parseDate(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/** Events end at their start time; deadlines end when the day is over. */
export function hasEnded(o: Opportunity, now = new Date()): boolean {
  const end = endsAt(o);
  if (!end) return false;
  return o.kind === "event" ? end <= now : end < now;
}

export interface EffectiveStatus {
  status: OpportunityStatus;
  closedReason?: ClosedReason;
}

/**
 * Stored status plus the rules applied at read time. Drafts never change. A published listing reads as
 * closed when its organization's access was removed (`partner_removed`, unless its date had already passed
 * by then) or when its date has passed (`ended`). What members who already got it can still see is a
 * separate, member-side rule: docs/backend/opportunities.md#removed-partners.
 */
export function effectiveStatus(o: Opportunity, now = new Date(), partnerRemovedAt?: string): EffectiveStatus {
  if (o.status !== "published") return { status: o.status, closedReason: o.closedReason };
  if (partnerRemovedAt) {
    return { status: "closed", closedReason: hasEnded(o, new Date(partnerRemovedAt)) ? "ended" : "partner_removed" };
  }
  if (hasEnded(o, now)) return { status: "closed", closedReason: "ended" };
  return { status: "published" };
}

const dateFmt = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric" });
const dateYearFmt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" });

export function formatDate(ymd: string): string {
  return formatDay(parseDate(ymd));
}

function formatDay(date: Date): string {
  return date.getFullYear() === new Date().getFullYear() ? dateFmt.format(date) : dateYearFmt.format(date);
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return timeFmt.format(d);
}

/** One line for the table's Date column, e.g. "Thu, Oct 8 · 6:30 p.m.", "Apply by Oct 30", "Ongoing". */
export function formatWhen(o: Opportunity): string {
  switch (o.kind) {
    case "event":
      if (!o.details.date) return "No date yet";
      return o.details.startTime ? `${formatDate(o.details.date)} · ${formatTime(o.details.startTime)}` : formatDate(o.details.date);
    case "petition":
      return o.details.deadline ? `Closes ${formatDate(o.details.deadline)}` : "No deadline";
    case "volunteer":
      return o.details.applyBy ? `Apply by ${formatDate(o.details.applyBy)}` : o.details.timeCommitment === "one_time" ? "One-time" : "Ongoing";
    case "job":
      return o.details.applyBy ? `Apply by ${formatDate(o.details.applyBy)}` : "Open until filled";
    case "other":
      return o.details.deadline ? `Closes ${formatDate(o.details.deadline)}` : "No deadline";
  }
}

/**
 * The one date an admin scans for: when the event happens, or the deadline / apply-by date.
 * Same shape for every type so the column reads as a list of dates; `time` only for events.
 */
export function closesOn(o: Opportunity): { date?: string; time?: string; ymd?: string } {
  const d = o.details;
  const ymd = o.kind === "event" ? (d as { date?: string }).date : o.kind === "volunteer" || o.kind === "job" ? (d as { applyBy?: string }).applyBy : (d as { deadline?: string }).deadline;
  if (!ymd) return {};
  const start = o.kind === "event" ? (d as { startTime?: string }).startTime : undefined;
  return { date: formatDate(ymd), time: start ? formatTime(start) : undefined, ymd };
}

/** Whole days from today to a YYYY-MM-DD date; negative once it's past. */
export function daysUntil(ymd: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDate(ymd).getTime() - today.getTime()) / 86_400_000);
}

/** "Sat, Oct 10 · 7:00 p.m. – 8:30 p.m." for an event (one line, not three fields); the closing date otherwise. */
export function formatWhenLine(o: Opportunity): string | undefined {
  if (o.kind === "event") {
    const d = o.details;
    if (!d.date) return undefined;
    const times = d.startTime ? (d.endTime ? `${formatTime(d.startTime)} – ${formatTime(d.endTime)}` : formatTime(d.startTime)) : "";
    return times ? `${formatDate(d.date)} · ${times}` : formatDate(d.date);
  }
  return formatWhen(o);
}

/** Where it happens, for the panel and the email preview: "Kitchener · Civic Hub, 97 Victoria St N", or undefined. */
export function formatWhere(o: Opportunity): string | undefined {
  if (o.kind !== "event" && o.kind !== "volunteer" && o.kind !== "job") return undefined;
  const { area } = o.details;
  return area ? AREA_LABEL[area] : undefined;
}
