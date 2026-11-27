"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { LAST_DAY, longDate, monthTitle, plural, SEND_TIME, shortWeekdays, TODAY, type Send } from "./data";
import type { PanelMode } from "./RecipientsPanel";

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

const Head = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
`;

const HeadText = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const MonthNav = styled.div`
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const Month = styled.span`
  min-width: 124px;
  text-align: center;
  white-space: nowrap;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
`;

const Grid = styled.div`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow: hidden;
`;

const Week = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const Weekday = styled.div`
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  background: var(--color-surface);
`;

const cellBase = css`
  position: relative;
  min-height: 112px;
  padding: var(--space-2) var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  min-width: 0;
`;

const Cell = styled.div`
  ${cellBase}
  & + & {
    border-left: 1px solid var(--color-border);
  }
  &[data-out] {
    background: var(--color-surface);
  }
  &[data-old] {
    background: var(--color-bg-hover);
  }
  &[data-hidden] > * {
    visibility: hidden;
  }
`;

const CellButton = styled(ListRow)`
  ${cellBase}
  gap: var(--space-1);
  border-left: 1px solid var(--color-border);

  &:first-child {
    border-left: 0;
  }
  &[data-picked] {
    background: var(--color-bg-selected);
    box-shadow: inset 0 0 0 2px var(--color-text);
  }
  &[data-hover] {
    box-shadow: inset 0 0 0 2px var(--color-warning);
  }
`;

const DayNum = styled.span`
  min-width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-size: var(--text-sm);

  &[data-today] {
    border-radius: var(--radius-full);
    background: var(--color-text);
    color: var(--color-bg);
    font-weight: var(--weight-medium);
  }
  &[data-past] {
    color: var(--color-text-muted);
  }
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  height: 22px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: var(--color-bg-selected);
  color: var(--color-text);

  &[data-tone="strong"] {
    background: var(--color-text);
    color: var(--color-bg);
  }
  &[data-tone="review"] {
    background: var(--color-warning-subtle);
    color: var(--color-warning);
  }
  &[data-tone="danger"] {
    background: var(--color-danger-subtle);
    color: var(--color-danger);
  }
`;

const SentText = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Preview = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const dayIndex = (d: Date) => Math.round((d.getTime() - TODAY.getTime()) / 86_400_000);

interface Props {
  sends: Send[];
  pickedDay: number | null;
  hoverDay: number | null;
  onPickDay: (day: number, tab: PanelMode) => void;
}

