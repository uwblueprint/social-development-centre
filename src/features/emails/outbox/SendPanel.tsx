"use client";

import { useEffect, useRef, useState } from "react";
import { styled } from "next-yak";
import {
  Ban,
  Check,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Send as SendIcon,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { EmailEditor, EmailPreview } from "../editor";
import { useEmails } from "../store";
import { ADMINS, EXCLUSION_REASON } from "../model";
import type { EmailContent, Member } from "../model";
import { Notice } from "./Notice";
import { useSendActions } from "./actions";
import { DontSendDialog } from "./Confirmations";
import {
  approveWhen,
  contentOf,
  fullName,
  lockedByOther,
  plural,
  sourceInfo,
  undoLeft,
} from "./helpers";

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 40rem;
  padding: var(--space-2) 0 var(--space-4) var(--space-2);
  color: var(--color-text);
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1) var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
`;

const To = styled.span`
  color: var(--color-text);
`;

const Quiet = styled.span`
  color: var(--color-text-muted);
  font-weight: var(--weight-regular);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const When = styled.span`
  margin-right: auto;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
`;

export type Guard = (next: () => void) => void;

type Inactive = Exclude<Member["status"], "active">;

/**
 * One recipient's email, inline under their row: the exact message they'll get and every action on it.
 * Also the edit session: editing pauses the send and takes a 30-minute lock; nothing is saved until Update.
 */
