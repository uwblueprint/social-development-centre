"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keyframes, styled } from "next-yak";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, CircleX, Triangle, Download, Link2, Link2Off, ReceiptText, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { List, ListRow } from "@/components/ui/ListRow";
import { formatMonthRange, MonthRangePicker } from "@/components/ui/MonthRangePicker";
import { ListEmptyState } from "@/components/patterns/ListPage";
import { Pagination } from "@/components/ui/Pagination";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { Table, type TableColumn } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { TruncatedText } from "@/components/ui/TruncatedText";
import {
  comparedTo,
  dayText,
  firstJoinDate,
  firstPaymentDate,
  formatCount,
  formatDate,
  formatMoney,
  giftedRaised,
  feesMissing,
  isMoneyBack,
  kept,
  paymentsIn,
  periodBuckets,
  raisedText,
  received,
  monthlyIncome,
  payingOn,
  payingPeopleOn,
  ranges,
  type Bucket,
  type Payment,
  type PaymentsData,
  type Period,
  type Person,
  unitOf,
  type Unit,
  withAmounts,
} from "./data";
import { CheckFilter, DateFilter, FilterArea, FilterToolbar } from "./filters";
import { DisabledReason } from "@/components/ui/DisabledReason";
import {
  attemptText,
  BlockFailed,
  BusyButton,
  DialogNote,
  lockReason,
  LoadingStatus,
  RegionFailed,
  SkeletonBar as Bar,
  STILL_LOADING,
  StillLoading,
  Unavailable,
  upToText,
  useAttempt,
  useRefreshing,
  useRetry,
  type PaymentsLab,
} from "./states";
import { monthBounds, parseUrl, toSearch, type PaymentsUrl, type Tab } from "./url";

// ---------- page state ----------

/** A chart column picked to see its payments: that day, month or year. */
export interface PaymentsBucket {
  key: string;
  title: string;
  range: Bucket["range"];
  unit: Unit;
}

/**
 * All the view state lives in the URL (see url.ts). It is mirrored in React state so the page answers at
 * once, written to the address bar with router.replace (one history entry per page, however much you type or
 * click), and read back when the address changes underneath us: Back, Forward or a pasted link.
 * Opening a payment's details is the one view that pushes, so Back closes it.
 */
export function usePaymentsView(initial: PaymentsData) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [raw, setData] = React.useState(initial);
  // Fills in any missing amounts or tiers, so no number on the page is ever NaN.
  const data = React.useMemo(() => withAmounts(raw), [raw]);
  const [url, setUrl] = React.useState<PaymentsUrl>(() => parseUrl(searchParams, initial));
  const latest = React.useRef(url);
  /** Search strings this page wrote that the address bar hasn't reported back yet. */
  const written = React.useRef<string[]>([]);
  /** The open payment's history entry was pushed by this page, so closing it goes Back. */
  const pushedPayment = React.useRef(false);

  const update = React.useCallback(
    (patch: Partial<PaymentsUrl>, how: "replace" | "push" = "replace") => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      setUrl(next);
      const current = new URLSearchParams(window.location.search);
      const search = toSearch(next, initial, current);
      if (search === current.toString()) return;
      written.current.push(search);
      router[how](search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [initial, pathname, router],
  );

  // A link with defaults or junk in it is tidied once, so the address always matches what is shown.
  const tidied = React.useRef(false);
  React.useEffect(() => {
    if (tidied.current) return;
    tidied.current = true;
    update({});
  }, [update]);

  // Back, Forward or a new link: read the view from the address.
  React.useEffect(() => {
    const search = searchParams.toString();
    const index = written.current.indexOf(search);
    if (index >= 0) {
      written.current.splice(0, index + 1);
      return;
    }
    written.current = [];
    pushedPayment.current = false;
    const next = parseUrl(searchParams, initial);
    latest.current = next;
    setUrl(next);
  }, [searchParams, initial]);

  const { period, tab, on, q, tiers, types, statuses, page, payment } = url;
  const { current, previous } = ranges(period, data.today);
  const bucket = React.useMemo<PaymentsBucket | null>(() => {
    const found = on ? periodBuckets(period, data).find((b) => b.key === on) : undefined;
    return found ? { key: found.key, title: found.title, range: found.range, unit: unitOf(period) } : null;
    // The buckets only depend on the range and today (and on the first payment for "all time").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, period, data.today, data.payments[0]?.paidAt]);

  const setTab = React.useCallback(
    (next: string) => {
      const tab = (["overview", "transactions", "tiers"].includes(next) ? next : "overview") as Tab;
      // Search, filters, page and details belong to Transactions; leaving it starts them over.
      update({ tab, q: "", tiers: [], types: [], statuses: [], page: 1, payment: null });
    },
    [update],
  );
  // A new range starts the page over: the picked column and page belong to the old one.
  const setPeriod = React.useCallback((next: Period) => update({ period: next, on: null, page: 1, payment: null }), [update]);
  const setBucket = React.useCallback(
    (next: { key: string } | null) => update({ on: next ? next.key : null, page: 1, ...(next ? { tab: "transactions" as const } : {}) }),
    [update],
  );
  const setSearch = React.useCallback((next: string) => update({ q: next.trim(), page: 1 }), [update]);
  const setTierFilter = React.useCallback((next: string[]) => update({ tiers: next, page: 1 }), [update]);
  const setTypeFilter = React.useCallback((next: string[]) => update({ types: next, page: 1 }), [update]);
  const setStatusFilter = React.useCallback((next: string[]) => update({ statuses: next, page: 1 }), [update]);
  const setPage = React.useCallback((next: number) => update({ page: next }), [update]);
  const openPayment = React.useCallback(
    (id: string) => {
      pushedPayment.current = true;
      update({ payment: id }, "push");
    },
    [update],
  );
  const closePayment = React.useCallback(() => {
    if (pushedPayment.current) {
      pushedPayment.current = false;
      router.back();
    } else update({ payment: null });
  }, [router, update]);

  return {
    data,
    setData,
    period,
    setPeriod,
    current,
    previous,
    tab,
    setTab,
    bucket,
    setBucket,
    query: q,
    setSearch,
    tierFilter: tiers,
    setTierFilter,
    typeFilter: types,
    setTypeFilter,
    statusFilter: statuses,
    setStatusFilter,
    page,
    setPage,
    payment,
    openPayment,
    closePayment,
  };
}
export type PaymentsView = ReturnType<typeof usePaymentsView>;

/**
 * Undo for anything on the page: the toast's Undo, or Ctrl+Z (Cmd+Z) outside text fields and dialogs.
 * Toasts name what happened and what came back.
 */
export type Recorder = ReturnType<typeof useUndo>;

export function useUndo(expired = false) {
  const { toast } = useToast();
  // With the lab's Undo expired on, the change was already saved by the time Undo is pressed.
  const expiredRef = React.useRef(expired);
  React.useEffect(() => {
    expiredRef.current = expired;
  }, [expired]);
  const stack = React.useRef<{ undo: () => void; restored: string }[]>([]);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.key.toLowerCase() !== "z") return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable=true], [role=dialog]")) return;
      const last = stack.current.pop();
      if (!last) return;
      event.preventDefault();
      if (expiredRef.current) return toast({ title: "Couldn't undo because the change was already saved" });
      last.undo();
      toast({ title: last.restored });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast]);

  return React.useCallback(
    (done: string, restored: string, undo: () => void) => {
      const entry = { undo, restored };
      stack.current.push(entry);
      toast({
        title: done,
        actionLabel: "Undo",
        onAction: () => {
          if (!stack.current.includes(entry)) return;
          stack.current = stack.current.filter((e) => e !== entry);
          if (expiredRef.current) return toast({ title: "Couldn't undo because the change was already saved" });
          undo();
          toast({ title: restored });
        },
      });
    },
    [toast],
  );
}

