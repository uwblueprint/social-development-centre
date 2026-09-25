"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { ArrowRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { List } from "@/components/ui/ListRow";
import { SheetBody, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { reinvitePartner, removePartner, updateOrganization } from "../_data/actions";
import type { PartnerOrganization } from "../_data/types";
import { formatDate } from "../_lib/format";
import { ContactRow } from "./ContactRow";

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

const NameForm = styled.form`
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
`;

const NameField = styled.div`
  flex: 1;
  min-width: 0;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const OppsLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ContactsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

function statusBadge(status: PartnerOrganization["status"]) {
  if (status === "active") return null;
  if (status === "removed") return <Badge $variant="outline">Removed</Badge>;
  return <Badge $variant="neutral">Pending</Badge>;
}

export function PartnerSheetContent({
  org,
  highlightContactId,
  onAddPerson,
}: {
  org: PartnerOrganization;
  highlightContactId?: string;
  onAddPerson: () => void;
}) {
  const { toast } = useToast();
  const [orgState, orgAction] = useActionState(updateOrganization.bind(null, org.id), idleState);
  const [confirm, setConfirm] = React.useState<"remove" | "reinvite" | null>(null);

  React.useEffect(() => {
    if (orgState.status === "success" && orgState.message) toast({ title: orgState.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgState]);

  async function handleConfirm() {
    const result = confirm === "remove" ? await removePartner(org.id) : await reinvitePartner(org.id);
    toast({ title: result.message ?? "Done." });
  }

  return (
    <>
      <SheetHeader>
        <VisuallyHidden>
          <SheetTitle>{org.name}</SheetTitle>
        </VisuallyHidden>
        <NameForm action={orgAction} aria-label="Organization name">
          <NameField>
            <Field label="Organization name" error={fieldError(orgState, "name")} required>
              {(p) => <Input {...p} name="name" defaultValue={org.name} />}
            </Field>
          </NameField>
          <SubmitButton $variant="secondary" $size="sm">
            Save
          </SubmitButton>
        </NameForm>
        <MetaRow>
          {statusBadge(org.status)}
          {org.status === "removed" && org.removedAt && <span>Removed {formatDate(org.removedAt)}</span>}
        </MetaRow>
        <OppsLink href={`/admin/opportunities?partner=${org.id}`}>
          View opportunities ({org.opportunityCount})
          <Icon icon={ArrowRight} size={14} />
        </OppsLink>
      </SheetHeader>

      <SheetBody>
        <ContactsSection>
          <div>
            <SectionTitle>Contacts</SectionTitle>
            <List>
              {org.contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  organizationName={org.name}
                  onlyContact={org.contacts.length === 1}
                  highlighted={contact.id === highlightContactId}
                />
              ))}
            </List>
          </div>
          {org.status !== "removed" && (
            <Button type="button" $variant="secondary" $size="sm" onClick={onAddPerson} style={{ alignSelf: "flex-start" }}>
              Add person
            </Button>
          )}
        </ContactsSection>
      </SheetBody>

      <SheetFooter>
        {org.status === "removed" ? (
          <Button type="button" $variant="secondary" onClick={() => setConfirm("reinvite")}>
            Reinvite
          </Button>
        ) : (
          <Button type="button" $variant="danger" onClick={() => setConfirm("remove")}>
            Remove access
          </Button>
        )}
      </SheetFooter>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {confirm === "reinvite" ? "Reinvite this partner?" : `Remove ${org.name}'s access?`}
          </AlertDialogTitle>
          {confirm === "reinvite" ? (
            <AlertDialogDescription>
              Sends a fresh invitation to each saved contact and returns {org.name} to the current list as
              Pending. Opportunities that already expired are not republished.
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>
              Immediately: portal access ends now, and their opportunities stop being recommended and leave
              future emails. Over the next month: each opportunity expires at its own end date or in one
              month, whichever is first. Already-sent emails can&apos;t be recalled.
            </AlertDialogDescription>
          )}
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                {confirm === "reinvite" ? "Cancel" : "Keep access"}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" $variant={confirm === "reinvite" ? "primary" : "danger"} onClick={() => void handleConfirm()}>
                {confirm === "reinvite" ? "Yes, reinvite" : "Yes, remove access"}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
