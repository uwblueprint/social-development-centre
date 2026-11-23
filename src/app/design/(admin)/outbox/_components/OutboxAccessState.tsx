"use client";

import { styled } from "next-yak";
import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/* Replaces the whole Outbox when the page can't be shown to this person. */
const Page = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-7) var(--space-5);
`;

export function OutboxAccessState() {
  return (
    <Page>
      <EmptyState
        icon={Lock}
        title="You don't have access to the Outbox"
        description="Ask an SDC admin to give you access, then try again."
      />
    </Page>
  );
}
