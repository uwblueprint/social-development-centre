"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { Tooltip, TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/Tooltip";
import { TruncatedText } from "@/components/ui/TruncatedText";
import {
  feesMissing,
  formatCount,
  formatMoney,
  inPeriodText,
  kept,
  keptSeries,
  tierEarnedRows,
  paymentsIn,
  periodText,
  sourceRows,
  unitOf,
  type Bucket,
  type PaymentsData,
  type Period,
  type Range,
  type Unit,
} from "./data";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { BoxCard, csvFile, Refreshing, saveFile } from "./parts";
import { lockReason, RegionFailed, SkeletonBar, STILL_LOADING, upToText, useRetry, type PaymentsLab } from "./states";

/*
 * The Overview's chart cards. Each is one boxed card: a title, a muted line that says what the chart shows and
 * for when (so a screenshot describes itself), a download button for the chart's own spreadsheet, and the chart.
 * Bars are neutral; the one to notice (the period still filling up) is SDC green.
 *
 * Axes follow common chart guidance (Datawrapper, ONS, IBM Carbon, EU data visualisation guide): columns start at
 * zero; 3 to 6 ticks at round, whole intervals; money ticks carry "$"; date labels name the month ("Nov 1",
 * "Jan 2026") so each reads on its own; values are printed beside horizontal bars; gridlines stay faint.
 */

// ---------- the card ----------

const ChartBox = styled(BoxCard)<{ $wide: boolean }>`
  grid-column: ${({ $wide }) => ($wide ? "1 / -1" : "auto")};
`;

const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
`;

const HeadText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

const Takeaway = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

/* The muted line keeps its height while the card loads or fails, so the chart below never moves. */
const TakeawaySlot = styled.div`
  display: flex;
  align-items: center;
  min-height: calc(var(--text-sm) * var(--leading-ui));
`;

/* As tall as the title's line, so the button centres on it; the button's padding hangs past the inset so its icon ends on it. */
const ActionSlot = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: calc(var(--text-md) * var(--leading-heading));
  margin-inline-end: calc(var(--space-3) * -1);
`;

/* The plot, the gap and padding around it, and one line of labels: a card's loading and empty states keep this height. */
/* Plus the two axis titles, each a line of small text and a gap. */
const BODY = "calc(var(--space-8) * 3.75 + var(--space-2) * 4 + var(--text-xs) * var(--leading-ui) * 3)";
const BODY_PHONE = "calc(var(--space-8) * 3.125 + var(--space-2) * 4 + var(--text-xs) * var(--leading-ui) * 3)";

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${BODY};
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  color: var(--color-text-muted);

  @media (max-width: 767px) {
    height: ${BODY_PHONE};
  }
`;

const Empty = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${BODY};
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;

  @media (max-width: 767px) {
    height: ${BODY_PHONE};
  }
`;

/* A failed chart keeps the chart's height, the message in the middle. */
const FailedBody = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${BODY};

  @media (max-width: 767px) {
    height: ${BODY_PHONE};
  }
