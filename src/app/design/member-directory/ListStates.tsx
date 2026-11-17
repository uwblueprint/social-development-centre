"use client";

import * as React from "react";
import { styled } from "next-yak";
import { CircleAlert, FileQuestion, Lock, RefreshCw, RotateCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useLabDelay } from "../_state-lab/useStateLab";
import { Skeleton } from "./SheetStates";

/* ---------- page-wide banner: offline, reconnecting, signed out ---------- */

/* Info, not danger: nothing is broken. The icon and the words carry it, not the colour. */
const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  border-bottom: 1px solid var(--color-info-border);
  background: var(--color-info-subtle);
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  @media (max-width: 767px) {
    padding-inline: var(--space-4);
  }
`;

const BannerIcon = styled.span`
  flex: none;
  display: flex;
  color: var(--color-info);
`;

const BannerText = styled.span`
  flex: 1;
  min-width: 0;
`;

/** The live region stays mounted so its text is announced when it appears. */
export function StatusBanner({
  offline,
  reconnecting,
  signedOut,
  onSignIn,
}: {
  offline: boolean;
  reconnecting: boolean;
  signedOut: boolean;
  onSignIn: () => void;
}) {
  return (
    <div role="status">
      {offline ? (
        <Banner>
          <BannerIcon>
            <Icon icon={WifiOff} size={16} />
          </BannerIcon>
          <BannerText>You&apos;re offline. You can still look around, but you&apos;ll need to reconnect to make changes.</BannerText>
        </Banner>
      ) : reconnecting ? (
        <Banner>
          <BannerIcon>
            <Icon icon={RefreshCw} size={16} />
          </BannerIcon>
          <BannerText>Back online. Catching up on changes…</BannerText>
        </Banner>
      ) : signedOut ? (
        <Banner>
          <BannerIcon>
            <Icon icon={Lock} size={16} />
          </BannerIcon>
          <BannerText>You&apos;ve been signed out. Sign in again to keep working. Nothing you&apos;ve entered is lost.</BannerText>
          <Button type="button" $variant="secondary" $size="sm" onClick={onSignIn}>
            Sign in again
          </Button>
        </Banner>
      ) : null}
    </div>
  );
}

/* ---------- loading ---------- */

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

/* Placeholder rows at the table's row rhythm, like PageLoading. */
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);

  &:not(:first-child) {
    border-top: 1px solid var(--color-border);
  }
`;

const Bar = styled.span<{ $width: string }>`
  display: block;
  height: var(--space-3);
  width: ${({ $width }) => $width};
  border-radius: var(--radius-sm);
  background: var(--color-surface);
`;

const Slow = styled.p`
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

/** The list while people load: placeholder rows, plus a reassurance once it's taking longer than usual. */
export function ListLoading({ takingLonger }: { takingLonger: boolean }) {
  return (
    <div aria-busy="true">
      <VisuallyHidden role="status">{takingLonger ? "Still loading. This is taking longer than usual." : "Loading"}</VisuallyHidden>
      {takingLonger && <Slow aria-hidden="true">Still loading. This is taking longer than usual.</Slow>}
      <Rows aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Row key={i}>
            <Bar $width="30%" />
            <Bar $width="35%" />
            <Bar $width="12%" />
            <Bar $width="15%" />
          </Row>
        ))}
      </Rows>
    </div>
  );
}

/* ---------- failed, not found, no permission ---------- */

const Alert = styled.div`
  display: contents;
`;

/** The list couldn't load. In the demo, Try again just shows the data. */
export function ListFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert role="alert">
      <EmptyState
        icon={CircleAlert}
        title="Couldn't load people"
        description="No changes were made. Try again, and if it keeps happening, tell an SDC admin."
        action={
          <Button type="button" $variant="secondary" onClick={onRetry}>
            <Icon icon={RotateCw} size={16} />
            Try again
          </Button>
        }
      />
    </Alert>
  );
}

/* Replaces the whole page when it can't be shown to this person. */
const Access = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-7) var(--space-5);
`;

export function AccessState({ kind }: { kind: "not-found" | "no-permission" }) {
  return (
    <Access>
      {kind === "not-found" ? (
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          description="This page doesn't exist or has moved. Use the sidebar to find what you need."
        />
      ) : (
        <EmptyState
          icon={Lock}
          title="You don't have access to People"
          description="Ask an SDC admin to give you access, then try again."
        />
      )}
    </Access>
  );
}

/* ---------- the Has tags filter's own failure ---------- */

const TagFailed = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

export function TagsFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <TagFailed role="alert">
      <Icon icon={CircleAlert} size={16} />
      <span>Couldn&apos;t load tags.</span>
      <Button type="button" $variant="ghost" $size="sm" onClick={onRetry}>
        Try again
      </Button>
    </TagFailed>
  );
}

/* ---------- a filter's options loading ---------- */

/** How long a filter's options "load" when its popover opens, while Slow loading is on (ms). */
const OPTIONS_LOAD_FOR = 800;

const OptionSkeletons = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const OptionSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--menu-row-height);
  padding: 0 var(--space-2);
`;

/**
 * A filter popover's editor. With Slow loading on, the options and counts come "from the server": 4 placeholder rows
 * for a moment, a polite "Loading options" for assistive tech, and aria-busy on the region. Otherwise it shows the editor at once.
 * It mounts with the popover's content, so every open loads again.
 */
export function FilterOptionsLoader({ slow, children }: { slow: boolean; children: React.ReactNode }) {
  const loading = useLabDelay(OPTIONS_LOAD_FOR, slow);
  return (
    <div aria-busy={loading || undefined}>
      <VisuallyHidden role="status">{loading ? "Loading options" : ""}</VisuallyHidden>
      {loading ? (
        <OptionSkeletons aria-hidden="true">
          {["55%", "40%", "65%", "35%"].map((width) => (
            <OptionSkeleton key={width}>
              <Skeleton $width="var(--space-4)" $height="var(--space-4)" />
              <Skeleton $width={width} $height="var(--space-4)" />
            </OptionSkeleton>
          ))}
        </OptionSkeletons>
      ) : (
        children
      )}
    </div>
  );
}