/**
 * Where the real page fetches a part the first time it's needed (the chart, a tab, a page of
 * transactions; see docs/backend/payments-insights.md). Demo data is already here, so it's always ready;
 * the loading placeholders it guards stay for the real fetch.
 */
export function useLoadedOnce(key: string) {
  void key;
  return true;
}

// ---------- shared bits ----------

/** The Date column's width in Transactions. */
const LEAD = "calc(var(--space-8) * 1.875)";

const Num = styled.span`
  font-variant-numeric: tabular-nums;
`;

/* A declined payment's $0: there was no money, so it reads quieter than a real amount. */
const Zero = styled.span`
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
`;

/* A person's name that opens them in the members directory (where their email is). Underlined on hover and keyboard focus; the text keeps its normal colour. */
const PersonLinkText = styled(Link)`
  display: block;
  min-width: 0;
  max-width: 100%;
  color: inherit;
  text-decoration: none;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    text-decoration: underline;
  }
`;

/* Inside a clickable table row the link must not also open the row's details, by click or by Enter. */
function PersonLink({ personId, children }: { personId: string; children: React.ReactNode }) {
  return (
    <PersonLinkText
      href={`/admin/members?person=${encodeURIComponent(personId)}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {children}
    </PersonLinkText>
  );
}

const GIFTED = "Gifted membership";

const DesktopOnly = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileOnly = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--row-height);
  box-shadow: inset 0 -1px 0 var(--color-border);
`;

const SkeletonBar = styled.span<{ $width: string }>`
  display: block;
  height: var(--space-3);
  width: ${({ $width }) => $width};
  border-radius: var(--radius-sm);
  background: var(--color-surface);
`;

const SlowRow = styled(StillLoading)`
  display: flex;
  align-items: center;
  height: var(--row-height);
  box-shadow: inset 0 -1px 0 var(--color-border);
`;

/** Placeholder rows at the table's real row height, so nothing jumps when data arrives. */
export function RowsLoading({ rows = 5, label = "Loading", slow = false }: { rows?: number; label?: string; slow?: boolean }) {
  return (
    <div aria-busy="true">
      <LoadingStatus label={label} slow={slow} />
      {slow && <SlowRow aria-hidden="true">{STILL_LOADING}</SlowRow>}
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} aria-hidden="true">
          <SkeletonBar $width="14%" />
          <SkeletonBar $width="30%" />
          <SkeletonBar $width="12%" />
        </SkeletonRow>
      ))}
    </div>
  );
}

/** "Nov 14" this year, "Nov 14, 2025" before it. */
function shortDate(iso: string, today: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", ...(iso.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }) });
}