`;

interface Sheet {
  /** File name without the extension, e.g. "potluck-earned-2026-11". */
  name: string;
  rows: (string | number)[][];
}

/** What a chart card's body is showing. */
type CardState = "loading" | "failed" | "ready";

function ChartCard({
  title,
  takeaway,
  wide = false,
  sheet,
  period,
  state,
  refreshing,
  pl,
  children,
}: {
  title: string;
  takeaway: string;
  wide?: boolean;
  sheet: () => Sheet;
  period: Period;
  state: CardState;
  refreshing: boolean;
  pl: PaymentsLab;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  function download() {
    const { name, rows } = sheet();
    saveFile(`${name}.csv`, csvFile(rows));
    toast({ title: `Downloaded ${title} for ${period ? periodText(period) : "all time"}` });
  }
  const locked = lockReason(pl.lab, "download");
  const button = (
    <Button
      type="button"
      $variant="ghost"
      $size="sm"
      aria-label={`Download ${title} as a spreadsheet`}
      disabled={locked !== null}
      onClick={download}
    >
      <Icon icon={Download} size={16} />
    </Button>
  );
  return (
    <ChartBox $wide={wide} data-card="chart" aria-busy={state === "loading" || refreshing || undefined}>
      {refreshing && state === "ready" && <Refreshing />}
      <CardHead>
        <HeadText>
          <Title>{title}</Title>
          <TakeawaySlot>
            {state === "loading" ? (
              <SkeletonBar $width="calc(var(--space-8) * 4)" aria-hidden="true" />
            ) : state === "ready" ? (
              <Takeaway>{takeaway}</Takeaway>
            ) : null}
          </TakeawaySlot>
        </HeadText>
        {/* Nothing to download until the chart has loaded. */}
        {state === "ready" && (
          <ActionSlot>
            {locked ? (
              <DisabledReason reason={locked}>{button}</DisabledReason>
            ) : (
              <Tooltip content="Download spreadsheet" pinOnClick={false}>
                {button}
              </Tooltip>
            )}
          </ActionSlot>
        )}
      </CardHead>
      {children}
    </ChartBox>
  );
}

/** The card's body while it loads or after it failed, at the chart's own height. */
function CardBody({ state, label, failed, onRetry, slow }: { state: CardState; label: string; failed: string; onRetry: () => void; slow: boolean }) {
  if (state === "loading")
    return (
      <Placeholder role="status" aria-label={slow ? STILL_LOADING : label}>
        {slow && <span aria-hidden="true">{STILL_LOADING}</span>}
      </Placeholder>
    );
  return (
    <FailedBody>
      <RegionFailed text={failed} onRetry={onRetry} />
    </FailedBody>
  );
}

/** "potluck-earned-2026-11", "potluck-earned-2026-01-to-2026-03", "potluck-earned-all-time". */
function fileName(slug: string, period: Period) {
  const span = !period ? "all-time" : period.from === period.to ? period.from : `${period.from}-to-${period.to}`;
  return `potluck-${slug}-${span}`;
}

const UNIT_HEADER: Record<Unit, string> = { day: "Day", month: "Month", year: "Year" };

// ---------- the column chart ----------

/* The y-axis title, the axis and the plot, the date labels, then the x-axis title. The tick labels start on the card's left edge. */
const Figure = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: var(--space-7) minmax(0, 1fr);
  column-gap: var(--space-2);
  row-gap: var(--space-2);
  padding-top: var(--space-2);
  min-width: 0;
`;

/* Tick labels sit in one column starting on the card's left edge, each centred on its gridline. */
const Axis = styled.div`
  grid-column: 1;
  position: relative;
  font-size: var(--text-xs);
  line-height: var(--leading-none);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;

  & > span {
    position: absolute;
    left: 0;
    transform: translateY(50%);
    white-space: nowrap;
  }
`;

/* An axis title: small and muted, like the tick labels. The y title sits above the tick labels; the x title is centred under the plot. */
const AxisTitle = styled.span<{ $x?: boolean }>`
  grid-column: ${({ $x }) => ($x ? "2" : "1 / -1")};
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  text-align: ${({ $x }) => ($x ? "center" : "left")};
  /* The top tick label is centred on the top gridline, so it rises half a line into the gap above it. */
  margin-bottom: ${({ $x }) => ($x ? "0" : "var(--space-1)")};
`;

const Plot = styled.div`
  grid-column: 2;
  position: relative;
  height: calc(var(--space-8) * 3.75);
  display: flex;
  align-items: flex-end;
  gap: calc(var(--space-1) / 2);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  @media (max-width: 767px) {
    height: calc(var(--space-8) * 3.125);
  }
`;

