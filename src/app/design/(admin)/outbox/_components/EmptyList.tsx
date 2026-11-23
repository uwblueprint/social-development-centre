"use client";

import { CalendarClock, CircleCheck, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PanelMode } from "../_types";

interface EmptyListProps {
  mode: PanelMode;
  /** A search or a template filter is hiding what would otherwise show. */
  filtered: boolean;
  /** No emails at all yet: the calendar explains how the Outbox works, so this stays short. */
  nothingYet?: boolean;
  onClear: () => void;
}

export function EmptyList({ mode, filtered, nothingYet = false, onClear }: EmptyListProps) {
  if (filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nothing matches your search"
        description="Check the spelling, try another name or template, or clear your search and filters."
        action={
          <Button $variant="outline" $size="sm" onClick={onClear}>
            Clear search and filters
          </Button>
        }
      />
    );
  }

  if (mode === "review") {
    return (
      <EmptyState
        icon={CircleCheck}
        title="Nothing to review"
        description={nothingYet ? "Emails that need your OK wait here before they go out." : "Nothing is waiting for your OK. Everything on the calendar sends on its own."}
      />
    );
  }

  return (
    <EmptyState
      icon={mode === "failed" ? CircleCheck : CalendarClock}
      title={mode === "failed" ? "Nothing failed" : "Nothing scheduled"}
      description={
        mode === "failed"
          ? nothingYet
            ? "Emails that couldn't be sent show up here, so you can fix them."
            : "Every email went out. Any that can't be sent will show up here."
          : "No emails are going out in the next 30 days. They appear here once a member matches an automatic email."
      }
    />
  );
}
