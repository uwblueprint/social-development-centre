"use client";

import { styled } from "next-yak";
import { CircleAlert } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { PageLoading } from "@/components/patterns/PageLoading";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { copy } from "./copy";

/* Layout only: flex/grid with --space-* gaps. */
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  min-width: 0;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/** Quiet secondary text in a cell: reasons, emails. */
export const Quiet = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

export function LoadingPage({ title = copy.title }: { title?: string }) {
  return <PageLoading title={title} />;
}

export function LoadErrorPage({
  onRetry,
  title = copy.title,
}: {
  onRetry: () => void;
  title?: string;
}) {
  return (
    <ListPage>
      <ListPageHeader title={title} />
      <EmptyState
        icon={CircleAlert}
        title={copy.loadError}
        description={copy.loadErrorBody}
        action={
          <Button type="button" onClick={onRetry}>
            {copy.retry}
          </Button>
        }
      />
    </ListPage>
  );
}
