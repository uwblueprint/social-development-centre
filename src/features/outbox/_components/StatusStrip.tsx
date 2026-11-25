"use client";

import { styled } from "next-yak";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/* Warning, not danger: the page works, the data is just old. The icon and the words carry it, not the colour.
   Same layout as OfflineBanner: padding, a --space-3 gap, the icon centred on the first line of text. */
const Strip = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  border-bottom: 1px solid var(--color-warning-border);
  background: var(--color-warning-subtle);
  color: var(--color-text);
  font-size: var(--text-sm);

  /* A whole-pixel line, so the icon's box and the first line of text share one height. */
  --line: 20px;
  line-height: var(--line);
`;

const IconBox = styled.span`
  flex: none;
  display: flex;
  align-items: center;
  height: var(--line);
  color: var(--color-warning);
`;

const Text = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

/* Outline on the yellow: a white button reads as a button there; grey fill didn't. Centred on the strip. */
const RefreshButton = styled(Button)`
  flex: none;
  align-self: center;
`;

/** Shown above the Outbox when its data is old (State lab Stale data). */
export function StaleStrip({ updated, onRefresh }: { updated: string; onRefresh: () => void }) {
  return (
    <Strip role="status">
      <IconBox>
        <Icon icon={Clock} size={16} />
      </IconBox>
      <Text>Last updated {updated}. Refresh to see the latest.</Text>
      <RefreshButton $variant="outline" $size="sm" onClick={onRefresh}>
        Refresh
      </RefreshButton>
    </Strip>
  );
}