/* A faint line across the plot at each tick; the one at zero is the baseline and a little stronger. */
const Gridline = styled.span<{ $at: number; $base: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: ${({ $at }) => `${$at}%`};
  transform: translateY(50%);
  border-top: 1px solid ${({ $base }) => ($base ? "var(--color-border-strong)" : "var(--color-border)")};
  pointer-events: none;
`;

const Column = styled.div<{ $active: boolean; $pick: boolean }>`
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  height: 100%;
  max-width: calc(var(--space-8) * 1.5);
  margin-inline: auto;
  border-radius: var(--radius-sm);
  cursor: ${({ $pick }) => ($pick ? "pointer" : "default")};
  background: ${({ $active }) => ($active ? "var(--color-bg-hover)" : "transparent")};
  transition: background var(--duration-fast) var(--ease-out);
`;

type Tone = "neutral" | "highlight";
const TONE: Record<Tone, string> = {
  neutral: "var(--chart-neutral)",
  highlight: "var(--chart-highlight)",
};

/* Bars rise from the baseline with a rounded top. */
const Bar = styled.span<{ $tone: Tone; $below?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  border-radius: ${({ $below }) => ($below ? "0 0 var(--radius-sm) var(--radius-sm)" : "var(--radius-sm) var(--radius-sm) 0 0")};
  background: ${({ $tone }) => TONE[$tone]};
`;

const Labels = styled.div`
  grid-column: 2;
  display: flex;
  gap: calc(var(--space-1) / 2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: var(--leading-ui);

  & > span {
    flex: 1 1 0;
    min-width: 0;
    max-width: calc(var(--space-8) * 1.5);
    margin-inline: auto;
    /* Flex centres a label wider than its column on the column, overflowing both sides; text-align would push it right. */
    display: flex;
    justify-content: center;
    white-space: nowrap;
  }

  /* More than a year of months, or a phone: every third month, so labels never run together. */
  &[data-many] > span[data-minor] {
    visibility: hidden;
  }
  @media (max-width: 767px) {
    & > span[data-minor] {
      visibility: hidden;
    }
  }
`;

/* Visually hidden, for screen readers. The wrapper clips it: a table grows to fit its text whatever its width. */
const HiddenBox = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

function HiddenTable({ children }: { children: React.ReactNode }) {
  return (
    <HiddenBox>
      <table>{children}</table>
    </HiddenBox>
  );
}

const LiveText = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/* A whole, round step (1, 2, 5, 10, 20, 50 …) that gives about four intervals over `span`. */
function niceStep(span: number) {
  const target = Math.max(span, 1) / 4;
  const power = 10 ** Math.floor(Math.log10(target));
  const step = [1, 2, 5, 10].map((m) => m * power).find((x) => x >= target) ?? 10 * power;
  return Math.max(1, step);
}

interface Col extends Bucket {
  future: boolean;
  value: number;
}

/**
 * Columns per day, month or year (the range decides). Hover, tap or arrow keys pick a column and a tooltip
 * reads it out; with `onPick`, a click or Enter opens that column's payments. The table underneath is the same
 * data for screen readers.
 */
function ColumnChart({
  name,
  unit,
  cols,
  tick,
  reading,
  table,
  tone,
  onPick,
}: {
  name: string;
  unit: Unit;
  cols: Col[];
  tick: (v: number) => string;
  reading: (c: Col) => string;
  table: { headers: string[]; cells: (c: Col) => string[] };
  tone: (c: Col) => Tone;
  onPick?: (bucket: Bucket) => void;
}) {
  const currentIndex = cols.findIndex((c) => c.current);
  const resting = Math.max(0, currentIndex >= 0 ? currentIndex : cols.findLastIndex((c) => !c.future));
  const [active, setActive] = React.useState<number | null>(null);
  // Days: every 7th, and none in the last three columns so the final label never runs off the plot.
  // Months: all of them up to a year; beyond that every third (each January keeps its year).
  const showLabel = (i: number) => (unit === "day" ? i % 7 === 0 && i < cols.length - 3 : true);
  const minor = (i: number) => unit === "month" && i % 3 !== 0;
  const picks = !!onPick;

  const shown = cols.filter((c) => !c.future);
  const top = Math.max(...shown.map((c) => c.value), 0);
  // Refunds and chargebacks can take a day below zero: the scale then starts at a round step under it.
  const bottom = Math.min(...shown.map((c) => c.value), 0);
  const step = niceStep(top - bottom);
  const hi = Math.max(2 * step, Math.ceil(top / step) * step);
  const lo = bottom < 0 ? Math.floor(bottom / step) * step : 0;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;

  function onKeyDown(event: React.KeyboardEvent) {
    const last = cols.findLastIndex((c) => !c.future);
    const now = active ?? resting;
    const next =
      active === null && (event.key === "ArrowRight" || event.key === "ArrowLeft")
        ? resting
        : event.key === "ArrowRight"
          ? Math.min(now + 1, last)
          : event.key === "ArrowLeft"
            ? Math.max(now - 1, 0)
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? last
                : null;
    if (next === null) {
      if (picks && (event.key === "Enter" || event.key === " ") && active !== null && !cols[active]?.future) {
        event.preventDefault();
        onPick?.(cols[active]);
      }
      return;
    }
    event.preventDefault();
    setActive(next);
  }

  const spoken = active !== null && cols[active] && !cols[active].future ? reading(cols[active]) : "";

  return (
    <Figure data-chart="">
      <LiveText aria-live="polite">{spoken}</LiveText>
      <AxisTitle aria-hidden="true">{name} ($)</AxisTitle>
      <Axis aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} style={{ bottom: `${pct(t)}%` }}>
            {tick(t)}
          </span>
        ))}
      </Axis>
      <Plot
        role="group"
        aria-label={`${name} each ${unit}. Use the arrow keys to read each ${unit}.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <Gridline key={t} aria-hidden="true" $at={pct(t)} $base={t === 0} />
        ))}
        {cols.map((c, i) => {
          const column = (
            <Column
              key={c.key}
              $active={active === i}
              $pick={picks && !c.future}
              aria-hidden="true"
              onPointerDown={() => !c.future && setActive(i)}
              onClick={() => picks && !c.future && onPick?.(c)}
            >
              {!c.future && c.value > 0 && <Bar $tone={tone(c)} style={{ bottom: `${pct(0)}%`, height: `${pct(c.value) - pct(0)}%` }} />}
              {!c.future && c.value < 0 && <Bar $tone={tone(c)} $below style={{ bottom: `${pct(c.value)}%`, height: `${pct(0) - pct(c.value)}%` }} />}
            </Column>
          );
          if (c.future) return column;
          return (
            <TooltipRoot
              key={c.key}
              open={active === i}
              disableHoverableContent
              onOpenChange={(next) => setActive((now) => (next ? i : now === i ? null : now))}
            >
              <TooltipTrigger asChild>{column}</TooltipTrigger>
              <TooltipContent side="top" motion="none">
                {reading(c)}
              </TooltipContent>
            </TooltipRoot>
          );
        })}
      </Plot>
      <Labels aria-hidden="true" data-many={cols.length > 12 ? "" : undefined}>
        {cols.map((c, i) => (
          <span key={c.key} data-minor={minor(i) ? "" : undefined}>
            {showLabel(i) ? c.label : ""}
          </span>
        ))}
      </Labels>
      <AxisTitle aria-hidden="true" $x>
        {UNIT_HEADER[unit]}
      </AxisTitle>
      <HiddenTable>
        <caption>
          {name} each {unit}
        </caption>
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={h || i} scope="col">
                {i === 0 ? UNIT_HEADER[unit] : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((c) => {
            const [first, ...rest] = table.cells(c);
            return (
              <tr key={c.key}>
                <th scope="row">{first}</th>
                {rest.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </HiddenTable>
    </Figure>
  );
}

/** Why a chart of what SDC kept can't be drawn: PayPal hasn't sent some fees yet (payments.fee_cents is null). */
function noFeeText(data: PaymentsData, current: Range) {
  const n = feesMissing(paymentsIn(data, current));
  return `PayPal hasn't sent the fee for ${formatCount(n)} ${n === 1 ? "payment" : "payments"} yet`;
}

