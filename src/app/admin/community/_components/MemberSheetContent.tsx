"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { MoreVertical, UserMinus, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { updateMember } from "../_data/actions";
import type { Member, SentEmail } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { formatDate, initialsFor } from "../_lib/format";
import { getMemberEmails } from "../_lib/emailHistoryAction";
import { CopyEmailButton } from "./CopyEmailButton";
import { MemberConfirmDialog } from "./MemberConfirmDialog";
import { MemberEmailsTab } from "./MemberEmailsTab";
import { useMemberActions } from "./useMemberActions";

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  /* Clears the Sheet's built-in top-right close (×) button. */
  padding-right: var(--space-6);
`;

const TitleBlock = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 2px;
`;

// The Sheet's own SheetTitle reserves space for the built-in close (×)
// button; TitleRow already reserves that space for the whole header row, so
// this drops the (now redundant) padding to keep the title's own line tight.
const Title = styled(SheetTitle)`
  padding-right: 0;
`;

const EmailLine = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const CategoryLine = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
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

const TabBody = styled.div`
  padding-top: var(--space-4);
`;

export function MemberSheetContent({ member, onClose }: { member: Member; onClose: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"details" | "emails">("details");
  const [editState, editAction] = useActionState(updateMember.bind(null, member.id), idleState);

  const { copyEmail, convert, confirm, setConfirm, shownConfirm, runConfirm } = useMemberActions(member, onClose);

  const [emails, setEmails] = React.useState<SentEmail[] | null>(null);
  const [emailsError, setEmailsError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getMemberEmails(member.id)
      .then((result) => {
        if (!cancelled) setEmails(result);
      })
      .catch(() => {
        if (!cancelled) setEmailsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

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
  const category = !member.subscribed
    ? copy.panel.categoryUnsubscribed
    : member.tier === "paying"
      ? copy.panel.categoryPaying
      : copy.panel.categoryGeneral;

  const canConvertOrRemove = member.subscribed;

  return (
    <>
      <SheetHeader>
        <TitleRow>
          <Avatar initials={initialsFor(member.name, member.email)} />
          <TitleBlock>
            <Title>{displayName}</Title>
            {member.name && (
              <EmailLine>
                {member.email}
                <CopyEmailButton email={member.email} />
              </EmailLine>
            )}
            <CategoryLine>{category}</CategoryLine>
          </TitleBlock>
        </TitleRow>

        <HeaderActions>
          {canConvertOrRemove &&
            (member.tier === "general" ? (
              <Button type="button" onClick={() => void convert()}>
                <Icon icon={UserPlus} size={16} />
                {copy.panel.convertButton}
              </Button>
            ) : (
              <Button type="button" onClick={() => setConfirm("revoke")}>
                <Icon icon={UserMinus} size={16} />
                {copy.panel.removeButton}
              </Button>
            ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuTrigger type="button" $variant="ghost" $size="sm" aria-label={copy.panel.menuLabel(displayName)}>
                <Icon icon={MoreVertical} size={16} />
              </MenuTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={() => {
                  setActiveTab("details");
                  setEditing(true);
                }}
              >
                {copy.panel.menuEdit}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyEmail}>{copy.panel.menuCopyEmail}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {member.subscribed ? (
                <DangerMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirm("unsubscribe");
                  }}
                >
                  {copy.panel.menuUnsubscribe}
                </DangerMenuItem>
              ) : (
                <Tooltip content={copy.panel.restoreReason}>
                  <DropdownMenuItem disabled>{copy.panel.menuRestore}</DropdownMenuItem>
                </Tooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </HeaderActions>
      </SheetHeader>

      <SheetBody>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value === "emails" ? "emails" : "details")}>
          <TabsList aria-label={copy.panel.tabsAriaLabel(displayName)}>
            <TabsTrigger value="details">{copy.panel.tabDetails}</TabsTrigger>
            <TabsTrigger value="emails">
              {emails === null ? copy.panel.tabEmailsLoading : copy.panel.tabEmails(emails.length)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <TabBody>
              {editing ? (
                <EditForm action={editAction} aria-label={copy.editForm.ariaLabel}>
                  <Field label={copy.editForm.nameLabel} error={fieldError(editState, "name")}>
                    {(p) => <Input {...p} name="name" defaultValue={member.name ?? ""} autoComplete="name" />}
                  </Field>
                  <Field label={copy.editForm.emailLabel} error={fieldError(editState, "email")} required>
                    {(p) => <Input {...p} name="email" type="email" defaultValue={member.email} autoComplete="email" />}
                  </Field>
                  <FormActions>
                    <Button type="button" $variant="secondary" $size="sm" onClick={() => setEditing(false)}>
                      {copy.editForm.cancel}
                    </Button>
                    <SubmitButton $size="sm">{copy.editForm.save}</SubmitButton>
                  </FormActions>
                </EditForm>
              ) : (
                <DetailsList>
                  <DetailRow>
                    <DetailLabel>{copy.details.email}</DetailLabel>
                    <DetailValue>{member.email}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>{copy.details.category}</DetailLabel>
                    <DetailValue>{category}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>{copy.details.dateAdded}</DetailLabel>
                    <DetailValue>{formatDate(member.addedAt)}</DetailValue>
                  </DetailRow>
                </DetailsList>
              )}
            </TabBody>
          </TabsContent>

          <TabsContent value="emails">
            <TabBody>
              <MemberEmailsTab emails={emails} loading={emails === null && !emailsError} error={emailsError} />
            </TabBody>
          </TabsContent>
        </Tabs>
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
