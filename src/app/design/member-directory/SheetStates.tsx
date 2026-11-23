"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { CircleAlert, RefreshCw, TriangleAlert, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/*
 * Pieces for the member panel's State lab states: loading placeholders, a section that failed, and banners.
 * Everything here is tokens only; state is always icon + words, never colour alone.
 */

const breathe = keyframes`
  50% {
    opacity: 0.45;
  }
`;

/** A placeholder in the shape of what's coming. Hidden from assistive tech; the caller announces the loading once. */
export const Skeleton = styled.span<{ $width?: string; $height?: string }>`
  display: block;
  flex: none;
  max-width: 100%;
  width: ${({ $width }) => $width ?? "100%"};
  height: ${({ $height }) => $height ?? "var(--space-3)"};
  border-radius: var(--radius-sm);
  background: var(--color-border);
  animation: ${breathe} calc(var(--duration-slow) * 6) ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Text for assistive tech only: a polite status like "Loading email". Needs a positioned ancestor to clip against; it is clipped to nothing either way. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const Lines = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/** A few skeleton lines for a section body, with the "taking longer" note after the slow-loading delay. */
export function SectionSkeleton({ lines = 2, takingLonger = false }: { lines?: number; takingLonger?: boolean }) {
  return (
    <Lines>
      <Lines aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} $width={i === lines - 1 ? "60%" : "100%"} />
        ))}
      </Lines>
      {takingLonger && <Note role="status">Still loading. This is taking longer than usual.</Note>}
    </Lines>
  );
}

const Note = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const Alert = styled.div<{ $tone: "danger" | "warning" | "info" }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid ${({ $tone }) => `var(--color-${$tone}-border)`};
  border-radius: var(--radius-md);
  background: ${({ $tone }) => `var(--color-${$tone}-subtle)`};
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;

  /* The title reads at the kit's heading weight; nothing is bolder than medium. */
  & strong {
    font-weight: var(--weight-medium);
  }
`;

/* One line tall, so the icon centres on the message's first line. */
const AlertIcon = styled.span<{ $tone: "danger" | "warning" | "info" }>`
  flex: none;
  display: inline-flex;
  align-items: center;
  height: 1lh;
  color: ${({ $tone }) => `var(--color-${$tone})`};
`;

const AlertBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
`;

const AlertActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

export interface AlertAction {
  label: string;
  onClick: () => void;
}

/** A message with an optional title and actions. Errors are announced (role="alert"); the rest are polite. */
export function InlineAlert({
  tone = "danger",
  title,
  children,
  actions,
  icon,
}: {
  tone?: "danger" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  actions?: AlertAction[];
  icon?: React.ComponentProps<typeof Icon>["icon"];
}) {
  return (
    <Alert $tone={tone} role={tone === "danger" ? "alert" : "status"}>
      <AlertIcon $tone={tone}>
        <Icon icon={icon ?? (tone === "danger" ? CircleAlert : TriangleAlert)} />
      </AlertIcon>
      <AlertBody>
        <div>
          {title && <strong>{title} </strong>}
          {children}
        </div>
        {actions && (
          <AlertActions>
            {actions.map((a) => (
              /* Outline on red: a grey secondary fill lacks contrast against the danger background. */
              <Button key={a.label} type="button" $variant={tone === "danger" ? "outline" : "secondary"} $size="sm" onClick={a.onClick}>
                {a.label}
              </Button>
            ))}
          </AlertActions>
        )}
      </AlertBody>
    </Alert>
  );
}

/** Try again in place: shows "Trying again…" for a moment, then the section fails again while the flag is on. */
export function useRetry(ms = 800) {
  const [retrying, setRetrying] = React.useState(false);
  React.useEffect(() => {
    if (!retrying) return;
    const id = window.setTimeout(() => setRetrying(false), ms);
    return () => window.clearTimeout(id);
  }, [retrying, ms]);
  return { retrying, retry: () => setRetrying(true) };
}

/** One section that couldn't load, with Try again. */
export function SectionFailed({ title, children }: { title: string; children: React.ReactNode }) {
  const { retrying, retry } = useRetry();
  if (retrying) return <SectionSkeleton lines={2} />;
  return (
    <InlineAlert title={title} actions={[{ label: "Try again", onClick: retry }]}>
      {children}
    </InlineAlert>
  );
}

/** Offline, reconnecting and session expired, as one quiet banner at the top of the panel body. */
export function ConnectionBanner({ offline, reconnecting, sessionExpired }: { offline: boolean; reconnecting: boolean; sessionExpired: boolean }) {
  return (
    <div role="status">
      {sessionExpired ? (
        <InlineAlert tone="warning" title="You've been signed out">
          Sign in again to save. Your changes are still here.
        </InlineAlert>
      ) : offline ? (
        <InlineAlert tone="info" icon={WifiOff}>
          You&apos;re offline. You can look around, but you&apos;ll need to reconnect to make changes.
        </InlineAlert>
      ) : reconnecting ? (
        <InlineAlert tone="info" icon={RefreshCw}>
          Reconnecting. Loading the latest changes…
        </InlineAlert>
      ) : null}
    </div>
  );
}
