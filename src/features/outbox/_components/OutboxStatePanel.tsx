"use client";

import { styled } from "next-yak";
import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Tabs } from "@/components/ui/Tabs";
import type { TemplateKey } from "../_data";
import { PanelHeader } from "./PanelHeader";
import { SkeletonBlock } from "./Skeleton";

/*
 * The list pane while the Outbox is loading for the first time or couldn't load. It keeps the real
 * pane's header (PanelHeader) so nothing jumps when the data arrives; tab counts are left out because
 * nobody knows them yet, and the search and filter are placeholders of the same size (nothing to search yet).
 */

const Panel = styled.section`
  -webkit-user-select: none;
  user-select: none;
  position: sticky;
  top: 0;
  z-index: var(--z-raised);
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 480px;
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);

  @media (max-width: 899px) {
    position: relative;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
`;

const Body = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
`;

const Rows = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

/* The shape of a recipient row: a checkbox, then a name line and a "when" line. */
const Row = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
`;


const Lines = styled.span`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`;


const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const LongerNote = styled.p`
  margin: 0;
  padding: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const WIDTHS: [string, string][] = [
  ["55%", "35%"],
  ["70%", "30%"],
  ["45%", "40%"],
  ["62%", "28%"],
  ["58%", "36%"],
  ["50%", "32%"],
  ["66%", "30%"],
];

/** Placeholder rows in the shape of recipient rows. Hidden from assistive tech: the caller announces the loading. */
export function SkeletonRows() {
  return (
    <Rows aria-hidden="true">
      {WIDTHS.map(([name, when], i) => (
        <Row key={i}>
          <SkeletonBlock $width="20px" $height="20px" />
          <Lines>
            <SkeletonBlock $width={name} />
            <SkeletonBlock $width={when} />
          </Lines>
        </Row>
      ))}
    </Rows>
  );
}

const NO_TEMPLATES = new Set<TemplateKey>();

interface OutboxStatePanelProps {
  state: "loading" | "failed";
  /** Only the list failed (State lab One section failed); the calendar still works. */
  listOnly?: boolean;
  /** Loading has gone on longer than expected (Slow loading): say so, visibly. */
  takingLonger?: boolean;
  /** Try again after "Couldn't load". */
  onRetry: () => void;
}

export function OutboxStatePanel({ state, listOnly = false, takingLonger = false, onRetry }: OutboxStatePanelProps) {
  const loading = state === "loading";
  return (
    <Panel aria-labelledby="outbox-title">
      <Tabs value="review">
        <PanelHeader
          searchText=""
          onSearchText={() => {}}
          onSearch={() => {}}
          templates={NO_TEMPLATES}
          onTemplates={() => {}}
          placeholder={loading ? "pulse" : "still"}
        />
      </Tabs>
      <Body aria-busy={loading}>
        {loading ? (
          <>
            <VisuallyHidden role="status">{takingLonger ? "Still loading. This is taking longer than usual." : "Loading the Outbox"}</VisuallyHidden>
            <SkeletonRows />
            {takingLonger && <LongerNote aria-hidden="true">Still loading. This is taking longer than usual.</LongerNote>}
          </>
        ) : (
          <div role="alert">
            <EmptyState
              icon={CircleAlert}
              title={listOnly ? "Couldn't load the list" : "Couldn't load the Outbox"}
              description={listOnly ? "The calendar still works. Try again." : "Check your connection and try again."}
              action={
                <Button $variant="outline" $size="sm" onClick={onRetry}>
                  <Icon icon={RotateCw} size={16} />
                  Try again
                </Button>
              }
            />
          </div>
        )}
      </Body>
    </Panel>
  );
}
