"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { css, styled } from "next-yak";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

export const Page = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-5) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  @media (max-width: 767px) {
    padding: var(--space-6) var(--space-4) var(--space-7);
  }
`;

export const PageTitle = styled.h1`
  margin: 0 0 var(--space-1);
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

export const Muted = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const NoticeBox = styled.div<{ $tone: "info" | "warning" | "danger" }>`
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-md);
  background: var(--color-info-subtle);
  color: var(--color-info);
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  ${({ $tone }) =>
    $tone === "warning" &&
    css`
      border-color: var(--color-warning-border);
      background: var(--color-warning-subtle);
      color: var(--color-warning);
    `}

  ${({ $tone }) =>
    $tone === "danger" &&
    css`
      border-color: var(--color-danger-border);
      background: var(--color-danger-subtle);
      color: var(--color-danger);
    `}

  & > svg {
    flex: none;
    margin-top: calc(var(--space-1) / 2);
  }
`;

const NOTICE_ICON = { info: Info, warning: TriangleAlert, danger: CircleAlert };

/**
 * An inline status message. Not in the kit yet: the icon keeps the tone from resting on color alone.
 * `alert` announces it to screen readers when it appears.
 */
export function Notice({
  tone,
  alert,
  children,
}: {
  tone: "info" | "warning" | "danger";
  alert?: boolean;
  children: ReactNode;
}) {
  return (
    <NoticeBox $tone={tone} role={alert ? "alert" : undefined}>
      <Icon icon={NOTICE_ICON[tone]} />
      <span>{children}</span>
    </NoticeBox>
  );
}

const MemberList = styled.ul`
  margin: 0;
  padding: 0;

  /* Straight after a dialog title (no description), match the kit's 20px title-to-content rhythm (title 4px + 16px). */
  h2 + & {
    margin-top: var(--space-4);
  }
  list-style: none;
  max-height: 50vh;
  overflow-y: auto;

  /* Room between the emails and the scrollbar, only when it scrolls. */
  &[data-scrolls] {
    padding-right: var(--space-3);
  }

  & > li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0 var(--space-4);
    padding: var(--space-2) 0;
    font-size: var(--text-sm);
    color: var(--color-text);
  }
  & > li + li {
    border-top: 1px solid var(--color-border);
  }
  & > li > span:last-child {
    color: var(--color-text-muted);
    overflow-wrap: anywhere;
  }
`;

/** Name on the left, email on the right, 1px dividers between rows only. Shared by every member list. */
export function MemberRows({ members }: { members: { name: string; email: string; sendDate?: string }[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScrolls(el.scrollHeight > el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [members.length]);
  return (
    <MemberList ref={ref} data-scrolls={scrolls || undefined}>
      {members.map((m) => (
        <li key={m.email}>
          <span>{m.name}</span>
          <span>{m.sendDate ? `Sends ${m.sendDate}` : m.email}</span>
        </li>
      ))}
    </MemberList>
  );
}
