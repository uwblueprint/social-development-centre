"use client";

import { styled } from "next-yak";
import { RefreshCw, WifiOff } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

/* Info, not danger: nothing is broken, changes just wait for a connection. Icon and words carry it, not the colour. */
const Banner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  border-bottom: 1px solid var(--color-info-border);
  background: var(--color-info-subtle);
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
  color: var(--color-info);
`;

/**
 * Shows while offline. The live region stays mounted so its text is announced once, when it appears
 * (a region that arrives with its text is often skipped).
 */
export function OfflineBanner({ offline, reconnecting = false }: { offline: boolean; reconnecting?: boolean }) {
  return (
    <div role="status">
      {offline && (
        <Banner>
          <IconBox>
            <Icon icon={WifiOff} size={16} />
          </IconBox>
          <span>You&apos;re offline. You can still look around, but you&apos;ll need to reconnect to make changes.</span>
        </Banner>
      )}
      {!offline && reconnecting && (
        <Banner>
          <IconBox>
            <Icon icon={RefreshCw} size={16} />
          </IconBox>
          <span>Back online. Catching up on changes…</span>
        </Banner>
      )}
    </div>
  );
}
