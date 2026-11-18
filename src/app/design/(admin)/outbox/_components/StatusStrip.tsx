"use client";

import { styled } from "next-yak";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/* Warning, not danger: the page works, the data is just old. The icon and the words carry it, not the colour. */
const Strip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-2) var(--space-6);
  border-bottom: 1px solid var(--color-warning-border);
  background: var(--color-warning-subtle);
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
`;

const Text = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  flex: 1 1 auto;

  & svg {
    flex: none;
    color: var(--color-warning);
  }
`;

/** Shown above the Outbox when its data is old (State lab Stale data). */
export function StaleStrip({ updated, onRefresh }: { updated: string; onRefresh: () => void }) {
  return (
    <Strip role="status">
      <Text>
        <Icon icon={Clock} size={16} />
        <span>Last updated {updated}. Refresh to see the latest.</span>
      </Text>
      <Button $variant="outline" $size="sm" onClick={onRefresh}>
        Refresh
      </Button>
    </Strip>
  );
}
