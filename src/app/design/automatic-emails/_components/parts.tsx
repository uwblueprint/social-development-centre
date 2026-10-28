"use client";

import type { ReactNode } from "react";
import { css, styled } from "next-yak";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

export const Page = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
`;

export const PageHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
  justify-content: space-between;
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

/** A list row inside a Card: main text on the left, badges and actions on the right, wrapping on phones. */
export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  align-items: center;
  padding: var(--space-3) var(--space-5);

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

export const RowMain = styled.div`
  flex: 999 1 260px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

export const RowSide = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: flex-end;
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
