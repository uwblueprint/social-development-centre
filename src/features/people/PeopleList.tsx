"use client";

import { useActionState, useId, useRef, useState, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverActions, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/features/auth/AuthScreen";
import type { Portal } from "@/features/auth/portals";
import { formatDate } from "@/lib/date";
import { idleState, type ActionState } from "@/lib/forms";
import { resendSignInLink } from "./actions";
import { Muted, Section, SectionTitle, Success } from "./PeoplePage";
import { displayName, type PersonRow } from "./person";

/** What a row's remove control needs: report the result and move focus once its row is gone. */
export interface Removal {
  onRemoved: (message: string) => void;
  onFocusLost: () => void;
}

const ListHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
`;

const Row = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
`;

const Person = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Details = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
`;

const ResendForm = styled.form`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const ConfirmTitle = styled.p`
  margin: 0 0 var(--space-2);
  font-weight: var(--weight-medium);
`;

const ConfirmText = styled.p`
  margin: 0 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

export function PeopleList({
  titleId,
  title,
  people,
  emptyText,
  portal,
  currentPersonId,
  renderRemove,
}: {
  titleId: string;
  title: string;
  people: PersonRow[];
  emptyText: string;
  /** Where their sign-in link (Resend link) takes them. */
  portal: Portal;
  currentPersonId?: string;
  renderRemove: (person: PersonRow, removal: Removal) => ReactNode;
}) {
  const [notice, setNotice] = useState("");
  const removal: Removal = { onRemoved: setNotice, onFocusLost: () => document.getElementById(titleId)?.focus() };

  return (
    <Section aria-labelledby={titleId}>
      <ListHeading>
        <SectionTitle id={titleId} tabIndex={-1}>
          {title}
        </SectionTitle>
        <Success role="status">{notice}</Success>
      </ListHeading>
      {people.length === 0 ? (
        <Muted>{emptyText}</Muted>
      ) : (
        <List>
          {people.map((person) => (
            <Row key={person.id}>
              <Person>
                <span>
                  {displayName(person)}
                  {person.id === currentPersonId && " (you)"}
                </span>
                <Details>
                  {person.name && `${person.email} · `}Added {formatDate(person.addedAt)}
                </Details>
              </Person>
              <RowActions>
                {!person.hasSignedIn && <ResendLink portal={portal} email={person.email} />}
                <Badge $variant={person.hasSignedIn ? "success" : "neutral"}>
                  {person.hasSignedIn ? "Active" : "Invited"}
                </Badge>
                {renderRemove(person, removal)}
              </RowActions>
            </Row>
          ))}
        </List>
      )}
    </Section>
  );
}

function ResendLink({ portal, email }: { portal: Portal; email: string }) {
  const [state, formAction] = useActionState(resendSignInLink.bind(null, portal, email), idleState);

  return (
    <ResendForm action={formAction}>
      <Details role="status">{state.message}</Details>
      <SubmitButton $variant="outline" $size="sm" aria-label={`Resend link to ${email}`}>
        Resend link
      </SubmitButton>
    </ResendForm>
  );
}

/** A row's remove button, with a popover that confirms before `action` runs. */
export function ConfirmRemove({
  label,
  accessibleLabel,
  title,
  description,
  confirmLabel,
  doneMessage,
  action,
  removal,
}: {
  label: string;
  /** Names the person, since every row has the same visible label. Starts with `label`. */
  accessibleLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  doneMessage: string;
  action: () => Promise<ActionState>;
  removal: Removal;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button ref={triggerRef} $variant="outline" $size="sm" aria-label={accessibleLabel}>
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        showClose={false}
        aria-labelledby={titleId}
        onCloseAutoFocus={(event) => {
          // Once the removal saves, the row and this button are gone.
          if (triggerRef.current?.isConnected) return;
          event.preventDefault();
          removal.onFocusLost();
        }}
      >
        <ConfirmForm
          titleId={titleId}
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          action={action}
          onDone={() => {
            setOpen(false);
            removal.onRemoved(doneMessage);
          }}
          onCancel={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Mounted only while the popover is open, so a failed attempt's error is gone when it reopens. */
function ConfirmForm({
  titleId,
  title,
  description,
  confirmLabel,
  action,
  onDone,
  onCancel,
}: {
  titleId: string;
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<ActionState>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(async () => {
    const result = await action();
    if (result.status === "success") onDone();
    return result;
  }, idleState);

  return (
    <form action={formAction}>
      <ConfirmTitle id={titleId}>{title}</ConfirmTitle>
      <ConfirmText>{description}</ConfirmText>
      {state.status === "error" && state.message && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {state.message}
        </FormError>
      )}
      <PopoverActions>
        <Button type="button" $variant="outline" $size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton $variant="danger" $size="sm">
          {confirmLabel}
        </SubmitButton>
      </PopoverActions>
    </form>
  );
}