/** Demo PayPal ids, stable per payment. */
function hash(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36).toUpperCase();
}
export const paypalId = (p: Payment) => `${hash(p.chargeId)}${hash(`${p.chargeId}x`)}`.slice(0, 17).padEnd(17, "0");
const paidTime = (p: Payment) => {
  const n = parseInt(hash(`${p.chargeId}t`), 36);
  return `${String(7 + (n % 15)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
};

// ---------- period ----------

const PeriodBox = styled.div`
  width: calc(var(--space-8) * 3.5);
  max-width: 100%;
`;

/** One range of months for the whole page, in the header. The chart picks days, months or years from it. */
export function PeriodPicker({ view }: { view: PaymentsView; pl: PaymentsLab }) {
  const { min, max } = monthBounds(view.data);
  return (
    <PeriodBox>
      <MonthRangePicker aria-label="Period" size="compact" value={view.period} onValueChange={view.setPeriod} min={min} max={max} allTime />
    </PeriodBox>
  );
}

// ---------- status ----------

type Kind = "unmatched" | "declined" | "refund" | "reversal";

/* `text` is set when the word itself carries the colour too (a declined card), not only the icon. */
const KIND: Record<Kind, { tag: string; icon: LucideIcon; color: string; text?: string }> = {
  unmatched: { tag: "Unmatched", icon: Link2Off, color: "var(--color-info)" },
  declined: { tag: "Declined", icon: CircleX, color: "var(--color-danger)", text: "var(--color-danger)" },
  refund: { tag: "Refunded", icon: Undo2, color: "var(--color-warning)" },
  reversal: { tag: "Chargeback", icon: Undo2, color: "var(--color-danger)" },
};

/** What a Transactions row is, for the Type filter (the URL's `type` values). */
type RowType = "membership" | "gifted" | "declined" | "refund" | "chargeback";
const TYPE_OF: Record<Payment["kind"], RowType> = { payment: "membership", gift: "gifted", declined: "declined", refund: "refund", reversal: "chargeback" };
const typeOf = (p: Payment): RowType => TYPE_OF[p.kind];
/** Whether the row is tied to a person, for the Status filter. */
type RowStatus = "matched" | "unmatched";
const statusOf = (p: Payment): RowStatus => (p.personId ? "matched" : "unmatched");

/* A plain status: an icon in the status colour and the word, no chip (chips are tags elsewhere in the product). */
const StatusText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

function Status({ kind }: { kind: Kind }) {
  const k = KIND[kind];
  return (
    <StatusText style={k.text ? { color: k.text } : undefined}>
      <Icon icon={k.icon} size={16} style={{ color: k.color }} />
      {k.tag}
    </StatusText>
  );
}

/* The kit Card, flat: the border drawn as an inset 1px shadow so it matches the page's other hairlines at any zoom. */
export const BoxCard = styled(Card)`
  &&& {
    border: 0;
    box-shadow: inset 0 0 0 1px var(--color-border);
  }
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  padding: var(--space-5);

  @media (max-width: 767px) {
    padding: var(--space-4);
  }
`;

// ---------- the number cards ----------

/* Four equal cards in a row; two by two on tablets; one above the other on phones. */
const Numbers = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  min-width: 0;

  @media (max-width: 1099px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 599px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* Each card takes two rows of the parent grid (label, value) through subgrid, so a label that wraps in one card
   moves every value in that row down with it: the values always share one baseline. */
const NumberCard = styled(BoxCard)`
  &&& {
    display: grid;
    grid-row: span 2;
    grid-template-rows: subgrid;
    row-gap: var(--space-1);
    align-content: start;
  }
`;

const FigureLabel = styled.span`
  align-self: end;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/* The value and its change mark, centred on each other; the mark wraps under a long value. Every card has the
   same label, value size and mark placement, so the values share one baseline across the row. */
const ValueLine = styled.span`
  align-self: start;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--space-2);
  min-width: 0;
`;

const FigureValue = styled.span`
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  white-space: nowrap;
`;

/* A small filled triangle and the amount; the triangle's direction says up or down, so colour is never alone. */
const Change = styled.span<{ $down: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: ${({ $down }) => ($down ? "var(--color-danger)" : "var(--color-success)")};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

interface FigureInfo {
  key: string;
  label: string;
  /** Null when the number can't be worked out: the card shows a dash and says why. */
  value: string | null;
  /** Why the number can't be worked out, in a few words. */
  reason: string;
  /** "Up to Nov 18" when the number is missing its last days (PayPal is behind). */
  note: string | null;
  /** The change from the period before: its size and the full sentence. Null when there's nothing to say. */
  change: { diff: number; amount: string; sentence: string } | null;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/* The failure and loading lines take the value's own line height, so a card never changes size. */
const ValueSlot = styled.span`
  display: flex;
  align-items: center;
  min-height: calc(var(--text-xl) * var(--leading-heading));
  min-width: 0;
`;

const Partial = styled.span`
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

/* A thin line along a card's top edge while it reloads: what's on screen stays, and says it's being updated. */
const refreshSlide = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(340%);
  }
`;

const RefreshTrack = styled.span`
  position: absolute;
  inset: 0 var(--space-3) auto;
  height: 2px;
  overflow: hidden;
  border-radius: var(--radius-full);
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 30%;
    background: var(--color-primary);
    animation: ${refreshSlide} calc(var(--duration-slow) * 5) var(--ease) infinite;
  }
`;

/** Shown along a card's top while it reloads. */
export function Refreshing() {
  return <RefreshTrack aria-hidden="true" />;
}

/**
 * Raised, Paying members, Monthly income and Gifted subscriptions for the range, all in the same card. Raised and
 * Paying members show their change from the period before. Each card loads, fails and retries on its own place,
 * and a number that can't be worked out shows a dash with its reason, never 0 or NaN.
 */
export function Figures({ view, pl, refreshing }: { view: PaymentsView; pl: PaymentsLab; refreshing: boolean }) {
  const { data, current, previous, period } = view;
  const { lab } = pl;
  // One request brings all four numbers, so they fail and retry together.
  const all = useRetry(lab.is("numbers-failed"));
  const ok = (...n: number[]) => n.every(Number.isFinite);
  const show = (n: number, format: (n: number) => string) => (ok(n) ? format(n) : null);
  // A change is only shown against a period the data fully covers: not one that starts before the first payment
  // (Raised), nor a date before the first person joined (Paying members). Otherwise no triangle and no tooltip.
  const firstPaid = firstPaymentDate(data);
  const firstJoined = firstJoinDate(data);
  const keptCovered = previous !== null && firstPaid !== null && previous.from >= firstPaid;
  const payingCovered = previous !== null && firstJoined !== null && previous.to >= firstJoined;
  const change = (diff: number, amount: string, sentence: string, usable: boolean): FigureInfo["change"] =>
    usable && ok(diff) && diff !== 0 ? { diff, amount, sentence } : null;

  const keptNow = kept(paymentsIn(data, current));
  const keptBefore = previous ? kept(paymentsIn(data, previous)) : 0;
  const keptDiff = Math.round(keptNow - keptBefore);
  const payingNow = payingPeopleOn(data, current.to).length;
  const payingBefore = previous ? payingOn(data, previous.to) : 0;
  const net = payingNow - payingBefore;
  const income = monthlyIncome(data, current.to);
  // Net of PayPal's fees, like Raised.
  const gifted = giftedRaised(data, current);
  // payments.fee_cents is null until PayPal reports the fee: what SDC kept can't be worked out until then.
  const inRange = paymentsIn(data, current);
  const noFee = (n: number) => `PayPal hasn't sent the fee for ${formatCount(n)} ${n === 1 ? "payment" : "payments"} yet`;
  // PayPal is behind: money in a range that runs to today is missing its last days.
  const partial = pl.partial && current.to >= data.today ? upToText(data.today) : null;

  const figures: FigureInfo[] = [
    {
      key: "kept",
      label: capitalize(raisedText(period, data.today)),
      value: show(keptNow, formatMoney),
      reason: noFee(feesMissing(inRange)),
      note: partial,
      change: partial ? null : change(keptDiff, formatMoney(Math.abs(keptDiff)), `${formatMoney(Math.abs(keptDiff))} ${keptDiff > 0 ? "more" : "less"} than ${comparedTo(period, data.today)}`, keptCovered),
    },
    {
      key: "paying",
      label: "Paying members",
      value: show(payingNow, formatCount),
      reason: "Some members' payment status is missing",
      note: null,
      change: change(
        net,
        formatCount(Math.abs(net)),
        `${net > 0 ? `${formatCount(net)} more paying ${net === 1 ? "member" : "members"}` : `${formatCount(-net)} fewer paying ${-net === 1 ? "member" : "members"}`} than on ${previous ? dayText(previous.to, data.today) : ""}`,
        payingCovered,
      ),
    },
    { key: "monthly", label: "Monthly income", value: show(income, formatMoney), reason: "Some members' costs are missing", note: null, change: null },
    { key: "gifts", label: "Gifted subscriptions", value: show(gifted, formatMoney), reason: noFee(feesMissing(inRange.filter((p) => p.kind === "gift"))), note: partial, change: null },
  ];

  function body(f: FigureInfo) {
    const state = all;
    if (pl.loading || state.retrying)
      return (
        <ValueSlot aria-hidden="true">
          <Bar $width="60%" $height="calc(var(--text-xl) * 0.8)" />
        </ValueSlot>
      );
    if (state.failed)
      return (
        <ValueSlot>
          <RegionFailed text="Couldn't load" onRetry={state.retry} compact />
        </ValueSlot>
      );
    if (f.value === null) return <Unavailable reason={f.reason} />;
    return (
      <>
        <FigureValue>{f.value}</FigureValue>
        {f.change && (
          <Tooltip content={f.change.sentence}>
            <Change $down={f.change.diff < 0} tabIndex={0} role="group" aria-label={f.change.sentence}>
              <Icon icon={Triangle} size={10} fill="currentColor" style={{ transform: f.change.diff < 0 ? "rotate(180deg)" : undefined }} />
              {f.change.amount}
            </Change>
          </Tooltip>
        )}
        {f.note && <Partial>{f.note}</Partial>}
      </>
    );
  }

  return (
    <Numbers data-figures="" role="group" aria-label="Figures" aria-busy={pl.loading || refreshing || undefined}>
      {pl.loading && <LoadingStatus label="Loading the numbers" slow={pl.takingLonger} />}
      {figures.map((f) => (
        <NumberCard key={f.key} data-figure={f.key} data-card="number">
          {refreshing && !pl.loading && <Refreshing />}
          <FigureLabel>{f.label}</FigureLabel>
          <ValueLine>{body(f)}</ValueLine>
        </NumberCard>
      ))}
    </Numbers>
  );
}

// ---------- transactions ----------

const PAGE_SIZE = 25;

const NotMatched = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
`;

const Stacked = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

const PhoneLine = styled.span`
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  min-width: 0;
`;

const PhoneText = styled.span`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  font-size: var(--text-sm);

  & > span:last-child {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
`;

export function Transactions({
  view,
  pl,
  refreshing,
  onOpen,
}: {
  view: PaymentsView;
  pl: PaymentsLab;
  refreshing: boolean;
  onOpen: (p: Payment) => void;
}) {
  const { data, current, bucket, page } = view;
  const query = view.query;
  const tiers = view.tierFilter;
  const statuses = view.statusFilter;
  const types = view.typeFilter;
  const bucketKey = bucket ? bucket.range.from + bucket.range.to : "";
  // The field holds what is typed; the address gets it 300ms after the last keystroke. A search that
  // arrives from the address (Back, a pasted link) replaces what is typed.
  const [text, setText] = React.useState(query);
  const [seenQuery, setSeenQuery] = React.useState(query);
  if (seenQuery !== query) {
    setSeenQuery(query);
    if (text.trim() !== query) setText(query);
  }
  const filtered = tiers.length > 0 || types.length > 0 || statuses.length > 0 || bucket !== null;
  const byId = React.useMemo(() => new Map(data.people.map((p) => [p.id, p])), [data.people]);
  const tierName = new Map(data.tiers.map((t) => [t.id, t.name]));
  const q = query.trim().toLowerCase();
  const { all, tierCounts, typeCounts, statusCounts } = React.useMemo(() => {
    const inRange = [...paymentsIn(data, bucket ? bucket.range : current)].reverse();
    const personOf = (p: Payment) => (p.personId ? byId.get(p.personId) : undefined);
    const searched = inRange.filter((p) => {
      const person = personOf(p);
      return !q || `${person?.name ?? ""} ${person?.email ?? ""} ${p.payerEmail}`.toLowerCase().includes(q);
    });
    const tierOk = (p: Payment) => tiers.length === 0 || (p.tierId !== null && tiers.includes(p.tierId));
    const typeOk = (p: Payment) => types.length === 0 || types.includes(typeOf(p));
    const statusOk = (p: Payment) => statuses.length === 0 || statuses.includes(statusOf(p));
    // Each option's count leaves its own filter out, so it says what ticking it would find.
    const tierCounts = new Map<string, number>();
    for (const p of searched) if (typeOk(p) && statusOk(p) && p.tierId) tierCounts.set(p.tierId, (tierCounts.get(p.tierId) ?? 0) + 1);
    const typeCounts: Record<RowType, number> = { membership: 0, gifted: 0, declined: 0, refund: 0, chargeback: 0 };
    for (const p of searched) if (tierOk(p) && statusOk(p)) typeCounts[typeOf(p)] += 1;
    const statusCounts: Record<RowStatus, number> = { matched: 0, unmatched: 0 };
    for (const p of searched) if (tierOk(p) && typeOk(p)) statusCounts[statusOf(p)] += 1;
    return { all: searched.filter((p) => tierOk(p) && typeOk(p) && statusOk(p)), tierCounts, typeCounts, statusCounts };
  }, [data, current, bucket, q, byId, tiers, types, statuses]);
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  // A page number past the end (an old link) lands on the last page.
  const { setPage } = view;
  React.useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page, setPage]);
  // Each page is its own request; the current rows stay, dimmed, while the next page loads.
  const ready = useLoadedOnce(`transactions:${current.from}:${current.to}:${bucketKey}:${safePage}`) && !pl.loading;
  const failure = useRetry(pl.lab.is("transactions-failed"));
  // A search, filter or page change keeps the rows on screen, dimmed, until the new ones arrive.
  const searching = useRefreshing(`${q}|${tiers.join()}|${types.join()}|${statuses.join()}|${bucketKey}|${safePage}`, pl.refreshFor);
  const busy = !ready || refreshing || searching;
  const [shownPage, setShownPage] = React.useState<number | null>(null);
  if (ready && shownPage !== safePage) setShownPage(safePage);
  const visiblePage = ready ? safePage : shownPage;

  // A deleted payer says so; a payer with no name shows their email: never a blank cell.
  const who = (p: Payment) => {
    if (!p.personId) return p.payerEmail || "No email from PayPal";
    const person = byId.get(p.personId);
    return person ? person.name || person.email || p.payerEmail : "Deleted person";
  };
  const phoneKind = (p: Payment) =>
    p.kind === "gift"
      ? GIFTED
      : !p.personId
        ? "Unmatched"
        : `${tierName.get(p.tierId ?? "") ?? "No tier"}${p.kind === "declined" ? " · Declined" : p.kind === "refund" ? " · Refunded" : p.kind === "reversal" ? " · Chargeback" : ""}`;
  const columns: TableColumn<Payment>[] = [
    { key: "date", header: "Date", width: LEAD, render: (p) => shortDate(p.paidAt, data.today) },
    {
      key: "who",
      header: "Name",
      // The rest of the row: with every column sized, the table lays out fixed, so Name and Tier truncate and
      // Amount is never pushed off the right edge.
      width: "auto",
      render: (p) => {
        if (!p.personId)
          return (
            <NotMatched>
              <TruncatedText tooltip>{p.payerEmail || "No email from PayPal"}</TruncatedText>
              <Status kind={isMoneyBack(p) ? (p.kind as "refund" | "reversal") : "unmatched"} />
            </NotMatched>
          );
        const name = <TruncatedText tooltip>{who(p)}</TruncatedText>;
        const person = byId.get(p.personId);
        const linked = person ? <PersonLink personId={person.id}>{name}</PersonLink> : name;
        return p.kind === "declined" || isMoneyBack(p) ? (
          <NotMatched>
            {linked}
            <Status kind={p.kind as "declined" | "refund" | "reversal"} />
          </NotMatched>
        ) : (
          linked
        );
      },
    },
    {
      key: "tier",
      header: "Tier",
      width: "160px",
      render: (p) => <TruncatedText tooltip>{p.kind === "gift" ? GIFTED : ((p.tierId ? tierName.get(p.tierId) : undefined) ?? "–")}</TruncatedText>,
    },
    {
      key: "amount",
      header: "Amount",
      width: "120px",
      align: "right",
      render: (p) => (p.kind === "declined" ? <Zero>{formatMoney(0)}</Zero> : <Num>{formatMoney(p.amount)}</Num>),
    },
  ];

  const tierOptions = data.tiers.map((t) => ({
    value: t.id,
    label: t.archived ? `${t.name} (deleted)` : t.name,
    count: tierCounts.get(t.id) ?? 0,
  }));
  const typeOptions = [
    { value: "membership", label: "Membership", count: typeCounts.membership },
    { value: "gifted", label: GIFTED, count: typeCounts.gifted },
    { value: "declined", label: "Declined", count: typeCounts.declined },
    { value: "refund", label: "Refund", count: typeCounts.refund },
    { value: "chargeback", label: "Chargeback", count: typeCounts.chargeback },
  ];
  const statusOptions = [
    { value: "matched", label: "Matched", count: statusCounts.matched },
    { value: "unmatched", label: "Unmatched", count: statusCounts.unmatched },
  ];
  const toolbar = (
    <FilterArea>
      <FilterToolbar
        search={
          <SearchField
            aria-label="Search by name or email"
            placeholder="Search by name or email"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onSearch={view.setSearch}
          />
        }
      >
        <CheckFilter label="Tier" options={tierOptions} value={tiers} onApply={view.setTierFilter} />
        <CheckFilter label="Type" options={typeOptions} value={types} onApply={view.setTypeFilter} />
        <CheckFilter label="Status" options={statusOptions} value={statuses} onApply={view.setStatusFilter} />
        {bucket && <DateFilter title={bucket.title} unit={bucket.unit} onClear={() => view.setBucket(null)} />}
      </FilterToolbar>
    </FilterArea>
  );

  if (failure.failed)
    return (
      <Stacked>
        {toolbar}
        <BlockFailed title="Couldn't load payments" onRetry={failure.retry} />
      </Stacked>
    );
  if (visiblePage === null || failure.retrying)
    return (
      <Stacked>
        {toolbar}
        <RowsLoading rows={8} label="Loading payments" slow={pl.takingLonger} />
      </Stacked>
    );
  const rows = all.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const clearFilters = () => {
    view.setTierFilter([]);
    view.setTypeFilter([]);
    view.setStatusFilter([]);
    if (bucket) view.setBucket(null);
  };
  const empty = (
    <ListEmptyState
      items="payments"
      query={query.trim()}
      searchedFields="names and emails"
      filtered={filtered ? "payments with these filters" : undefined}
      onClearSearch={() => view.setSearch("")}
      onClearFilters={clearFilters}
      onClearSearchAndFilters={() => {
        view.setSearch("");
        clearFilters();
      }}
      empty={{ icon: ReceiptText, title: bucket ? `No payments ${bucket.unit === "day" ? "on" : "in"} ${bucket.title}` : "No payments in this period" }}
    />
  );

  return (
    <Stacked>
      {toolbar}
      <DesktopOnly>
        <Table
          columns={columns}
          rows={rows}
          getRowId={(p) => p.id}
          aria-label="Transactions"
          busy={busy}
          onRowClick={onOpen}
          empty={empty}
          emptyBelowHeader
        />
      </DesktopOnly>
      <MobileOnly>
        {rows.length === 0 ? (
          empty
        ) : (
          <List aria-busy={busy || undefined}>
            {rows.map((p) => (
              <ListRow key={p.id} type="button" onClick={() => onOpen(p)}>
                <PhoneLine>
                  <PhoneText>
                    <TruncatedText>{who(p)}</TruncatedText>
                    <span>
                      {shortDate(p.paidAt, data.today)} · {phoneKind(p)}
                    </span>
                  </PhoneText>
                  {p.kind === "declined" ? <Zero>{formatMoney(0)}</Zero> : <Num>{formatMoney(p.amount)}</Num>}
                </PhoneLine>
              </ListRow>
            ))}
          </List>
        )}
      </MobileOnly>
      <Pagination page={safePage} pageCount={pageCount} pageSize={PAGE_SIZE} total={all.length} onPageChange={view.setPage} />
    </Stacked>
  );
}

const Details = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-2) var(--space-5);
  margin: 0;
  font-size: var(--text-sm);

  & > dt {
    color: var(--color-text-muted);
  }
  & > dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

const SheetNote = styled.p`
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
`;

/** One payment's details: the place where PayPal's fee and what SDC kept are shown. */
export function PaymentSheet({ view, payment, onClose }: { view: PaymentsView; payment: Payment | null; onClose: () => void }) {
  const person = payment?.personId ? view.data.people.find((p) => p.id === payment.personId) : undefined;
  const tier = payment?.tierId ? view.data.tiers.find((t) => t.id === payment.tierId) : undefined;
  const name = person?.name || person?.email || payment?.payerEmail || "No email from PayPal";
  const feeKnown = payment ? Number.isFinite(payment.fee) : true;
  // The other row of the same PayPal charge (a gift paid together with the payer's own membership, or the reverse).
  const partner = payment && payment.kind !== "declined" ? view.data.payments.find((p) => p.chargeId === payment.chargeId && p.id !== payment.id && p.kind !== "declined") : undefined;
  const partnerTier = partner?.tierId ? view.data.tiers.find((t) => t.id === partner.tierId)?.name : undefined;
  const partnerText = partner?.kind === "gift" ? "a gifted membership" : partnerTier ? `their own ${partnerTier} membership` : "their own membership";
  const together = partner && payment ? `Paid together with ${partnerText} in one PayPal payment, ${formatMoney(payment.amount + partner.amount)} total` : null;
  return (
    <Sheet open={payment !== null} onOpenChange={(open) => !open && onClose()}>
      {payment && (
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{name}</SheetTitle>
            <SheetDescription>{formatDate(payment.paidAt)}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            {payment.kind === "declined" && <SheetNote>The card was declined on {formatDate(payment.paidAt)}. No money received</SheetNote>}
            {payment.kind === "gift" && <SheetNote>Gifted membership bought by {name}</SheetNote>}
            {payment.kind === "refund" && <SheetNote>Refunded in PayPal on {formatDate(payment.paidAt)}</SheetNote>}
            {payment.kind === "reversal" && <SheetNote>The payer&apos;s bank took this payment back on {formatDate(payment.paidAt)}</SheetNote>}
            {together && <SheetNote>{together}</SheetNote>}
            <Details>
              {payment.kind !== "declined" && (
                <>
                  <dt>Paid</dt>
                  <dd>{formatMoney(payment.amount)}</dd>
                  <dt>PayPal fee</dt>
                  <dd>{feeKnown ? formatMoney(payment.fee) : "Not in from PayPal yet"}</dd>
                  <dt>Earned</dt>
                  <dd>{feeKnown ? formatMoney(payment.amount - payment.fee) : "—"}</dd>
                </>
              )}
              {(tier || payment.kind === "gift") && (
                <>
                  <dt>Tier</dt>
                  <dd>{payment.kind === "gift" ? GIFTED : tier?.name}</dd>
                </>
              )}
              {person && (
                <>
                  <dt>Person</dt>
                  <dd>
                    <PersonLink personId={person.id}>{person.name || person.email}</PersonLink>
                  </dd>
                </>
              )}
              <dt>Email</dt>
              <dd>{person?.email ?? payment.payerEmail}</dd>
              <dt>PayPal ID</dt>
              <dd>{paypalId(payment)}</dd>
            </Details>
          </SheetBody>
        </SheetContent>
      )}
    </Sheet>
  );
}

// ---------- download ----------

/* Cancel on the far left, the main action on the far right, so one is never clicked for the other. */
export const SplitActions = styled(DialogActions)`
  justify-content: space-between;
`;

const DownloadBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
`;

/** A spreadsheet file: a byte-order mark so Excel reads accents, then comma-separated rows with Windows line ends. */
export function csvFile(rows: (string | number)[][]) {
  return "\ufeff" + rows.map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}

/** Hands the browser a file to save. */
export function saveFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function csvField(value: string | number) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * One row per transaction (a charge with a gift is two rows), declined payments included with amount 0, oldest first, no totals row: it sorts, sums and imports into QuickBooks,
 * Xero or Wave. Plain numbers (no $), dates as YYYY-MM-DD in Toronto time.
 */
function spreadsheet(data: PaymentsData, period: Period) {
  const { current } = ranges(period, data.today);
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const tierName = new Map(data.tiers.map((t) => [t.id, t.name]));
  const linkName = new Map(data.sources.map((s) => [s.id, s.name]));
  const items = paymentsIn(data, current);
  const rows = [
    ["Date", "Time", "Type", "Status", "PayPal transaction ID", "Name", "Email", "Tier", "Gross", "PayPal fee", "Net", "Currency", "Signup link"],
    ...items.map((p) => {
      const person = p.personId ? byId.get(p.personId) : undefined;
      return [
        p.paidAt,
        paidTime(p),
        p.kind === "gift" ? GIFTED : p.kind === "refund" ? "Refund" : p.kind === "reversal" ? "Chargeback" : "Payment",
        p.kind === "declined" ? "Declined" : isMoneyBack(p) ? "Returned" : "Paid",
        paypalId(p),
        person?.name ?? "",
        person?.email ?? p.payerEmail,
        p.tierId ? (tierName.get(p.tierId) ?? "") : "",
        p.amount.toFixed(2),
        // A fee PayPal hasn't sent yet is an empty cell, never "NaN".
        Number.isFinite(p.fee) ? p.fee.toFixed(2) : "",
        Number.isFinite(p.fee) ? (p.amount - p.fee).toFixed(2) : "",
        "CAD",
        person?.sourceId ? (linkName.get(person.sourceId) ?? "") : "",
      ];
    }),
  ];
  const from = current.from === "0000-01-01" ? (items[0]?.paidAt ?? data.today) : current.from;
  return {
    count: received(items).length,
    csv: csvFile(rows),
    name: `potluck-payments-${from}-to-${current.to}.csv`,
  };
}

export function DownloadButton({ view, pl }: { view: PaymentsView; pl: PaymentsLab }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [period, setPeriod] = React.useState<Period>(view.period);
  const [failed, setFailed] = React.useState(false);
  const { min, max } = monthBounds(view.data);
  const file = spreadsheet(view.data, period);
  // The spreadsheet is built on the server; it fails like a save does (the lab's own "Couldn't make the spreadsheet").
  const attempt = useAttempt(pl.lab);
  const locked = lockReason(pl.lab, "download");

  function download(event: React.FormEvent) {
    event.preventDefault();
    attempt.run(() => {
      if (pl.lab.is("download-failed")) return setFailed(true);
      saveFile(file.name, file.csv);
      setOpen(false);
      toast({ title: `Downloaded ${formatCount(file.count)} ${file.count === 1 ? "payment" : "payments"} for ${period ? formatMonthRange(period) : "all time"}` });
    });
  }

  const trigger = (
    <Button
      type="button"
      $variant="secondary"
      disabled={locked !== null}
      onClick={() => {
        setPeriod(view.period);
        setFailed(false);
        attempt.clear();
        setOpen(true);
      }}
    >
      <Icon icon={Download} />
      Download spreadsheet
    </Button>
  );
  const error = failed ? "Couldn't make the spreadsheet. Try again in a moment" : attempt.error ? attemptText(attempt.error, "download") : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !attempt.busy && setOpen(next)}>
      {locked ? <DisabledReason reason={locked}>{trigger}</DisabledReason> : trigger}
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.target as HTMLElement).focus();
        }}
      >
        <form onSubmit={download} noValidate>
          <DialogTitle>Download spreadsheet</DialogTitle>
          <DownloadBody>
            <Field label="Period">
              {(props) => (
                <MonthRangePicker
                  {...props}
                  value={period}
                  onValueChange={(next) => {
                    setPeriod(next);
                    setFailed(false);
                  }}
                  min={min}
                  max={max}
                  allTime
                  disabled={attempt.busy}
                />
              )}
            </Field>
          </DownloadBody>
          {error && <DialogNote tone="danger">{error}</DialogNote>}
          <SplitActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary" disabled={attempt.busy}>
                Cancel
              </Button>
            </DialogClose>
            <BusyButton type="submit" busy={attempt.busy}>
              <Icon icon={Download} />
              Download
            </BusyButton>
          </SplitActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- match a payment ----------

/** Likely payers: their name is in the payer's email, they pay that amount, or their own payment failed. */
function suggestions(data: PaymentsData, payment: Payment): Person[] {
  const email = payment.payerEmail.toLowerCase();
  const score = (p: Person) => {
    let s = 0;
    for (const part of p.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")) if (part.length > 2 && email.includes(part)) s += 3;
    if (p.pays === payment.amount) s += 1;
    if (p.status === "payment_problem" || p.status === "suspended") s += 2;
    return s;
  };
  return data.people
    .filter((p) => p.status !== "cancelled")
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name))
    .slice(0, 3)
    .map((x) => x.p);
}

