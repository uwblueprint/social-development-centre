"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Check, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { dayDate, type Send } from "../_data";
import { useOutboxLock } from "../_lock";
import type { BulkKind } from "../_types";
import { OfflineGate } from "./OfflineGate";

/* Floats over the bottom of the list, above its raised and sticky layers. Count and clear, then select shortcuts when they apply, then the actions. */
const Bar = styled.div`
  position: absolute;
  left: var(--space-3);
  right: var(--space-3);
  bottom: var(--space-3);
  z-index: var(--z-raised);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-lg);
`;

/* Row 1: how many are selected, and the way out, pinned right. */
const CountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: var(--space-6);
`;

const Count = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  white-space: nowrap;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
`;

/* The select shortcuts and the primary action, together on the right; they wrap under each other when the list is narrow. */
const Right = styled.div`
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-2);
`;

const Primary = styled.div``;

/* Square ghost small button; it bleeds by the space around the 16px glyph so the glyph's right edge lines up
   with the primary button below. */
const IconButton = styled(Button)`
  margin-right: calc(-1 * var(--space-2));
  aspect-ratio: 1;
  padding: 0;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

interface SelectionBarProps {
  /** The selected sends. */
  selected: Send[];
  /** Everything the list shows, in order. */
  shown: Send[];
  /** The send picked last, which "select all for that day" follows. */
  lastPicked: Send | undefined;
  /** The list is grouped by day, so a whole day can be selected. */
  byDay: boolean;
  onSelect: (ids: string[]) => void;
  onClear: () => void;
  onBulk: (kind: BulkKind, ids: string[]) => void;
  onResend: (ids: string[]) => void;
}

/** What's selected, shortcuts to select more, then what to do with it. One primary action. */
export function SelectionBar({ selected, shown, lastPicked, byDay, onSelect, onClear, onBulk, onResend }: SelectionBarProps) {
  const { reason: lockReason, busy } = useOutboxLock();
  const selectedIds = new Set(selected.map((s) => s.id));
  const allSelected = shown.length > 0 && shown.every((s) => selectedIds.has(s.id));

  const dayGroup = byDay && lastPicked ? shown.filter((s) => s.day === lastPicked.day) : null;
  const canSelectDay = !!dayGroup && dayGroup.length < shown.length && dayGroup.some((s) => !selectedIds.has(s.id));
  const dayName = lastPicked
    ? lastPicked.day === 0
      ? "today"
      : lastPicked.day === 1
        ? "tomorrow"
        : dayDate(lastPicked.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  const reviewIds = selected.filter((s) => s.status === "review").map((s) => s.id);
  const failed = selected.filter((s) => s.status === "couldnt");
  const failIds = failed.map((s) => s.id);
  // Couldn't send tab: one primary action only when it applies to every selected email. Not approved in time -> Approve;
  // bounced -> Resend. A mix, or any email we retry ourselves, has no single action, so only Delete shows.
  const failAction = failed.length === 0 ? null : failed.every((s) => s.fail === "admin") ? "approve" : failed.every((s) => s.fail === "bounce") ? "resend" : null;
  const resending = busy?.kind === "resend";
  const reason = (action: "approve" | "resend" | "delete") => (resending && action === "resend" ? null : lockReason(action));

  // The Delete key (or Backspace) does what the Delete button does, unless typing, a dialog or a menu has the keyboard.
  const selectedList = selected.map((s) => s.id);
  const deleteBlocked = reason("delete");
  const deleteRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    deleteRef.current = () => {
      if (!deleteBlocked && selectedList.length > 0) onBulk("delete", selectedList);
    };
  });
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el?.closest('input, textarea, select, [contenteditable="true"], [role="tablist"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')) return;
      // An open email takes the key: it deletes that email (EmailView).
      if (document.querySelector("[data-email-view]")) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')) return;
      e.preventDefault();
      deleteRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Bar
      data-no-marquee=""
      role="group"
      aria-label="Selected emails"
      onKeyDown={(e) => {
        // Menus and dialogs render in a portal, so only keys pressed on the bar's own controls count.
        if (e.key === "Escape" && e.currentTarget.contains(e.target as Node)) onClear();
      }}
    >
      <VisuallyHidden role="status">{selected.length} selected</VisuallyHidden>
      <CountRow>
        <Count aria-hidden="true">
          {selected.length} of {shown.length} selected
        </Count>
        <IconButton $variant="ghost" $size="sm" aria-label="Clear selection" onClick={onClear}>
          <Icon icon={X} size={16} />
        </IconButton>
      </CountRow>
      <ActionRow>
        <OfflineGate reason={reason("delete")}>
          <Button $variant="danger-outline" $size="sm" onClick={() => onBulk("delete", selected.map((s) => s.id))}>
            <Icon icon={Trash2} size={16} />
            Delete
          </Button>
        </OfflineGate>
        <Right>
          {/* The day comes first; once it is all selected (or the list isn't by day), the shortcut for everything shows. */}
          {!allSelected && !canSelectDay && (
            <Button $variant="outline" $size="sm" onClick={() => onSelect(shown.map((s) => s.id))}>
              Select all {shown.length}
            </Button>
          )}
          {canSelectDay && dayGroup && (
            <Button $variant="outline" $size="sm" onClick={() => onSelect([...selectedIds, ...dayGroup.map((s) => s.id)])}>
              Select all {dayGroup.length} for {dayName}
            </Button>
          )}
        {reviewIds.length > 0 ? (
          <Primary>
            <OfflineGate reason={reason("approve")}>
              <Button $size="sm" onClick={() => onBulk("approve", reviewIds)}>
                <Icon icon={Check} size={16} />
                Approve {reviewIds.length}
              </Button>
            </OfflineGate>
          </Primary>
        ) : failAction === "approve" ? (
          <Primary>
            <OfflineGate reason={reason("approve")}>
              <Button $size="sm" onClick={() => onBulk("approve", failIds)}>
                <Icon icon={Check} size={16} />
                Approve {failIds.length}
              </Button>
            </OfflineGate>
          </Primary>
        ) : failAction === "resend" ? (
          <Primary>
            <OfflineGate reason={reason("resend")}>
              <Button $size="sm" onClick={() => onResend(failIds)} disabled={resending} aria-busy={resending || undefined}>
                <Icon icon={RefreshCw} size={16} />
                {resending ? busy.label : `Resend ${failIds.length}`}
              </Button>
            </OfflineGate>
          </Primary>
        ) : null}
        </Right>
      </ActionRow>
    </Bar>
  );
}
