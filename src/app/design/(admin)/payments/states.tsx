"use client";

/*
 * Every state the Payments page can be in, declared for the State lab (docs/design/state-lab.md) and the small
 * pieces that draw them. The lab only sets flags; this file turns them into what each region shows: which
 * regions load, fail or are empty, which numbers can't be worked out, and why actions are locked.
 * The real page gets the same shapes from the backend (docs/backend/payments-insights.md, "When things go wrong").
 */
import * as React from "react";
import { keyframes, styled } from "next-yak";
import { CircleAlert, Clock, LoaderCircle, RotateCw, TriangleAlert, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  SAVING_FOR,
  SEARCH_FOR,
  SLOW_SEARCH_FOR,
  useLabDeferred,
  useLabLoad,
  useStateLab,
} from "../../_state-lab/useStateLab";
import type { Payment, PaymentsData } from "./data";

// ---------- the lab ----------

/*
 * Only what can really happen with the payments backend (Icema's PayPal work: subscriptions, payments and
 * paypal_events; Sophia's tiers RPCs). Each state names where it comes from. App-wide conditions that this page
 * doesn't design for itself (offline, page not found, no access, read-only roles, rate limits) are left out.
 */
export const PAYMENTS_LAB = {
  data: [
    // Each part of the page is its own request (docs/backend/payments-insights.md, "What loads when").
    { id: "numbers-failed", label: "Couldn't load the numbers", description: "The numbers RPC fails. The four cards say so; charts and tabs work." },
    { id: "charts-failed", label: "Couldn't load the charts", description: "Each chart is its own RPC. Every chart card fails, each with its own Try again." },
    { id: "transactions-failed", label: "Couldn't load transactions", description: "The paged payments query fails." },
    { id: "tiers-failed", label: "Couldn't load tiers", description: "The tiers query fails." },
    // What the data itself can be.
    { id: "range-empty", label: "No payments in these months", description: "Other months have payments; this one has none." },
    { id: "refunds", label: "Refunds and chargebacks", description: "payments.kind refund or reversal: negative rows. Totals drop, a day can go below zero." },
    { id: "fees-missing", label: "PayPal fees not in yet", description: "payments.fee_cents is null for some payments, so what SDC kept can't be worked out." },
    { id: "no-tiers", label: "No tiers yet", description: "The tiers table is empty, or every tier was deleted." },
    // PayPal.
    { id: "paypal-behind", label: "PayPal events delayed", description: "Webhooks are failing and PayPal is retrying (paypal_events.error). Recent payments are missing." },
    { id: "paypal-not-set-up", label: "PayPal not set up", description: "No PayPal keys (e.g. during handoff). No new payments arrive." },
  ],
  actions: [
    { id: "match-not-member", label: "Person is no longer a member", description: "assign_payment: \"That person is not a member\"." },
    { id: "tier-deleted", label: "Tier deleted while editing", description: "update_tier returns \"deleted\": someone deleted it first." },
    { id: "delete-failed", label: "Couldn't delete a tier", description: "archive_tier fails (Delete or Restore in a tier's menu)." },
    { id: "download-failed", label: "Couldn't make the spreadsheet", description: "The server can't build the file." },
  ],
  notApplicable: [
    // App-wide, handled by the admin shell and kit, not designed per page.
    "notFound",
    "noPermission",
    "offline",
    "reconnecting",
    "readOnly",
    "actionDenied",
    "rateLimited",
    // Covered by a payments state above: one part failing is that part's own failure; stale is "PayPal events delayed".
    "sectionFailed",
    "sectionEmpty",
    "staleData",
    // Nothing on the page changes with exactly one item.
    "singleItem",
  ],
} as const;

/** The day the PayPal states stop at: four days before today. */
export function cutoffOf(today: string) {
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() - 4);
  return d.toISOString().slice(0, 10);
}

