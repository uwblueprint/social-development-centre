"use client";

import { styled } from "next-yak";
import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { shortWeekdays } from "../_data";
import { SkeletonBlock } from "./Skeleton";

/*
 * What the calendar shows in place of its grid while it loads or can't load. It sits under the same
 * "Scheduled" title, and the loading grid has the real grid's shape (weekday row, five weeks) so nothing
 * jumps when the data arrives.
 */

const Frame = styled.div`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (min-width: 900px) {
    flex: 1;
  }
`;

const Week = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const DayWeek = styled(Week)`
  min-height: var(--calendar-day-min-height);

  @media (min-width: 900px) {
    flex: 1 0 var(--calendar-day-min-height);
  }
`;

const Weekday = styled.div`
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  background: var(--color-surface);
`;

const Cell = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);

  & + & {
    border-left: 1px solid var(--color-border);
  }
`;


const Note = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const WIDTHS = ["30%", "70%", "50%", "60%", "40%", "80%", "55%"];

interface CalendarStateProps {
  state: "loading" | "failed";
  /** Loading has gone on longer than expected: say so, visibly. */
  takingLonger: boolean;
  onRetry: () => void;
}

export function CalendarState({ state, takingLonger, onRetry }: CalendarStateProps) {
  if (state === "failed") {
    return (
      <Frame>
        <div role="alert">
          <EmptyState
            icon={CircleAlert}
            title="Couldn't load the calendar"
            description="Check your connection and try again."
            action={
              <Button $variant="outline" $size="sm" onClick={onRetry}>
                <Icon icon={RotateCw} size={16} />
                Try again
              </Button>
            }
          />
        </div>
      </Frame>
    );
  }
  return (
    <>
      <VisuallyHidden role="status">{takingLonger ? "Still loading. This is taking longer than usual." : "Loading the calendar"}</VisuallyHidden>
      {takingLonger && <Note aria-hidden="true">Still loading. This is taking longer than usual.</Note>}
      <Frame aria-busy="true" aria-hidden="true">
        <Week>
          {shortWeekdays.map((w) => (
            <Weekday key={w.full}>{w.short}</Weekday>
          ))}
        </Week>
        {[0, 1, 2, 3, 4].map((w) => (
          <DayWeek key={w}>
            {[0, 1, 2, 3, 4, 5, 6].map((c) => (
              <Cell key={c}>
                <SkeletonBlock $width="20%" />
                {(w + c) % 3 !== 0 && <SkeletonBlock $width={WIDTHS[(w * 3 + c) % 7]} />}
              </Cell>
            ))}
          </DayWeek>
        ))}
      </Frame>
    </>
  );
}
