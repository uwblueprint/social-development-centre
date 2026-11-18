"use client";

import { styled } from "next-yak";
import { FileQuestion, Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/* Replaces the whole Outbox when the page can't be shown to this person. */
const Page = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-7) var(--space-5);
`;

export function OutboxAccessState({ kind }: { kind: "not-found" | "no-permission" }) {
  return (
    <Page>
      {kind === "not-found" ? (
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          description="This page doesn't exist or has moved. Use the sidebar to find what you need."
        />
      ) : (
        <EmptyState
          icon={Lock}
          title="You don't have access to the Outbox"
          description="Ask an SDC admin to give you access, then try again."
        />
      )}
    </Page>
  );
}