function shiftDay(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const shortDay = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

/** The lab, plus what the page needs from it in one place. */
export function usePaymentsLab() {
  const lab = useStateLab(PAYMENTS_LAB);
  const load = useLabLoad(lab);
  return {
    lab,
    /** First load: every region shows its placeholder. */
    loading: load.loading,
    takingLonger: load.takingLonger,
    /** The page's own failures. */
    pageFailed: lab.loadFailed,
    /** How long a refresh (a new range) takes in the demo. */
    refreshFor: lab.slowLoading ? SLOW_SEARCH_FOR : SEARCH_FOR,
    /** PayPal is behind or not set up: every number stops at `cutoffOf(today)` and says so. */
    partial: lab.is("paypal-behind") || lab.is("paypal-not-set-up"),
  };
}
export type PaymentsLab = ReturnType<typeof usePaymentsLab>;

/**
 * Why actions that write can't run right now, or null when they can: the admin session ended (admin_sessions), so
 * every RPC would fail with "Only admins can…". Words from Outbox and People.
 */
export function lockReason(lab: PaymentsLab["lab"], verb: string): string | null {
  return lab.sessionExpired ? `You've been signed out. Sign in again in another tab to ${verb}` : null;
}

/**
 * The demo data each data state stands for. The real page gets these shapes from the backend; the screen draws
 * them with no special cases (an empty range is just a range with no payments).
 */
export function labData(data: PaymentsData, lab: PaymentsLab["lab"]): PaymentsData {
  let d = data;
  if (lab.empty) return { ...d, people: [], payments: [] };
  const month = d.today.slice(0, 7);
  if (lab.is("range-empty")) {
    d = { ...d, payments: d.payments.filter((p) => p.paidAt.slice(0, 7) !== month) };
  }
  if (lab.is("paypal-behind") || lab.is("paypal-not-set-up")) {
    const cutoff = cutoffOf(d.today);
    d = { ...d, payments: d.payments.filter((p) => p.paidAt <= cutoff) };
  }
  if (lab.is("no-tiers")) d = { ...d, tiers: d.tiers.map((t) => ({ ...t, archived: true })) };
  if (lab.is("refunds")) {
    // A refund of an earlier payment, and a chargeback today big enough to take the day below zero.
    const here = d.payments.filter((p) => p.paidAt.slice(0, 7) === month && p.kind === "payment" && p.personId);
    const [first, second] = [here[2], here[here.length - 1]];
    const back: Payment[] = [];
    if (first) back.push({ ...first, id: `${first.id}-refund`, kind: "refund", chargeId: `${first.id}-refund`, amount: -first.amount, fee: 0, paidAt: shiftDay(first.paidAt, 3) });
    // Bigger than everything kept today, so today's column hangs below zero.
    const keptToday = d.payments.filter((p) => p.paidAt === d.today && p.kind !== "declined").reduce((t, p) => t + p.amount - p.fee, 0);
    if (second) back.push({ ...second, id: `${second.id}-reversal`, kind: "reversal", chargeId: `${second.id}-reversal`, amount: -Math.round(keptToday + 40), fee: 0, paidAt: d.today });
    d = { ...d, payments: [...d.payments, ...back].sort((a, b) => a.paidAt.localeCompare(b.paidAt)) };
  }
  if (lab.is("fees-missing")) {
    // PayPal sent the sale without its fee for the three latest payments; the fee arrives later.
    const latest = new Set(d.payments.filter((p) => p.kind === "payment").slice(-3).map((p) => p.id));
    d = { ...d, payments: d.payments.map((p) => (latest.has(p.id) ? { ...p, fee: NaN } : p)) };
  }
  if (lab.manyItems) {
    // 600 payments this month: paging, counts and totals that grow wide.
    const here = d.payments.filter((p) => p.paidAt.slice(0, 7) === month);
    const extra = Array.from({ length: Math.max(0, 600 - here.length) }, (_, i) => {
      const p = here[i % Math.max(1, here.length)];
      return p ? { ...p, id: `${p.id}-many-${i}` } : null;
    }).filter((p) => p !== null);
    d = { ...d, payments: [...d.payments, ...extra].sort((a, b) => a.paidAt.localeCompare(b.paidAt)) };
  }
  if (lab.partialData) {
    // Some payers were deleted, some have no name, an unmatched payment came without an email (payer_email is
    // nullable), and some payments have no tier: fallbacks, never blanks.
    const gone = new Set(d.people.slice(0, 3).map((p) => p.id));
    d = {
      ...d,
      people: d.people.filter((p) => !gone.has(p.id)).map((p, i) => (i < 2 ? { ...p, name: "" } : p)),
      payments: d.payments.map((p, i) => (!p.personId ? { ...p, payerEmail: "" } : i % 9 === 0 ? { ...p, tierId: null } : p)),
    };
  }
  if (lab.longText) {
    const long = "Maximilian Alexander Featherstonehaugh-Worthington";
    const lastPaymentId = d.payments.findLast((p) => p.kind === "payment")?.id;
    d = {
      ...d,
      tiers: d.tiers.map((t, i) => (i === 1 ? { ...t, name: "Supporter of the Community Food Programme" } : t)),
      sources: d.sources.map((s, i) => (i === 0 ? { ...s, name: "Spring open house at the Westside Community Centre, table by the door" } : s)),
      people: d.people.map((p, i) => (i < 4 ? { ...p, name: long, email: "maximilian.featherstonehaugh-worthington@example.org" } : p)),
      // The latest real payment (not a refund or chargeback, which are negative) gets a very large amount.
      payments: d.payments.map((p) => (p.id === lastPaymentId ? { ...p, amount: 123456.78, fee: 3580.54 } : p)),
    };
  }
  return d;
}

// ---------- retry ----------

/** A region that fails: Try again shows its loading state for a moment, then (with the lab still on) fails again. */
export function useRetry(failed: boolean) {
  const [pending, setPending] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  React.useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return {
    failed: failed && !pending,
    retrying: failed && pending,
    retry: () => {
      setPending(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPending(false), REFRESH_FOR);
    },
  };
}

/** Loading for `ms` after `key` changes (a new range), so the region shows its loaded content dimmed meanwhile. */
export function useRefreshing(key: string, ms: number) {
  return useLabDeferred(key, ms).pending;
}

// ---------- shared pieces ----------

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

export function TryAgain({ onClick, label = "Try again" }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" $variant="outline" $size="sm" onClick={onClick}>
      <Icon icon={RotateCw} size={16} />
      {label}
    </Button>
  );
}

const FailedLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: inherit;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  min-width: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const FailedText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-danger);
`;

/**
 * A small region that failed: the icon and one line in danger, Try again beside it. Sits in the region's own place.
 * `compact` (a number card, where the line must fit the value's own height): Try again as an icon button with a tooltip.
 */
export function RegionFailed({ text, onRetry, compact = false }: { text: string; onRetry: () => void; compact?: boolean }) {
  return (
    <FailedLine role="alert">
      <FailedText>
        <Icon icon={CircleAlert} size={16} />
        {text}
      </FailedText>
      {compact ? (
        <Tooltip content="Try again" pinOnClick={false}>
          <Button type="button" $variant="outline" $size="sm" aria-label="Try again" onClick={onRetry}>
            <Icon icon={RotateCw} size={16} />
          </Button>
        </Tooltip>
      ) : (
        <TryAgain onClick={onRetry} />
      )}
    </FailedLine>
  );
}

/** A list or tab body that failed: the kit EmptyState with the alert icon, in the body's own place. */
export function BlockFailed({ title, description, onRetry }: { title: string; description?: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <EmptyState icon={CircleAlert} title={title} description={description} action={<TryAgain onClick={onRetry} />} />
    </div>
  );
}

const breathe = keyframes`
  50% {
    opacity: 0.55;
  }
`;

/** A placeholder bar; breathes gently unless reduced motion is on (handled globally). */
export const SkeletonBar = styled.span<{ $width: string; $height?: string }>`
  display: block;
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height ?? "var(--space-3)"};
  border-radius: var(--radius-sm);
  background: var(--color-border);
  animation: ${breathe} 1.4s var(--ease) infinite;
`;

export const StillLoading = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/** How long a refresh or a retry shows its loading state in the demo (ms). */
export const REFRESH_FOR = 800;

export const STILL_LOADING = "Still loading. This is taking longer than usual.";
export { VisuallyHidden };

/** The hidden status for a loading region: "Loading payments", then the slow line. */
export function LoadingStatus({ label, slow }: { label: string; slow: boolean }) {
  return <VisuallyHidden role="status">{slow ? STILL_LOADING : label}</VisuallyHidden>;
}

// ---------- unavailable numbers ----------

const Dash = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: calc(var(--text-xl) * var(--leading-heading));
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: default;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/**
 * A number that can't be worked out: an em dash in the value's place, the reason on hover, focus or tap.
 * Screen readers hear "Not available" and the reason. Never 0, never NaN.
 */
export function Unavailable({ reason }: { reason: string }) {
  return (
    <Tooltip content={reason}>
      <Dash tabIndex={0} role="img" aria-label={`Not available. ${reason}`}>
        —
      </Dash>
    </Tooltip>
  );
}

// ---------- page notices ----------

const NoticeBox = styled.div<{ $tone: "info" | "warning" }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid ${({ $tone }) => ($tone === "info" ? "var(--color-info-border)" : "var(--color-warning-border)")};
  background: ${({ $tone }) => ($tone === "info" ? "var(--color-info-subtle)" : "var(--color-warning-subtle)")};
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const NoticeText = styled.span`
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;

  & > svg {
    flex-shrink: 0;
    margin-top: calc((var(--text-sm) * var(--leading-ui) - 16px) / 2);
  }
`;

function Notice({ tone, icon, children, action }: { tone: "info" | "warning"; icon: LucideIcon; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <NoticeBox $tone={tone}>
      <NoticeText>
        <Icon icon={icon} size={16} style={{ color: tone === "info" ? "var(--color-info)" : "var(--color-warning)" }} />
        <span>{children}</span>
      </NoticeText>
      {action}
    </NoticeBox>
  );
}

const Notices = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &:empty {
    display: none;
  }
`;

/*
 * The live region stays in the page so notices are announced when they appear. With nothing in it on a wide
 * screen it leaves the page flow, so it adds no second gap between the header and the tabs. Phones keep that space.
 */
const NoticeRegion = styled.div`
  @media (min-width: 768px) {
    &:has(> div:empty) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
`;

