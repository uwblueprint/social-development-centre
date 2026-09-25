"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { MoreVertical } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SheetBody, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { grantPaidAccess, revokePaidAccess, unsubscribeMember, updateMember } from "../_data/actions";
import type { Member } from "../_data/types";
import { formatDate } from "../_lib/format";

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  /* Clears the Sheet's built-in top-right close (×) button. */
  padding-right: var(--space-6);
`;

const TitleBlock = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

// The Sheet's own SheetTitle reserves space for the built-in close (×)
// button; TitleRow already reserves that space for the whole header row, so
// this drops the (now redundant) padding to keep the title's own line tight.
const Title = styled(SheetTitle)`
  padding-right: 0;
`;

const EmailLine = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const MenuTrigger = styled(Button)`
  flex-shrink: 0;
`;

const DangerMenuItem = styled(DropdownMenuItem)`
  color: var(--color-danger);
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const DetailsList = styled.dl`
  margin: 0;
  display: grid;
  gap: var(--space-3);
`;

const DetailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DetailLabel = styled.dt`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const DetailValue = styled.dd`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

type Confirm = "revoke" | "unsubscribe";

export function MemberSheetContent({ member, onClose }: { member: Member; onClose: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [editState, editAction] = useActionState(updateMember.bind(null, member.id), idleState);
  const [confirm, setConfirm] = React.useState<Confirm | null>(null);

  // Keeps the alert dialog's copy stable while it plays its close animation
  // (by then `confirm` is already null); updated during render, not an effect.
  const [shownConfirm, setShownConfirm] = React.useState<Confirm>("unsubscribe");
  if (confirm && confirm !== shownConfirm) setShownConfirm(confirm);

  // Exits edit mode once a save resolves without field errors; derived at
  // render time from the action state instead of mirrored in an effect.
  const [handledEditState, setHandledEditState] = React.useState(editState);
  if (editState !== handledEditState) {
    setHandledEditState(editState);
    if (editState.status !== "idle" && !editState.fieldErrors) setEditing(false);
  }

  React.useEffect(() => {
    if (editState.status !== "idle" && !editState.fieldErrors && editState.message) {
      toast({ title: editState.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState]);

  async function handleGrant() {
    const result = await grantPaidAccess(member.id);
    toast({ title: result.message ?? "Done." });
    onClose();
  }

  async function handleConfirm(kind: Confirm) {
    const result = kind === "revoke" ? await revokePaidAccess(member.id) : await unsubscribeMember(member.id);
    toast({ title: result.message ?? "Done." });
    onClose();
  }

  const displayName = member.name ?? member.email;
  const category = member.tier === "paying" ? "Paying member" : "General member";
  const restoreReason = "Turned off until SDC confirms its consent rules for resubscribing people.";

  return (
    <>
      <SheetHeader>
        <TitleRow>
          <TitleBlock>
            <Title>{displayName}</Title>
            {member.name && <EmailLine>{member.email}</EmailLine>}
          </TitleBlock>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuTrigger type="button" $variant="ghost" $size="sm" aria-label={`Actions for ${displayName}`}>
                <Icon icon={MoreVertical} size={16} />
              </MenuTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>Edit details</DropdownMenuItem>
              <DropdownMenuSeparator />
              {member.subscribed ? (
                <DangerMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirm("unsubscribe");
                  }}
                >
                  Unsubscribe
                </DangerMenuItem>
              ) : (
                <Tooltip content={restoreReason}>
                  <DropdownMenuItem disabled>Restore email eligibility</DropdownMenuItem>
                </Tooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TitleRow>
        {(member.tier === "paying" || !member.subscribed) && (
          <BadgeRow>
            {member.tier === "paying" && <Badge $variant="primary">Paying member</Badge>}
            {!member.subscribed && <Badge $variant="outline">Unsubscribed</Badge>}
          </BadgeRow>
        )}
      </SheetHeader>

      <SheetBody>
        {editing ? (
          <EditForm action={editAction} aria-label="Edit member">
            <Field label="Name" error={fieldError(editState, "name")}>
              {(p) => <Input {...p} name="name" defaultValue={member.name ?? ""} autoComplete="name" />}
            </Field>
            <Field label="Email" error={fieldError(editState, "email")} required>
              {(p) => <Input {...p} name="email" type="email" defaultValue={member.email} autoComplete="email" />}
            </Field>
            <FormActions>
              <Button type="button" $variant="secondary" $size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <SubmitButton $size="sm">Save</SubmitButton>
            </FormActions>
          </EditForm>
        ) : (
          <DetailsList>
            <DetailRow>
              <DetailLabel>Email</DetailLabel>
              <DetailValue>{member.email}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Category</DetailLabel>
              <DetailValue>{category}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Date added</DetailLabel>
              <DetailValue>{formatDate(member.addedAt)}</DetailValue>
            </DetailRow>
          </DetailsList>
        )}
      </SheetBody>

      {!editing && member.subscribed && (
        <SheetFooter>
          {member.tier === "general" ? (
            <Button type="button" onClick={() => void handleGrant()}>
              Give paying access
            </Button>
          ) : (
            <Button type="button" onClick={() => setConfirm("revoke")}>
              Remove paying access
            </Button>
          )}
        </SheetFooter>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {shownConfirm === "revoke" ? `Remove paying access for ${displayName}?` : `Unsubscribe ${displayName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {shownConfirm === "revoke"
              ? "Their paid benefits end now. They'll keep getting general emails, and we'll send them a notice."
              : member.tier === "paying"
                ? "This stops all emails to them and removes their paying access, now. Their record is kept, marked Unsubscribed."
                : "This stops all emails to them now. Their record is kept, marked Unsubscribed."}
          </AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                {shownConfirm === "revoke" ? "Keep paying access" : "Keep subscribed"}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" $variant="danger" onClick={() => confirm && void handleConfirm(confirm)}>
                {shownConfirm === "revoke" ? "Yes, remove paying access" : "Yes, unsubscribe"}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
