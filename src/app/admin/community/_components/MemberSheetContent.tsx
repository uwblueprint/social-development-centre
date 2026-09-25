"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
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
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SheetBody, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { grantPaidAccess, revokePaidAccess, unsubscribeMember, updateMember } from "../_data/actions";
import type { Member } from "../_data/types";
import { formatDate } from "../_lib/format";

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

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const InfoLabel = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const InfoValue = styled.p`
  margin: 2px 0 0;
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const InfoStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
`;

type Confirm = "revoke" | "unsubscribe";

export function MemberSheetContent({ member, onClose }: { member: Member; onClose: () => void }) {
  const { toast } = useToast();
  const [editState, editAction] = useActionState(updateMember.bind(null, member.id), idleState);
  const [confirm, setConfirm] = React.useState<Confirm | null>(null);

  // Keeps the alert dialog's copy stable while it plays its close animation
  // (by then `confirm` is already null); updated during render, not an effect.
  const [shownConfirm, setShownConfirm] = React.useState<Confirm>("unsubscribe");
  if (confirm && confirm !== shownConfirm) setShownConfirm(confirm);

  React.useEffect(() => {
    if (editState.status !== "idle" && editState.message) {
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

  return (
    <>
      <SheetHeader>
        <VisuallyHidden>
          <SheetTitle>{displayName}</SheetTitle>
        </VisuallyHidden>
        <EditForm action={editAction} aria-label="Edit member">
          <Field label="Name" error={fieldError(editState, "name")}>
            {(p) => <Input {...p} name="name" defaultValue={member.name ?? ""} autoComplete="name" />}
          </Field>
          <Field label="Email" error={fieldError(editState, "email")} required>
            {(p) => <Input {...p} name="email" type="email" defaultValue={member.email} autoComplete="email" />}
          </Field>
          <FormActions>
            <SubmitButton $variant="secondary" $size="sm">
              Save
            </SubmitButton>
          </FormActions>
        </EditForm>
      </SheetHeader>

      <SheetBody>
        <InfoStack>
          <div>
            <InfoLabel>Date added</InfoLabel>
            <InfoValue>{formatDate(member.addedAt)}</InfoValue>
          </div>

          <MetaRow>
            <Badge $variant={member.tier === "paying" ? "primary" : "neutral"}>
              {member.tier === "paying" ? "Paying member" : "General member"}
            </Badge>
            {!member.subscribed && <Badge $variant="outline">Unsubscribed</Badge>}
          </MetaRow>

          {member.subscribed && member.tier === "general" && (
            <Button
              type="button"
              $variant="secondary"
              $size="sm"
              onClick={() => void handleGrant()}
              style={{ alignSelf: "flex-start" }}
            >
              Give paying access
            </Button>
          )}
          {member.tier === "paying" && (
            <Button
              type="button"
              $variant="secondary"
              $size="sm"
              onClick={() => setConfirm("revoke")}
              style={{ alignSelf: "flex-start" }}
            >
              Remove paying access
            </Button>
          )}
        </InfoStack>
      </SheetBody>

      <SheetFooter>
        {member.subscribed ? (
          <Button type="button" $variant="danger" onClick={() => setConfirm("unsubscribe")}>
            Unsubscribe
          </Button>
        ) : (
          <DisabledReason reason="Turned off until SDC confirms its consent rules for resubscribing people.">
            <Button type="button" $variant="secondary" disabled>
              Restore email eligibility
            </Button>
          </DisabledReason>
        )}
      </SheetFooter>

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
