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

/** Events end at their start time; deadlines end when the day is over. */
export function hasEnded(o: Opportunity, now = new Date()): boolean {
  const date = keyDate(o);
  if (!date) return false;
  if (o.kind === "event") {
    const [h, min] = (o.details.startTime ?? "00:00").split(":").map(Number);
    const start = parseDate(date);
    start.setHours(h, min);
    return start <= now;
  }
  const endOfDay = parseDate(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay < now;
}

/** Stored status plus automatic expiry. Drafts never expire. */
export function effectiveStatus(o: Opportunity, now = new Date()): { status: OpportunityStatus; closedReason?: ClosedReason } {
  if (o.status === "live" && hasEnded(o, now)) return { status: "closed", closedReason: "ended" };
  return { status: o.status, closedReason: o.closedReason };
}

const dateFmt = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric" });
const dateYearFmt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" });

export function formatDate(ymd: string): string {
  const d = parseDate(ymd);
  return d.getFullYear() === new Date().getFullYear() ? dateFmt.format(d) : dateYearFmt.format(d);
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
      return o.details.applyBy ? `Apply by ${formatDate(o.details.applyBy)}` : o.details.commitment === "one_time" ? "One-time" : "Ongoing";
    case "job":
      return o.details.applyBy ? `Apply by ${formatDate(o.details.applyBy)}` : "Open until filled";
    case "other":
      return o.details.deadline ? `Closes ${formatDate(o.details.deadline)}` : "No deadline";
  }
}
