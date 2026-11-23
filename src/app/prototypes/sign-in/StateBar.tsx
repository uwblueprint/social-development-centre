"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { Tooltip } from "@/components/ui/Tooltip";
import { stateGroups, type StateId } from "./states";

const all = stateGroups.flatMap((group) =>
  group.states.map((state) => ({
    value: state.id as string,
    label: `${group.title}: ${state.label}`,
  })),
);

/** Prototype-only control pinned to the bottom: jump to any screen, or step through them in flow order. */
export function StateBar({
  current,
  onPick,
}: {
  current: StateId;
  onPick: (state: StateId) => void;
}) {
  const index = all.findIndex((option) => option.value === current);
  const step = (by: number) =>
    onPick(all[(index + by + all.length) % all.length].value as StateId);

  return (
    <Bar role="region" aria-label="Prototype screens">
      <Tooltip content="Previous screen">
        <Button
          type="button"
          $variant="ghost"
          onClick={() => step(-1)}
          aria-label="Previous screen"
        >
          <Icon icon={ChevronLeft} />
        </Button>
      </Tooltip>
      <Picker>
        <Select
          aria-label="Screen"
          options={all}
          value={current}
          onValueChange={(value) => onPick(value as StateId)}
        />
      </Picker>
      <Count>
        {index + 1} of {all.length}
      </Count>
      <Tooltip content="Next screen">
        <Button
          type="button"
          $variant="ghost"
          onClick={() => step(1)}
          aria-label="Next screen"
        >
          <Icon icon={ChevronRight} />
        </Button>
      </Tooltip>
    </Bar>
  );
}

const Bar = styled.div`
  position: fixed;
  left: 50%;
  bottom: var(--space-4);
  z-index: var(--z-nav);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: max-content;
  max-width: calc(100vw - 2 * var(--space-4));
  padding: var(--space-2);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
`;

const Picker = styled.div`
  width: var(--search-width);
  min-width: 0;
  flex: 1 1 auto;
`;

const Count = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  @media (max-width: 480px) {
    display: none;
  }
`;