/** "$0", "$300", "$1.5k", "$40k"; below zero (refunds, chargebacks) "-$50". */
const moneyTick = (v: number): string => (v < 0 ? `-${moneyTick(-v)}` : v >= 1000 ? `$${+(v / 1000).toFixed(1)}k` : `$${v}`);

// ---------- the three cards ----------

interface CardProps {
  data: PaymentsData;
  period: Period;
  current: Range;
  ready: boolean;
  pl: PaymentsLab;
  refreshing: boolean;
}

export function EarnedCard({ data, period, current, ready, pl, refreshing, onPick }: CardProps & { onPick: (bucket: Bucket) => void }) {
  const failure = useRetry(pl.lab.is("charts-failed"));
  const state: CardState = !ready || failure.retrying ? "loading" : failure.failed ? "failed" : "ready";
  // PayPal is behind: the range's last days are missing, and the card says up to when.
  const upTo = pl.partial && current.to >= data.today ? `, u${upToText(data.today).slice(1)}` : "";
  const unit = unitOf(period);
  const cols = React.useMemo(() => keptSeries(data, period), [data, period]);
  const total = kept(paymentsIn(data, current));
  const soFar = period !== null && current.to === data.today;
  const when = inPeriodText(period, data);
  const empty = cols.every((c) => c.future || c.value === 0);
  const broken = !Number.isFinite(total) || cols.some((c) => !Number.isFinite(c.value));
  return (
    <ChartCard
      title="Earned"
      takeaway={broken ? `Not available ${when}` : `${formatMoney(total)} ${soFar ? "so far " : ""}${when}${upTo}`}
      wide
      period={period}
      state={state}
      refreshing={refreshing}
      pl={pl}
      sheet={() => ({
        name: fileName("earned", period),
        rows: [[UNIT_HEADER[unit], "Earned (CAD)", "Complete"], ...cols.filter((c) => !c.future).map((c) => [c.key, c.value.toFixed(2), c.current ? "No, so far" : "Yes"])],
      })}
    >
      {state !== "ready" ? (
        <CardBody state={state} label="Loading Earned" failed="Couldn't load Earned" onRetry={failure.retry} slow={pl.takingLonger} />
      ) : broken ? (
        <Empty>{noFeeText(data, current)}</Empty>
      ) : empty ? (
        <Empty>No payments {when}</Empty>
      ) : (
        <ColumnChart
          name="Earned"
          unit={unit}
          cols={cols}
          tick={moneyTick}
          tone={(c) => (c.current ? "highlight" : "neutral")}
          reading={(c) => `${c.title}: ${formatMoney(c.value)}${c.current ? " so far" : ""}`}
          table={{ headers: ["", "Earned"], cells: (c) => [c.title, `${formatMoney(c.value)}${c.current ? " so far" : ""}`] }}
          onPick={onPick}
        />
      )}
    </ChartCard>
  );
}

