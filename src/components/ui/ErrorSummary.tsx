"use client";

import * as React from "react";
import { styled } from "next-yak";
import { CircleAlert } from "lucide-react";
import { Icon } from "./Icon";

export interface ErrorSummaryItem {
  /** The invalid control's id; pass the same value to that field's `Field id`. */
  fieldId: string;
  /** The field's own error message, so the summary and the field say the same thing. */
  message: string;
}

export interface ErrorSummaryProps {
  /** Say how many things need fixing, e.g. "Fix 2 fields to publish this opportunity". */
  title: string;
  errors: ErrorSummaryItem[];
}

const Box = styled.div`
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background: var(--color-danger-subtle);
  color: var(--color-text);
`;

const IconSlot = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  padding-top: 2px;
  color: var(--color-danger);
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-danger);
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const ErrorLink = styled.a`
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-danger);
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);
  overflow-wrap: anywhere;

  &:hover {
    text-decoration-thickness: 2px;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/**
 * A persistent summary of a long form's errors, shown above the form after a failed submit. Each
 * item links to its field and moves focus there. Renders nothing when there are no errors.
 */
export function ErrorSummary({ title, errors }: ErrorSummaryProps) {
  if (errors.length === 0) return null;

  function focusField(event: React.MouseEvent<HTMLAnchorElement>, fieldId: string) {
    const field = document.getElementById(fieldId);
    if (!field) return; // Let the plain #fieldId link do what it can.
    event.preventDefault();
    field.scrollIntoView({ block: "center" });
    field.focus({ preventScroll: true });
  }

  return (
    <Box role="alert">
      <IconSlot aria-hidden="true">
        <Icon icon={CircleAlert} size={18} />
      </IconSlot>
      <Body>
        <Title>{title}</Title>
        <List>
          {errors.map((error) => (
            <li key={error.fieldId}>
              <ErrorLink href={`#${error.fieldId}`} onClick={(e) => focusField(e, error.fieldId)}>
                {error.message}
              </ErrorLink>
            </li>
          ))}
        </List>
      </Body>
    </Box>
  );
}
