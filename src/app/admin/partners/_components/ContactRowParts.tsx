"use client";

import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";

/*
 * Layout pieces for a contact row, shared by the admin Partners panel (ContactRow) and the partner
 * portal's Team list (src/app/partner/organization/_components/TeamMemberRow.tsx).
 */

export const ContactRowFrame = styled.div<{ $highlighted?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-1);
  border-radius: var(--radius-md);
  transition: background-color var(--duration) var(--ease);

  ${({ $highlighted }) => $highlighted && `background: var(--color-accent-subtle);`}

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export const ContactInfo = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ContactName = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

export const ContactEmail = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

export const ContactMeta = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

export const ContactErrorLine = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--color-danger);

  svg {
    flex-shrink: 0;
  }
`;

export const ContactMenuTrigger = styled(Button)`
  flex-shrink: 0;
`;
