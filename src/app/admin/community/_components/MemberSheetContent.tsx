"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { BadgeCheck, BadgeMinus, Copy, MailPlus, MailX, MoreVertical, Pencil, Save, X } from "lucide-react";
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
import { SheetBody, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { updateMember } from "../_data/actions";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { formatDate } from "../_lib/format";
import { CopyEmailButton } from "./CopyEmailButton";
import { MemberConfirmDialog } from "./MemberConfirmDialog";
import { MemberEmails } from "./MemberEmails";
import { useMemberActions } from "./useMemberActions";

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  /* Clears the Sheet's built-in top-right close (×) button. */
  padding-right: var(--space-6);
`;

const TitleBlock = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

// TitleRow already reserves the close button's space for the whole row.
const Title = styled(SheetTitle)`
  padding-right: 0;
  overflow-wrap: anywhere;
`;

const TitleWithCopy = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
`;

const EmailLine = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const MetaLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
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
 * The member panel: one scrolling view. The header holds who they are (name,
 * email with copy, status, date added) and a ⋯ menu with every action; the
 * body lists every email they've been sent, each body loading as it scrolls
 * into view. Each fact appears once.
 */
export function MemberSheetContent({ member, onClose }: { member: Member; onClose: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [editState, editAction] = useActionState(updateMember.bind(null, member.id), idleState);

  const { copyEmail, convert, confirm, setConfirm, shownConfirm, runConfirm } = useMemberActions(member, onClose);

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

  const displayName = member.name ?? member.email;
  const status = !member.subscribed
    ? copy.panel.statusUnsubscribed
    : member.tier === "paying"
      ? copy.panel.statusPaying
      : copy.panel.statusGeneral;

  return (
    <>
      <SheetHeader>
        <TitleRow>
          <TitleBlock>
            {member.name ? (
              <>
                <Title>{member.name}</Title>
                <EmailLine>
                  {member.email}
                  <CopyEmailButton email={member.email} />
                </EmailLine>
              </>
            ) : (
              // No name: the email is the title, so it isn't repeated below.
              <TitleWithCopy>
                <Title>{member.email}</Title>
                <CopyEmailButton email={member.email} />
              </TitleWithCopy>
            )}
            <MetaLine>
              <Badge>{status}</Badge>
              <span>{copy.panel.added(formatDate(member.addedAt))}</span>
            </MetaLine>
          </TitleBlock>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuTrigger type="button" $variant="ghost" $size="sm" aria-label={copy.panel.menuLabel(displayName)}>
                <Icon icon={MoreVertical} size={16} />
              </MenuTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Icon icon={Pencil} size={16} />
                {copy.panel.menuEdit}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyEmail}>
                <Icon icon={Copy} size={16} />
                {copy.panel.menuCopyEmail}
              </DropdownMenuItem>
              {member.subscribed &&
                (member.tier === "general" ? (
                  <DropdownMenuItem onSelect={() => void convert()}>
                    <Icon icon={BadgeCheck} size={16} />
                    {copy.panel.menuConvert}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setConfirm("revoke");
                    }}
                  >
                    <Icon icon={BadgeMinus} size={16} />
                    {copy.panel.menuRemove}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              {member.subscribed ? (
                <DangerMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirm("unsubscribe");
                  }}
                >
                  <Icon icon={MailX} size={16} />
                  {copy.panel.menuUnsubscribe}
                </DangerMenuItem>
              ) : (
                <Tooltip content={copy.panel.restoreReason}>
                  <DropdownMenuItem disabled>
                    <Icon icon={MailPlus} size={16} />
                    {copy.panel.menuRestore}
                  </DropdownMenuItem>
                </Tooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TitleRow>
      </SheetHeader>

      <SheetBody>
        {editing && (
          <EditForm action={editAction} aria-label={copy.editForm.ariaLabel}>
            <Field label={copy.editForm.nameLabel} error={fieldError(editState, "name")}>
              {(p) => <Input {...p} name="name" defaultValue={member.name ?? ""} autoComplete="name" />}
            </Field>
            <Field label={copy.editForm.emailLabel} error={fieldError(editState, "email")} required>
              {(p) => <Input {...p} name="email" type="email" defaultValue={member.email} autoComplete="email" />}
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

        <MemberEmails memberId={member.id} />
      </SheetBody>

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