export function SendPanel({
  sendId,
  batchMembers,
  registerGuard,
  autoEdit,
}: {
  sendId: string;
  batchMembers: Member[];
  registerGuard: (guard: Guard | null) => void;
  /** Opens straight into the editor (the batch menu's "Edit for everyone"). */
  autoEdit?: "one" | "batch";
}) {
  const api = useEmails();
  const { toast } = useToast();
  const actions = useSendActions();
  const send = api.state.sends.find((s) => s.id === sendId);
  const member = send ? api.member(send.memberId) : undefined;
  const info = send ? sourceInfo(api, send) : undefined;

  const [editing, setEditing] = useState(false);
  const [scope, setScope] = useState<"one" | "batch">("one");
  const [draft, setDraft] = useState<EmailContent | null>(null);
  const [other, setOther] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [askOverwrite, setAskOverwrite] = useState(false);
  const [askReset, setAskReset] = useState(false);
  const [askDontSend, setAskDontSend] = useState(false);
  const [leaveNext, setLeaveNext] = useState<null | (() => void)>(null);
  const editingRef = useRef(false);
  const autoStarted = useRef<string | null>(null);

  const base = send ? contentOf(api, send) : null;
  const dirty =
    editing &&
    !!draft &&
    !!base &&
    (draft.subject !== base.subject || draft.bodyHtml !== base.bodyHtml);
  const dirtyRef = useRef(false);

  const start = (next: "one" | "batch") => {
    if (!send) return;
    setSaveError(null);
    const res = api.openForEdit(send.id);
    if (!res.ok) {
      setOther(res.by);
      return;
    }
    setOther(null);
    setScope(next);
    setDraft(contentOf(api, send));
    setEditing(true);
  };

  const discard = () => {
    if (!send) return;
    api.closeEdit(send.id);
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  };
  const discardRef = useRef(discard);
  useEffect(() => {
    editingRef.current = editing;
    dirtyRef.current = dirty;
    discardRef.current = discard;
  });

  // One-off emails inside their 1-minute window open paused, already editing (the toast's "Update email");
  // the batch menu's "Edit for everyone" also opens straight into the editor.
  useEffect(() => {
    if (!send || editing || autoStarted.current === send.id) return;
    if (send.undo?.action === "one-off" && !lockedByOther(send, api.now)) {
      autoStarted.current = send.id;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening a one-off paused is a response to the store's undo window
      start("batch");
    } else if (autoEdit && !lockedByOther(send, api.now)) {
      autoStarted.current = send.id;
      start(autoEdit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [send, editing, api.now]);

  // Leaving: the list asks this guard before it switches recipient or collapses.
  useEffect(() => {
    registerGuard((next) => {
      if (!editingRef.current) return next();
      if (dirtyRef.current) return setLeaveNext(() => next);
      discardRef.current();
      next();
    });
    return () => registerGuard(null);
  }, [registerGuard]);

  // Unmounting (collapsed, route change) discards the edit and releases the lock.
  useEffect(() => {
    return () => {
      if (editingRef.current) api.closeEdit(sendId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendId]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const batchEdited = send ? api.batchEditedCount(send.id) : 0;

  const update = async (overwriteEdited?: boolean) => {
    if (!send || !draft) return;
    setSaving(true);
    setSaveError(null);
    const res = await api.updateSend(send.id, draft, {
      scope,
      overwriteEdited,
    });
    setSaving(false);
    if (!res.ok) {
      setSaveError(res.error);
      return;
    }
    setAskOverwrite(false);
    api.closeEdit(send.id);
    setEditing(false);
    setDraft(null);
    toast({
      title:
        scope === "batch"
          ? `Updated “${info?.name}” for ${plural(batchMembers.length, "member")}`
          : `Updated “${info?.name}” for ${fullName(member)}`,
    });
  };

  const onUpdate = () => {
    if (scope === "batch" && batchEdited > 0) setAskOverwrite(true);
    else void update();
  };

  if (!send || !member || !info || !base) {
    return (
      <Stack>
        <Notice tone="warning">No longer in the Outbox</Notice>
      </Stack>
    );
  }

  const holder = lockedByOther(send, api.now);
  const inactive = member.status !== "active";
  const inUndo = !!send.undo && undoLeft(send, api.now) > 0;
  const pausedByMe = !editing && send.lock?.by === ADMINS.me;
  const needsReview = send.status === "waiting-review";
  const canAct = !editing && !holder && !saving;
  const oneOffEdit = editing && info.oneOff && send.undo?.action === "one-off";
  // The scope choice only matters once other members have their own edits.
  const showScope =
    editing &&
    !oneOffEdit &&
    batchMembers.length > 1 &&
    (batchEdited > 0 || scope === "batch");
  const err = actions.error ?? saveError;

  return (
    <Stack>
      <Meta>
        <To>
          To {fullName(member)} <Quiet>· {member.email}</Quiet>
        </To>
        {send.missedDueAt && (
          <Badge $variant="neutral">Missed while unpublished</Badge>
        )}
      </Meta>

      {inactive && (
        <Notice>{EXCLUSION_REASON[member.status as Inactive]}</Notice>
      )}
      {(holder || other) && (
        <Notice tone="warning">{holder ?? other} has this open</Notice>
      )}
      {pausedByMe && (
        <Notice
          tone="warning"
          actions={
            <Button
              type="button"
              $variant="secondary"
              $size="sm"
              onClick={() => api.closeEdit(send.id)}
            >
              Discard changes
            </Button>
          }
        >
          Paused from an earlier edit
        </Notice>
      )}
      {inUndo && !editing && send.undo?.action !== "one-off" && (
        <Notice
          actions={
            <Button
              type="button"
              $variant="secondary"
              $size="sm"
              onClick={() => void actions.undo([send], info.name)}
            >
              Undo
            </Button>
          }
        >
          {undoLeft(send, api.now)}s left to undo
        </Notice>
      )}
      {err && <Notice tone="danger">{err}</Notice>}
      {api.lab.offline && <Notice tone="warning">Offline</Notice>}

      {editing && draft ? (
        <>
          {showScope && (
            <ToggleGroup
              type="single"
              value={scope}
              onValueChange={(v) => v && setScope(v as "one" | "batch")}
              aria-label="Apply to"
            >
              <ToggleGroupItem value="one">
                {member.firstName || "This member"} only
              </ToggleGroupItem>
              <ToggleGroupItem value="batch">
                Everyone ({batchMembers.length})
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          <EmailEditor
            value={draft}
            onChange={setDraft}
            moment={info.moment}
            context="outbox"
            previewMembers={
              scope === "batch" ? batchMembers.slice(0, 20) : [member]
            }
          />
        </>
      ) : (
        <EmailPreview
          content={base}
          member={member}
          moment={info.moment}
          inbox={false}
        />
      )}

      <Actions>
        {editing ? (
          <>
            <Button
              type="button"
              $variant="secondary"
              onClick={() => (dirty ? setLeaveNext(() => discard) : discard())}
              disabled={saving}
            >
              <Icon icon={X} size={16} />
              Discard
            </Button>
            {oneOffEdit && (
              <Button
                type="button"
                $variant="secondary"
                disabled={saving}
                onClick={async () => {
                  if (dirty && draft) {
                    const r = await api.updateSend(send.id, draft, {
                      scope: "batch",
                    });
                    if (!r.ok) return setSaveError(r.error);
                  }
                  api.closeEdit(send.id);
                  setEditing(false);
                  const same = api.state.sends.filter(
                    (s) =>
                      s.source.kind === "one-off" &&
                      s.undo?.action === "one-off",
                  );
                  await actions.sendNow(same.length ? same : [send], info.name);
                }}
              >
                <Icon icon={SendIcon} size={16} />
                Send now
              </Button>
            )}
            <Button
              type="button"
              onClick={onUpdate}
              disabled={saving || api.lab.offline}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        ) : (
          <>
            {needsReview && !send.couldntSend && (
              <When>Sends {approveWhen(send, api.now).label}</When>
            )}
            <Button
              type="button"
              $variant="secondary"
              onClick={() => start("one")}
              disabled={!canAct || inactive}
            >
              <Icon icon={Pencil} size={16} />
              Edit
            </Button>
            {send.couldntSend ? (
              <Button
                type="button"
                onClick={() => void actions.retry(send, info.name)}
                disabled={!canAct || actions.busy || inactive}
              >
                <Icon icon={RotateCcw} size={16} />
                Retry
              </Button>
            ) : needsReview ? (
              <Button
                type="button"
                onClick={() => void actions.approve([send], info.name)}
                disabled={!canAct || actions.busy || inactive}
              >
                <Icon icon={Check} size={16} />
                Approve
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void actions.sendNow([send], info.name)}
                disabled={!canAct || actions.busy || inactive}
              >
                <Icon icon={SendIcon} size={16} />
                Send now
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  $variant="ghost"
                  aria-label="More actions"
                  disabled={!canAct}
                >
                  <Icon icon={MoreHorizontal} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {needsReview && !send.couldntSend && (
                  <DropdownMenuItem
                    disabled={actions.busy || inactive || api.lab.offline}
                    onSelect={() =>
                      void actions.approve([send], info.name, { now: true })
                    }
                  >
                    <Icon icon={SendIcon} size={16} />
                    Approve and send now
                  </DropdownMenuItem>
                )}
                {send.editedContent && (
                  <DropdownMenuItem onSelect={() => setAskReset(true)}>
                    <Icon icon={RotateCcw} size={16} />
                    Reset to original
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  $variant="danger"
                  disabled={actions.busy}
                  onSelect={() => setAskDontSend(true)}
                >
                  <Icon icon={Ban} size={16} />
                  Don’t send
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </Actions>

      <Dialog open={askOverwrite} onOpenChange={setAskOverwrite}>
        <DialogContent>
          <DialogTitle>
            Replace {plural(batchEdited, "edited email")}?
          </DialogTitle>
          <DialogDescription>
            {plural(batchEdited, "member")} already{" "}
            {batchEdited === 1 ? "has" : "have"} their own edit.
          </DialogDescription>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              $variant="secondary"
              disabled={saving}
              onClick={() => void update(true)}
            >
              Replace their edits
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void update(false)}
            >
              Keep their edits
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!leaveNext}
        onOpenChange={(o) => !o && setLeaveNext(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            {fullName(member)}’s email has unsaved changes.
          </AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                Keep editing
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                $variant="danger"
                onClick={() => {
                  const next = leaveNext;
                  discardRef.current();
                  setLeaveNext(null);
                  next?.();
                }}
              >
                Discard changes
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={askReset} onOpenChange={setAskReset}>
        <AlertDialogContent>
          <AlertDialogTitle>Reset to original?</AlertDialogTitle>
          <AlertDialogDescription>{fullName(member)}</AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                onClick={async () => {
                  const r = await api.resetToOriginal(send.id);
                  if (!r.ok) setSaveError(r.error);
                  else
                    toast({
                      title: `Reset ${fullName(member)}’s “${info.name}” to the original`,
                    });
                }}
              >
                Reset to original
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>

      <DontSendDialog
        open={askDontSend}
        onOpenChange={setAskDontSend}
        sends={[send]}
        name={info.name}
        onConfirm={() => actions.dontSend([send], info.name)}
      />
    </Stack>
  );
}