const Rows = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

/* The link's name on its own line, the bar and its amount under it: long names get the card's full width. */
const Row = styled.li`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const BarLine = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--text-xs);
  color: var(--color-text);
  font-variant-numeric: tabular-nums;

  /* The amount (and share) never wraps under its bar. */
  & > span:last-child {
    flex-shrink: 0;
    white-space: nowrap;
  }
`;

/* The longest bar stops short of the edge so its amount always fits after it. */
const HBar = styled.span`
  flex: 0 0 auto;
  height: var(--space-2);
  min-width: 2px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--chart-neutral);
`;

/**
 * Money kept in the range by the signup link each payer joined through. Every payment in the range counts, so the
 * bars add up to Raised; unmatched payments are under "No link", sorted with the rest.
 */
export function SourcesCard({ data, period, current, ready, pl, refreshing, wide = false }: CardProps & { wide?: boolean }) {
  const failure = useRetry(pl.lab.is("charts-failed"));
  const upTo = pl.partial && current.to >= data.today ? `, u${upToText(data.today).slice(1)}` : "";
  const state: CardState = !ready || failure.retrying ? "loading" : failure.failed ? "failed" : "ready";
  const rows = React.useMemo(() => sourceRows(data, current), [data, current]);
  const total = rows.reduce((t, r) => t + r.raised, 0);
  const linked = rows.filter((r) => r.key !== "none").reduce((t, r) => t + r.raised, 0);
  const links = rows.reduce((t, r) => t + r.links, 0);
  const max = Math.max(...rows.map((r) => r.raised), 1);
  const broken = !Number.isFinite(total);
  const when = inPeriodText(period, data);
  const takeaway = broken
    ? `Not available ${when}`
    : links === 0
      ? `None through signup links ${when}`
      : `${formatMoney(linked)} from ${formatCount(links)} ${links === 1 ? "link" : "links"} ${when}${upTo}`;
  return (
    <ChartCard
      title="Raised by signup link"
      takeaway={takeaway}
      wide={wide}
      period={period}
      state={state}
      refreshing={refreshing}
      pl={pl}
      sheet={() => ({
        name: fileName("raised-by-signup-link", period),
        rows: [["Signup link", "Raised (CAD)"], ...rows.map((r) => [r.name, r.raised.toFixed(2)])],
      })}
    >
      {state !== "ready" ? (
        <CardBody state={state} label="Loading Raised by signup link" failed="Couldn't load signup links" onRetry={failure.retry} slow={pl.takingLonger} />
      ) : broken ? (
        <Empty>{noFeeText(data, current)}</Empty>
      ) : total === 0 ? (
        <Empty>No payments {when}</Empty>
      ) : (
        <>
          <Rows aria-hidden="true">
            {rows.map((r) => (
              <Row key={r.key}>
                <TruncatedText tooltip>{r.name}</TruncatedText>
                <BarLine>
                  <HBar style={{ width: `calc((100% - var(--space-8)) * ${Math.max(0, r.raised) / max})` }} />
                  <span>{formatMoney(r.raised)}</span>
                </BarLine>
              </Row>
            ))}
          </Rows>
          <HiddenTable>
            <caption>
              Raised by signup link {when}. Together {formatMoney(total)}, the same as Raised
            </caption>
            <thead>
              <tr>
                <th scope="col">Signup link</th>
                <th scope="col">Raised</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{r.name}</th>
                  <td>{formatMoney(r.raised)}</td>
                </tr>
              ))}
            </tbody>
          </HiddenTable>
        </>
      )}
    </ChartCard>
  );
}

