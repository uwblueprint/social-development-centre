"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { Icon } from "@/components/ui/Icon";
import type { ImportEntry } from "../_data/types";
import { communityCopy as copy } from "../_copy";

const GroupItem = styled.li`
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) 0;

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const GroupTrigger = styled(Button)`
  justify-content: flex-start;
  width: 100%;
  height: auto;
  min-height: var(--space-6);
  padding: var(--space-1);
  text-align: left;
  font-weight: var(--weight-medium);
  white-space: normal;
`;

const Chevron = styled.span<{ $open?: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--duration) var(--ease);
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
`;

export type Tone = "success" | "muted" | "warning" | "danger";

const GroupIcon = styled.span<{ $tone: Tone }>`
  display: inline-flex;
  flex-shrink: 0;
  color: ${({ $tone }) =>
    $tone === "success"
      ? "var(--color-success)"
      : $tone === "warning"
        ? "var(--color-warning)"
        : $tone === "danger"
          ? "var(--color-danger)"
          : "var(--color-text-muted)"};
`;

const Detail = styled.p`
  margin: 0;
  padding-left: calc(var(--space-6) + var(--space-3));
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Addresses = styled.ul`
  margin: 0;
  padding: var(--space-1) 0 0 calc(var(--space-6) + var(--space-3));
  list-style: none;
  display: grid;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

const person = (e: ImportEntry | string) => (typeof e === "string" ? e : e.name ? `${e.name} · ${e.email}` : e.email);

/** One preview group: icon, "N what happens" label that reveals the addresses, and a short detail line. */
export function PreviewGroup({
  icon,
  tone,
  label,
  detail,
  people,
  children,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  detail?: string;
  people: (ImportEntry | string)[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  if (people.length === 0) return null;
  return (
    <GroupItem>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <GroupTrigger type="button" $variant="ghost" $size="sm" aria-label={copy.addDialog.toggleAddresses(label, open)}>
            <Chevron aria-hidden="true" $open={open}>
              <Icon icon={ChevronRight} size={14} />
            </Chevron>
            <GroupIcon aria-hidden="true" $tone={tone}>
              <Icon icon={icon} size={16} />
            </GroupIcon>
            {label}
          </GroupTrigger>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Addresses>
            {people.map((p) => (
              <li key={typeof p === "string" ? p : p.email}>{person(p)}</li>
            ))}
          </Addresses>
        </CollapsibleContent>
      </Collapsible>
      {detail && <Detail>{detail}</Detail>}
      {children}
    </GroupItem>
  );
}
