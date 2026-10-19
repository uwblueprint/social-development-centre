"use client";

import * as React from "react";
import { styled } from "next-yak";
import { CircleAlert, MailX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AUTOMATIC_BASE } from "./summary";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-6) var(--space-8);

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
`;

export const BackLink = styled(Link)`
  align-self: flex-start;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    border-radius: var(--radius-sm);
    box-shadow: var(--focus-ring);
  }
`;

/** The lab's failed load: says what happened, keeps the data safe, offers Try again. */
export function LoadError({ retry }: { retry(): void }) {
  return (
    <EmptyState
      icon={CircleAlert}
      title="Couldn't load automatic emails."
      action={
        <Button type="button" onClick={retry}>
          Try again
        </Button>
      }
    />
  );
}

export function NotFound() {
  const router = useRouter();
  return (
    <EmptyState
      icon={MailX}
      title="Email not found."
      action={
        <Button type="button" $variant="secondary" onClick={() => router.push(AUTOMATIC_BASE)}>
          Automatic emails
        </Button>
      }
    />
  );
}

export const Hidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