/**
 * The notices under the header: the session and PayPal. One persistent status region, so a change
 * is announced; nothing here is an error, so nothing is red.
 */
export function PageNotices({ lab, today }: { lab: PaymentsLab["lab"]; today: string }) {
  const cutoff = shortDay(cutoffOf(today));
  return (
    <NoticeRegion role="status">
      <Notices>
        {lab.sessionExpired && (
          <Notice tone="warning" icon={TriangleAlert}>
            You&apos;ve been signed out. Sign in again in another tab to make changes
          </Notice>
        )}
        {lab.is("paypal-not-set-up") ? (
          <Notice tone="warning" icon={TriangleAlert}>
            PayPal isn&apos;t set up, so payments after {cutoff} aren&apos;t here
          </Notice>
        ) : lab.is("paypal-behind") ? (
          <Notice tone="info" icon={Clock}>
            PayPal is behind. Payments after {cutoff} aren&apos;t here yet
          </Notice>
        ) : null}
      </Notices>
    </NoticeRegion>
  );
}

/** "Up to Nov 18": what a partial number or chart says about itself. */
export function upToText(today: string) {
  return `Up to ${shortDay(cutoffOf(today))}`;
}

// ---------- actions ----------

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const BusyWrap = styled(Button)`
  position: relative;
`;

const BusyLabel = styled.span<{ $hidden: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  /* Hidden by opacity, not visibility, so the button keeps its name for screen readers while it spins. */
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
`;

const Spinner = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;

/**
 * A submit button for demo actions: while `busy` it keeps its width, shows a spinner, says busy to screen readers and
 * ignores repeat clicks (the same look as the kit's SubmitButton, which needs a real server action).
 */
export function BusyButton({ busy, children, ...props }: React.ComponentProps<typeof Button> & { busy: boolean }) {
  return (
    <BusyWrap
      {...props}
      aria-busy={busy || undefined}
      aria-disabled={busy || props["aria-disabled"] || undefined}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        if (busy) event.preventDefault();
        else props.onClick?.(event);
      }}
    >
      <BusyLabel $hidden={busy}>{children}</BusyLabel>
      {busy && (
        <Spinner aria-hidden="true">
          <Icon icon={LoaderCircle} size={16} />
        </Spinner>
      )}
    </BusyWrap>
  );
}

export type AttemptError = "failed" | "conflict" | "validation" | "session";

/**
 * One save in a dialog: in flight for 5s with Saving on (a moment otherwise), then it fails, clashes or succeeds as
 * the lab says. A clash happens once: choosing a version settles it.
 */
export function useAttempt(lab: PaymentsLab["lab"], { validation = false }: { validation?: boolean } = {}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<AttemptError | null>(null);
  const settled = React.useRef(false);
  const timer = React.useRef<number | null>(null);
  React.useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function run(done: () => void, force = false) {
    if (busy) return;
    if (lab.sessionExpired) return setError("session");
    setBusy(true);
    setError(null);
    timer.current = window.setTimeout(
      () => {
        setBusy(false);
        if (lab.saveFailed) return setError("failed");
        if (validation && lab.validationError) return setError("validation");
        if (lab.conflict && !settled.current && !force) return setError("conflict");
        settled.current = true;
        done();
      },
      lab.saving ? SAVING_FOR : 300,
    );
  }
  return { busy, error, run, clear: () => setError(null), settle: () => (settled.current = true) };
}

const NoteBox = styled.div<{ $tone: "danger" | "warning" }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid ${({ $tone }) => ($tone === "danger" ? "var(--color-danger-border)" : "var(--color-warning-border)")};
  background: ${({ $tone }) => ($tone === "danger" ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)")};
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const NoteLine = styled.span`
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);

  & > svg {
    flex-shrink: 0;
    margin-top: calc((var(--text-sm) * var(--leading-ui) - 16px) / 2);
  }
`;

const NoteActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

/** A dialog's failure, above its buttons: what happened, that the input is kept, and the way out. */
export function DialogNote({ tone, children, actions }: { tone: "danger" | "warning"; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <NoteBox $tone={tone} role="alert">
      <NoteLine>
        <Icon icon={tone === "danger" ? CircleAlert : TriangleAlert} size={16} style={{ color: tone === "danger" ? "var(--color-danger)" : "var(--color-warning)" }} />
        <span>{children}</span>
      </NoteLine>
      {actions && <NoteActions>{actions}</NoteActions>}
    </NoteBox>
  );
}

/** The dialog copy for each failure, with the verb ("match", "save"). */
export function attemptText(error: AttemptError, verb: string) {
  switch (error) {
    case "failed":
      return `Couldn't ${verb}. Your changes are still here`;
    case "session":
      return "You've been signed out. Sign in again in another tab, then try again. Your changes are still here";
    default:
      return "";
  }
}

