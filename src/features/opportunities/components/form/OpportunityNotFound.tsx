"use client";

import { styled } from "next-yak";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { copy } from "../../copy";
import { GhostLink } from "./FormParts";

const Page = styled.div`
  padding: var(--space-7) var(--space-6);

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4);
  }
`;

/** Edit page for an id that doesn't exist or belongs to another organization. */
export function OpportunityNotFound({ basePath }: { basePath: string }) {
  return (
    <Page>
      <EmptyState
        icon={SearchX}
        title={copy.notFound.title}
        description={copy.notFound.body}
        action={<GhostLink href={basePath}>{copy.notFound.back}</GhostLink>}
      />
    </Page>
  );
}
