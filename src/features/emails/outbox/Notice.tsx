"use client";

import type { ReactNode } from "react";
import { styled } from "next-yak";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

type Tone = "info" | "warning" | "danger";

const Box = styled.div<{ $tone: Tone }>`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-md);
  background: var(--color-info-subtle);
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  overflow-wrap: anywhere;

  & > svg {
    flex-shrink: 0;
    color: var(--color-info);
  }
  ${({ $tone }) =>
    $tone === "warning" &&
    `
    background: var(--color-warning-subtle);
    border-color: var(--color-warning-border);
    & > svg { color: var(--color-warning); }
  `}
  ${({ $tone }) =>
    $tone === "danger" &&
    `
    background: var(--color-danger-subtle);
    border-color: var(--color-danger-border);
    & > svg { color: var(--color-danger); }
  `}
`;

const Text = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
`;

/** An inline message: an icon, text and optional actions. Never colour alone (rule 6). Errors use role="alert". */
export function Notice({
  tone = "info",
  children,
  actions,
}: {
  tone?: Tone;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Box $tone={tone} role={tone === "danger" ? "alert" : "status"}>
      <Icon
        icon={
          tone === "danger"
            ? CircleAlert
            : tone === "warning"
              ? TriangleAlert
              : Info
        }
        size={16}
      />
      <Text>
        <span>{children}</span>
        {actions}
      </Text>
    </Box>
  );
}
