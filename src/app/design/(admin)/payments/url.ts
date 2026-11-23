/**
 * The Payments page's view state as search params, so any view can be bookmarked, shared or reopened.
 *
 *   range    2026-01..2026-03 | 2026-11 (one month) | all        (default: this month, left out)
 *   tab      transactions | tiers                                  (default: overview, left out)
 *   on       2026-11-14 | 2026-03 | 2025   the chart column opened in Transactions
 *   q        search text (Transactions)
 *   tier     friend,supporter (Transactions)
 *   type     membership | gifted | declined | refund | chargeback   what the row is (Transactions)
 *   status   matched | unmatched   whether the row is tied to a person (Transactions). Old links with
 *            status=declined or status=gifted open as the matching type.
 *   page     2 and up (Transactions; 1 is left out)
 *   payment  the payment whose details are open (Transactions)
 *
 * Anything invalid falls back to its default without a message. Defaults never appear in the URL.
 */
import type { Period, PaymentsData } from "./data";
import { periodBuckets, thisMonth } from "./data";

export type Tab = "overview" | "transactions" | "tiers";

export interface PaymentsUrl {
  period: Period;
  tab: Tab;
  /** The chart column's key ("2026-11-14", "2026-03" or "2025"), or null. */
  on: string | null;
  q: string;
  tiers: string[];
  types: string[];
  statuses: string[];
  page: number;
  payment: string | null;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const TYPE_VALUES = ["membership", "gifted", "declined", "refund", "chargeback"];
export const STATUS_VALUES = ["matched", "unmatched"];
/** Status values from before the Type filter existed: they now name a type. */
const OLD_STATUS_TYPES = ["declined", "gifted"];

/** The first and last months anyone can pick: from the first payment to this month. */
export function monthBounds(data: PaymentsData) {
  return { min: (data.payments[0]?.paidAt ?? data.today).slice(0, 7), max: data.today.slice(0, 7) };
}

function parsePeriod(text: string | null, data: PaymentsData): Period {
  const fallback = thisMonth(data.today);
  if (!text) return fallback;
  if (text === "all") return null;
  const { min, max } = monthBounds(data);
  const [from, to = from, extra] = text.split("..");
  if (extra !== undefined || !MONTH.test(from) || !MONTH.test(to) || from > to || from < min || to > max) return fallback;
  return { from, to };
}

export function parseUrl(params: URLSearchParams, data: PaymentsData): PaymentsUrl {
  const period = parsePeriod(params.get("range"), data);
  const tabText = params.get("tab");
  const tab: Tab = tabText === "transactions" || tabText === "tiers" ? tabText : "overview";

  const onText = params.get("on");
  const on =
    onText && periodBuckets(period, data).some((b) => b.key === onText && b.range.from <= data.today) ? onText : null;

  const base: PaymentsUrl = { period, tab, on, q: "", tiers: [], types: [], statuses: [], page: 1, payment: null };
  // Search, filters, page and details belong to Transactions; on another tab they don't apply.
  if (tab !== "transactions") return base;

  const tierIds = new Set(data.tiers.map((t) => t.id));
  const pageNumber = Number(params.get("page"));
  const statusList = (params.get("status") ?? "").split(",");
  const paymentId = params.get("payment");
  return {
    ...base,
    q: (params.get("q") ?? "").trim(),
    tiers: (params.get("tier") ?? "").split(",").filter((id, i, all) => tierIds.has(id) && all.indexOf(id) === i),
    types: [...(params.get("type") ?? "").split(","), ...statusList.filter((s) => OLD_STATUS_TYPES.includes(s))].filter(
      (t, i, all) => TYPE_VALUES.includes(t) && all.indexOf(t) === i,
    ),
    statuses: statusList.filter((s, i, all) => STATUS_VALUES.includes(s) && all.indexOf(s) === i),
    page: Number.isInteger(pageNumber) && pageNumber > 1 ? pageNumber : 1,
    payment: paymentId && data.payments.some((p) => p.id === paymentId) ? paymentId : null,
  };
}

const RANGE_KEYS = ["range", "tab", "on", "q", "tier", "type", "status", "page", "payment"];

/** The search string for a view. Params this page doesn't own (?state, ?grid) are carried over from `current`. */
export function toSearch(state: PaymentsUrl, data: PaymentsData, current: URLSearchParams): string {
  const params = new URLSearchParams(current);
  for (const key of RANGE_KEYS) params.delete(key);
  const fallback = thisMonth(data.today);
  const { period } = state;
  if (period === null) params.set("range", "all");
  else if (period.from !== fallback.from || period.to !== fallback.to) {
    params.set("range", period.from === period.to ? period.from : `${period.from}..${period.to}`);
  }
  if (state.tab !== "overview") params.set("tab", state.tab);
  if (state.on) params.set("on", state.on);
  if (state.tab === "transactions") {
    if (state.q) params.set("q", state.q);
    if (state.tiers.length) params.set("tier", state.tiers.join(","));
    if (state.types.length) params.set("type", state.types.join(","));
    if (state.statuses.length) params.set("status", state.statuses.join(","));
    if (state.page > 1) params.set("page", String(state.page));
    if (state.payment) params.set("payment", state.payment);
  }
  return params.toString();
}