/** "35%", or "<1%" for a sliver that would round to a misleading 0%. */
const shareText = (part: number, total: number) => {
  const pct = (part / total) * 100;
  return pct > 0 && pct < 0.5 ? "<1%" : `${Math.round(pct)}%`;
};

const Share = styled.span`
  color: var(--color-text-muted);
`;

/* A tier name and its cost on one line: the name truncates, the cost never does. */
const NameLine = styled.span`
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  min-width: 0;
`;

const Cost = styled.span`
  flex-shrink: 0;
  white-space: nowrap;
  color: var(--color-text-muted);
`;

/**
 * Money kept in the range by the tier on each payment, from most to least. A tier's id is its identity: a rename shows the new name and a cost change doesn't split the bar.
 */
export function TierEarnedCard({ data, period, current, ready, pl, refreshing, wide = false }: CardProps & { wide?: boolean }) {
  const failure = useRetry(pl.lab.is("charts-failed"));
  const upTo = pl.partial && current.to >= data.today ? `, u${upToText(data.today).slice(1)}` : "";
  const state: CardState = !ready || failure.retrying ? "loading" : failure.failed ? "failed" : "ready";
  const rows = React.useMemo(() => tierEarnedRows(data, current), [data, current]);
  const total = rows.reduce((t, r) => t + r.raised, 0);
  const max = Math.max(...rows.map((r) => r.raised), 1);
  const most = rows.filter((r) => r.key !== "none" && r.key !== "gifted").reduce<(typeof rows)[number] | null>((best, r) => (!best || r.raised > best.raised ? r : best), null);
  const broken = !Number.isFinite(total);
  const when = inPeriodText(period, data);
  const takeaway = broken
    ? `Not available ${when}`
    : !most || most.raised === 0
      ? `Nothing from tiers ${when}`
      : `Most from ${most.name}: ${formatMoney(most.raised)} of ${formatMoney(total)} ${when}${upTo}`;
  return (
    <ChartCard
      title="Earned by tier"
      takeaway={takeaway}
      wide={wide}
      period={period}
      state={state}
      refreshing={refreshing}
      pl={pl}
      sheet={() => ({
        name: fileName("earned-by-tier", period),
        rows: [["Tier", "Cost", "Earned (CAD)", "Share of total"], ...rows.map((r) => [r.name, r.cost, r.raised.toFixed(2), shareText(r.raised, total)])],
      })}
    >
      {state !== "ready" ? (
        <CardBody state={state} label="Loading Earned by tier" failed="Couldn't load Earned by tier" onRetry={failure.retry} slow={pl.takingLonger} />
      ) : broken ? (
        <Empty>{noFeeText(data, current)}</Empty>
      ) : total === 0 ? (
        <Empty>No payments {when}</Empty>
      ) : (
        <>
          <Rows aria-hidden="true">
            {rows.map((r) => (
              <Row key={r.key}>
                <NameLine>
                  <TruncatedText tooltip>{r.name}</TruncatedText>
                  {r.cost && <Cost>({r.cost})</Cost>}
                </NameLine>
                <BarLine>
                  {/* Room after the longest bar for "$1,234 · 35%". */}
                  <HBar style={{ width: `calc((100% - var(--space-8) * 1.75) * ${Math.max(0, r.raised) / max})` }} />
                  <span>
                    {formatMoney(r.raised)} <Share>· {shareText(r.raised, total)}</Share>
                  </span>
                </BarLine>
              </Row>
            ))}
          </Rows>
          <HiddenTable>
            <caption>
              Earned by tier {when}. Together {formatMoney(total)}, the same as Earned
            </caption>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Cost</th>
                <th scope="col">Earned</th>
                <th scope="col">Share of total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{r.name}</th>
                  <td>{r.cost || "–"}</td>
                  <td>{formatMoney(r.raised)}</td>
                  <td>{shareText(r.raised, total)}</td>
                </tr>
              ))}
            </tbody>
          </HiddenTable>
        </>
      )}
    </ChartCard>
  );
}