export function OutboxCalendar({ sends, pickedDay, hoverDay, onPickDay }: Props) {
  const [month, setMonth] = React.useState(0);
  // Prototype only: preview today before or after the daily send.
  const [afterSend, setAfterSend] = React.useState(false);

  const live = sends.filter((s) => s.status !== "sent" && s.status !== "removed");
  // One month ahead at most; one month back only while something is overdue.
  const hasOverdue = live.some((s) => s.day < 0 && (s.status === "review" || s.status === "couldnt"));
  const minMonth = hasOverdue ? -1 : 0;
  const shownMonth = Math.max(minMonth, month);
  const base = new Date(TODAY.getFullYear(), TODAY.getMonth() + shownMonth, 1);
  const rangeStart = new Date(TODAY.getFullYear(), TODAY.getMonth() + minMonth, 1);
  const rangeEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 2, 0);

  const count = (pred: (s: Send) => boolean) => {
    const by = new Map<number, number>();
    for (const s of sends) if (pred(s)) by.set(s.day, (by.get(s.day) ?? 0) + 1);
    return by;
  };
  const scheduled = count((s) => s.status === "scheduled" || s.status === "pending");
  const review = count((s) => s.status === "review");
  const failed = count((s) => s.status === "couldnt");
  const sent = count((s) => s.status === "sent");

  const start = new Date(base);
  start.setDate(1 - base.getDay());
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const days = Array.from({ length: 7 }, (_, c) => {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7 + c);
      return d;
    });
    if (w >= 4 && !days.some((d) => d.getMonth() === base.getMonth())) break;
    weeks.push(days);
  }

  return (
    <Section aria-labelledby="outbox-calendar-title">
      <Head>
        <HeadText>
          <Title id="outbox-calendar-title">Scheduled</Title>
          <Hint>Outbox only shows emails 30 days in advance. Any emails past this time period are hidden.</Hint>
        </HeadText>
        <MonthNav>
          <Button
            $variant="ghost"
            $size="sm"
            aria-label="Previous month"
            disabled={shownMonth <= minMonth}
            onClick={() => setMonth(shownMonth - 1)}
          >
            <Icon icon={ChevronLeft} size={16} />
          </Button>
          <Month aria-live="polite">{monthTitle(base)}</Month>
          <Button $variant="ghost" $size="sm" aria-label="Next month" disabled={shownMonth >= 1} onClick={() => setMonth(shownMonth + 1)}>
            <Icon icon={ChevronRight} size={16} />
          </Button>
        </MonthNav>
      </Head>

      <Grid role="grid" aria-labelledby="outbox-calendar-title">
        <Week role="row">
          {shortWeekdays.map((w) => (
            <Weekday key={w.full} role="columnheader">
              <abbr title={w.full}>{w.short}</abbr>
            </Weekday>
          ))}
        </Week>
        {weeks.map((days) => (
          <Week key={days[0].toISOString()} role="row">
            {days.map((d) => {
              const n = dayIndex(d);
              const hidden = d < rangeStart || d > rangeEnd;
              const inMonth = d.getMonth() === base.getMonth();
              const today = n === 0;
              const sentToday = today && afterSend;
              let cnt = hidden ? 0 : scheduled.get(n) ?? 0;
              const rev = hidden ? 0 : review.get(n) ?? 0;
              const fail = hidden ? 0 : failed.get(n) ?? 0;
              let sentCount = !hidden && n <= 0 ? sent.get(n) ?? 0 : 0;
              if (sentToday) {
                sentCount += cnt;
                cnt = 0;
              }
              // Past days (and today after the send): anything that didn't go out is one "not sent" tag.
              const notSent = (n < 0 || sentToday) && rev + fail > 0;
              const clickable = !hidden && ((n >= 0 && n <= LAST_DAY && (cnt > 0 || rev > 0 || sentCount > 0)) || notSent);
              const content = (
                <>
                  <DayNum data-today={today ? "" : undefined} data-past={n < 0 ? "" : undefined}>
                    {hidden ? "" : d.getDate()}
                  </DayNum>
                  {cnt > 0 && <Pill data-tone={cnt >= 10 ? "strong" : undefined}>{plural(cnt, "email", "emails")}</Pill>}
                  {rev > 0 && !notSent && <Pill data-tone="review">{rev} to review</Pill>}
                  {notSent && <Pill data-tone="danger">{rev + fail} not sent</Pill>}
                  {sentCount > 0 && (!notSent || sentToday) && <SentText>{sentCount} sent</SentText>}
                </>
              );
              if (!clickable) {
                return (
                  <Cell
                    key={n}
                    role="gridcell"
                    data-out={!inMonth ? "" : undefined}
                    data-old={shownMonth < 0 ? "" : undefined}
                    data-hidden={hidden ? "" : undefined}
                  >
                    {content}
                  </Cell>
                );
              }
              const label = `${longDate(d)}${today ? ", today" : ""}: ${
                notSent ? `${rev + fail} not sent` : plural(cnt, "email", "emails") + (rev ? `, ${rev} to review` : "")
              }`;
              return (
                <CellButton
                  key={n}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  aria-selected={pickedDay === n}
                  data-picked={pickedDay === n ? "" : undefined}
                  data-hover={hoverDay === n ? "" : undefined}
                  onClick={() => onPickDay(n, notSent ? (rev > 0 ? "review" : "failed") : "all")}
                >
                  {content}
                </CellButton>
              );
            })}
          </Week>
        ))}
      </Grid>

      <Preview>
        <span id="outbox-preview-label">Prototype: preview today</span>
        <ToggleGroup
          type="single"
          aria-labelledby="outbox-preview-label"
          value={afterSend ? "after" : "before"}
          onValueChange={(v) => v && setAfterSend(v === "after")}
        >
          <ToggleGroupItem value="before">Before {SEND_TIME}</ToggleGroupItem>
          <ToggleGroupItem value="after">After {SEND_TIME}</ToggleGroupItem>
        </ToggleGroup>
        <span>Emails all send at {SEND_TIME}.</span>
      </Preview>
    </Section>
  );
}