const STATUS_NOTE: Partial<Record<Person["status"], string>> = { payment_problem: "payment failed", suspended: "paused" };

const MatchBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
`;

const OptionText = styled.span`
  display: flex;
  flex-direction: column;
`;

const OptionNote = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const ChoiceError = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

const ELSE = "__someone-else";

/** Likely payers as choices (none picked for you), anyone else from a searchable list. Undo in the toast. */
export function MatchDialog({
  view,
  pl,
  paymentId,
  onClose,
  onMatched,
}: {
  view: PaymentsView;
  pl: PaymentsLab;
  paymentId: string | null;
  onClose: () => void;
  onMatched: (payment: Payment, person: Person) => void;
}) {
  const payment = view.data.payments.find((p) => p.id === paymentId);
  const likely = React.useMemo(() => (payment ? suggestions(view.data, payment) : []), [payment, view.data]);
  const tierName = new Map(view.data.tiers.map((t) => [t.id, t.name]));
  const [choice, setChoice] = React.useState(likely.length ? "" : ELSE);
  const [other, setOther] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const others = view.data.people
    .filter((p) => p.status !== "cancelled")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ value: p.id, label: `${p.name} (${p.email})` }));

  const attempt = useAttempt(pl.lab);
  const [notMember, setNotMember] = React.useState<string | null>(null);
  const locked = lockReason(pl.lab, "match payments");
  // Changed by someone else: another admin matched it first, to the first person who isn't the one picked here.
  const picked = choice === ELSE ? other : choice;
  const theirs = view.data.people.find((p) => p.status !== "cancelled" && p.id !== picked);

  function submit(event: React.FormEvent, keepMine = false) {
    event.preventDefault();
    const personId = choice === ELSE ? other : choice;
    if (!payment) return;
    if (!personId) {
      setError("Choose who paid");
      return;
    }
    const person = view.data.people.find((p) => p.id === personId)!;
    attempt.run(() => {
      // assign_payment refuses someone whose membership ended since the list loaded.
      if (pl.lab.is("match-not-member")) return setNotMember(person.name || person.email);
      onMatched(payment, person);
    }, keepMine);
  }

  return (
    <Dialog open={payment !== undefined} onOpenChange={(open) => !open && !attempt.busy && onClose()}>
      {payment && (
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.target as HTMLElement).focus();
          }}
        >
          <form onSubmit={submit} noValidate>
            <DialogTitle>Match {formatMoney(payment.amount)} payment</DialogTitle>
            <DialogDescription>
              From {payment.payerEmail} on {formatDate(payment.paidAt)}
            </DialogDescription>
            <MatchBody>
              {likely.length > 0 && (
                <>
                  <Label id="match-who">Who paid?</Label>
                  <RadioGroup
                    value={choice}
                    onValueChange={(v) => {
                      setChoice(v);
                      setError(null);
                      setNotMember(null);
                    }}
                    aria-labelledby="match-who"
                  >
                    {likely.map((p) => (
                      <RadioGroupOption
                        key={p.id}
                        value={p.id}
                        label={
                          <OptionText>
                            <span>{p.name}</span>
                            <OptionNote>
                              {tierName.get(p.tierId)}
                              {STATUS_NOTE[p.status] ? `, ${STATUS_NOTE[p.status]}` : ""} · {p.email}
                            </OptionNote>
                          </OptionText>
                        }
                      />
                    ))}
                    <RadioGroupOption value={ELSE} label="Someone else" />
                  </RadioGroup>
                  {error && choice !== ELSE && (
                    <ChoiceError role="alert">
                      <Icon icon={CircleAlert} size={16} />
                      {error}
                    </ChoiceError>
                  )}
                </>
              )}
              {choice === ELSE && (
                <Field label={likely.length > 0 ? "Person" : "Who paid?"} required error={error}>
                  {(props) => (
                    <Select
                      {...props}
                      options={others}
                      value={other}
                      onValueChange={(v) => {
                        setOther(v);
                        setError(null);
                        setNotMember(null);
                      }}
                      placeholder="Choose a person"
                    />
                  )}
                </Field>
              )}
            </MatchBody>
            {attempt.error === "conflict" && theirs ? (
              <DialogNote
                tone="warning"
                actions={
                  <>
                    <Button
                      type="button"
                      $variant="outline"
                      $size="sm"
                      onClick={() => {
                        attempt.settle();
                        onMatched(payment, theirs);
                      }}
                    >
                      Use their version
                    </Button>
                    <Button type="button" $variant="outline" $size="sm" onClick={(e) => submit(e, true)}>
                      Keep my version
                    </Button>
                  </>
                }
              >
                Another admin matched this payment to {theirs.name || theirs.email} while you were choosing
              </DialogNote>
            ) : attempt.error && attempt.error !== "conflict" ? (
              <DialogNote tone="danger">{attemptText(attempt.error, "match the payment")}</DialogNote>
            ) : notMember ? (
              <DialogNote tone="danger">{notMember} isn&apos;t a member any more. Choose who else paid</DialogNote>
            ) : null}
            <SplitActions>
              <DialogClose asChild>
                <Button type="button" $variant="secondary" disabled={attempt.busy}>
                  Cancel
                </Button>
              </DialogClose>
              {locked ? (
                <DisabledReason reason={locked}>
                  <Button type="submit" disabled>
                    <Icon icon={Link2} />
                    Match payment
                  </Button>
                </DisabledReason>
              ) : (
                <BusyButton type="submit" busy={attempt.busy}>
                  <Icon icon={Link2} />
                  Match payment
                </BusyButton>
              )}
            </SplitActions>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
