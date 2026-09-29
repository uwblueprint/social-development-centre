"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { BadgeCheck, BadgeMinus, MailPlus, MailX, Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SheetBody, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatDate } from "@/lib/date";
import { fieldError, idleState } from "@/lib/forms";
import { updateMember } from "../_data/actions";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { getMemberById } from "../_lib/emailHistoryAction";
import { CopyEmail } from "./CopyEmail";
import { MemberConfirmDialog } from "./MemberConfirmDialog";
import { MemberEmails } from "./MemberEmails";
import { useMemberActions } from "./useMemberActions";

/* Padding comes from the kit's Sheet (header top matches the sides). */
const Header = styled(SheetHeader)`
  gap: var(--space-3);
`;

const Body = SheetBody;

const Title = styled(SheetTitle)`
  overflow-wrap: anywhere;
`;

/* Name with the email tight under it. */
const Identity = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;

  /* A very long address wraps here instead of pushing the panel wider. */
  button {
    white-space: normal;
    overflow-wrap: anywhere;
  }
`;

const EmailLine = styled.div`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Meta = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/* 32px squares, the same height as the small text buttons beside them. */
const IconButton = styled(Button)`
  aspect-ratio: 1;
  padding: 0;
`;

/** Delete reads as destructive before it's clicked (the confirm dialog still guards it). */
const DangerIconButton = styled(IconButton)`
  color: var(--color-danger);
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

/**
 * The member panel: one scrolling view. The header says who they are (name, the email under it, click
 * to copy) and where they are ("Active · General member · Added Apr 11, 2026"), then a row of visible
 * actions: Edit details, Unsubscribe or Resubscribe, and icon buttons for the rare ones (convert or
 * remove paying access, delete). The body lists every email they've been sent and what they did with it.
 * `onChange` gets the person after an action, or `null` once they're deleted.
 */
export function MemberSheetContent({ member, now, onChange }: { member: Member; now: string; onChange: (member: Member | null) => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [editState, editAction] = useActionState(updateMember.bind(null, member.id), idleState);

  const { resubscribe, confirm, setConfirm, shownConfirm, runConfirm } = useMemberActions(member, onChange);

  // Exits edit mode once a save resolves without field errors; derived at
  // render time from the action state instead of mirrored in an effect.
  const [handledEditState, setHandledEditState] = React.useState(editState);
  if (editState !== handledEditState) {
    setHandledEditState(editState);
    if (editState.status !== "idle" && !editState.fieldErrors) setEditing(false);
  }

  // Inline errors only: move focus to the first invalid field.
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (editState.fieldErrors?.name) nameRef.current?.focus();
    else if (editState.fieldErrors?.email) emailRef.current?.focus();
  }, [editState]);

  const onResult = React.useEffectEvent(() => {
    if (editState.status !== "idle" && !editState.fieldErrors && editState.message) {
      toast({ title: editState.message });
      void getMemberById(member.id).then(onChange);
    }
  });
  React.useEffect(() => {
    onResult();
  }, [editState]);

  const displayName = member.name ?? member.email;
  const p = copy.panel;
  const meta = [
    copy.status[member.status],
    member.tier === "paying" ? p.statusPaying : p.statusGeneral,
    p.added(formatDate(member.addedAt)),
  ].join(p.metaSeparator);
  const unsubscribedDate = member.unsubscribedAt ? formatDate(member.unsubscribedAt) : "";
  const paying = member.tier === "paying";

  return (
    <>
      <Header>
        <Identity>
          {member.name ? (
            <>
              <Title>{member.name}</Title>
              <EmailLine>
                <CopyEmail email={member.email} />
              </EmailLine>
            </>
          ) : (
            // No name: the email is the title, so it isn't repeated below.
            <Title>
              <CopyEmail email={member.email} />
            </Title>
          )}
        </Identity>
        <Meta>{meta}</Meta>
        {!member.subscribed && (
          <Meta>{member.unsubscribedBy === "admin" ? p.unsubscribedAdmin(unsubscribedDate) : p.unsubscribedSelf(unsubscribedDate)}</Meta>
        )}

        <ActionRow role="group" aria-label={p.actionsLabel(displayName)}>
          <Button type="button" $variant="secondary" $size="sm" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>
            <Icon icon={Pencil} size={16} />
            {p.edit}
          </Button>
          {member.subscribed ? (
            <Button type="button" $variant="secondary" $size="sm" onClick={() => setConfirm("unsubscribe")}>
              <Icon icon={MailX} size={16} />
              {p.unsubscribe}
            </Button>
          ) : (
            // Owner decision 6: admins resubscribe only people an admin unsubscribed.
            // Self-unsubscribed people get the statement above instead.
            member.unsubscribedBy === "admin" && (
              <Button type="button" $variant="secondary" $size="sm" onClick={() => void resubscribe()}>
                <Icon icon={MailPlus} size={16} />
                {p.resubscribe}
              </Button>
            )
          )}
          <Tooltip content={paying ? p.remove : p.convert} pinOnClick={false}>
            <IconButton
              type="button"
              $variant="secondary"
              $size="sm"
              aria-label={paying ? p.remove : p.convert}
              onClick={() => setConfirm(paying ? "revoke" : "convert")}
            >
              <Icon icon={paying ? BadgeMinus : BadgeCheck} size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip content={p.delete} pinOnClick={false}>
            <DangerIconButton type="button" $variant="secondary" $size="sm" aria-label={p.delete} onClick={() => setConfirm("delete")}>
              <Icon icon={Trash2} size={16} />
            </DangerIconButton>
          </Tooltip>
        </ActionRow>
      </Header>

      <Body>
        {editing && (
          <EditForm action={editAction} noValidate aria-label={copy.editForm.ariaLabel}>
            <Field label={copy.editForm.nameLabel} error={fieldError(editState, "name")}>
              {(fp) => <Input {...fp} ref={nameRef} name="name" defaultValue={member.name ?? ""} autoComplete="name" />}
            </Field>
            <Field label={copy.editForm.emailLabel} error={fieldError(editState, "email")} required>
              {(fp) => <Input {...fp} ref={emailRef} name="email" type="email" defaultValue={member.email} autoComplete="email" />}
            </Field>
            <FormActions>
              <Button type="button" $variant="secondary" $size="sm" onClick={() => setEditing(false)}>
                <Icon icon={X} size={16} />
                {copy.editForm.cancel}
              </Button>
              <SubmitButton $size="sm">
                <Icon icon={Save} size={16} />
                {copy.editForm.save}
              </SubmitButton>
            </FormActions>
          </EditForm>
        )}

        <MemberEmails memberId={member.id} subscribed={member.subscribed} now={now} />
      </Body>

      <MemberConfirmDialog
        member={member}
        confirm={confirm}
        shownConfirm={shownConfirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={(kind) => void runConfirm(kind)}
      />
    </>
  );
}
