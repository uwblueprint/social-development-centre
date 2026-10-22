"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import {
  Check,
  CircleAlert,
  Eye,
  MoreHorizontal,
  Send as SendIcon,
  TestTube2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { ListPage } from "@/components/patterns/ListPage";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import {
  EmailEditor,
  EmailPreview,
  checkEmail,
  type CheckIssue,
} from "../editor";
import type { Audience, EmailContent, Member, OneOffEmail } from "../model";
import { useEmails } from "../store";
import { AudienceSection } from "./AudienceSection";
import {
  ONE_OFF,
  copy,
  memberName,
  members as membersWord,
  toWhom,
} from "./copy";
import { RecipientsSheet } from "./RecipientsSheet";
import { Row, Stack } from "./parts";

type SaveState = "saved" | "saving" | "error";

interface Draft {
  content: EmailContent;
  audience: Audience;
  removedIds: string[];
}

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  min-height: 36px;
`;

const Spacer = styled.div`
  flex: 1 1 auto;
`;

const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 720px;
  min-width: 0;
`;

const LimitLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text);

  & > svg {
    color: var(--color-warning);
    flex: none;
  }
`;

const ErrorLine = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

export function ComposeOneOff({ oneOff }: { oneOff: OneOffEmail }) {
  const api = useEmails();
  const router = useRouter();
  const { toast } = useToast();
  const id = oneOff.id;

  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  });

  /* ---------- the draft and its autosave ---------- */
  const [draft, setDraft] = useState<Draft>({
    content: oneOff.content,
    audience: oneOff.audience,
    removedIds: oneOff.removedIds,
  });
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [issues, setIssues] = useState<CheckIssue[]>([]);
  const latest = useRef(draft);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inflight = useRef<Promise<boolean> | null>(null);

  /* Saves until nothing is left unsaved; one save at a time so an older save can't land after a newer one. */
  const flush = useCallback((): Promise<boolean> => {
    clearTimeout(timer.current);
    if (inflight.current) return inflight.current;
    const run = async (): Promise<boolean> => {
      while (dirty.current) {
        const snap = latest.current;
        setSaveState("saving");
        const r = await apiRef.current.updateOneOff(id, snap);
        if (!r.ok) {
          setSaveState("error");
          return false;
        }
        if (latest.current === snap) dirty.current = false;
      }
      setSaveState("saved");
      return true;
    };
    inflight.current = run().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
  }, [id]);

  const edit = useCallback(
    (patch: Partial<Draft>) => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      dirty.current = true;
      setDraft(next);
      setIssues([]);
      setSaveState("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 800);
    },
    [flush],
  );

  /* Leaving the page with unsaved changes saves them. */
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (dirty.current) void apiRef.current.updateOneOff(id, latest.current);
    },
    [id],
  );

  /* ---------- audience ---------- */
  const result = api.resolveAudience(draft.audience, draft.removedIds);
  const fullMatch = api.resolveAudience(draft.audience, []).recipients;
  const removed = fullMatch.filter((m) => draft.removedIds.includes(m.id));
  const recipients = result.recipients;
  const count = recipients.length;
  const overLimit = api.overLimitFor(recipients.map((m) => m.id));
  const overLimitIds = new Set(overLimit.map((m) => m.id));
  const noRecipients = count === 0;

  const changeAudience = (next: Audience, opts?: { resetRemoved?: boolean }) =>
    edit({ audience: next, ...(opts?.resetRemoved ? { removedIds: [] } : {}) });
  const removeMember = (mid: string) => {
    if (draft.audience.kind === "hand") {
      edit({
        audience: {
          kind: "hand",
          memberIds: draft.audience.memberIds.filter((x) => x !== mid),
        },
      });
    } else {
      edit({ removedIds: [...draft.removedIds, mid] });
    }
  };
  const addBack = (mid: string) =>
    edit({ removedIds: draft.removedIds.filter((x) => x !== mid) });

  /* ---------- sheets, test, send, delete ---------- */
  const [list, setList] = useState<{ open: boolean; mode: "all" | "limit" }>({
    open: false,
    mode: "all",
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewId, setPreviewId] = useState("");
  const [testing, setTesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const previewMember: Member | undefined =
    recipients.find((m) => m.id === previewId) ?? recipients[0];
  const subjectName = draft.content.subject.trim() || copy.noSubject;
  const countLabel = noRecipients ? "No one" : membersWord(count);

  const sendTest = async () => {
    setTesting(true);
    const r = await api.sendTest(draft.content);
    setTesting(false);
    toast({
      title: r.ok ? "Test sent to your inbox" : r.error || copy.testFailed,
    });
  };

  const askToSend = () => {
    const found = checkEmail(draft.content);
    setIssues(found);
    if (found.length > 0) return;
    setSendError(null);
    setConfirmOpen(true);
  };

  const confirmSend = async () => {
    setSending(true);
    setSendError(null);
    const saved = await flush();
    if (!saved) {
      setSending(false);
      setSendError(
        "Your last changes didn’t save, so nothing was sent. Try again.",
      );
      return;
    }
    const r = await api.sendOneOff(id);
    setSending(false);
    if (!r.ok) {
      setSendError(r.error);
      return;
    }
    dirty.current = false;
    setConfirmOpen(false);
    toast({
      title: `Sent to ${membersWord(count)}`,
      actionLabel: "Undo",
      onAction: () =>
        void apiRef.current
          .undoOneOff(id)
          .then((u) => u.ok && router.push(`${ONE_OFF}/${id}`)),
    });
    router.push(`${ONE_OFF}?tab=sent`);
  };

  /* Leaving by the sidebar (there is no back button) still saves the last edits. */
  useEffect(
    () => () => {
      if (dirty.current) void flush();
    },
    [flush],
  );

  const deleteDraft = async () => {
    const r = await api.deleteOneOff(id);
    setDeleteOpen(false);
    if (!r.ok) {
      setSendError(r.error);
      return;
    }
    dirty.current = false;
    clearTimeout(timer.current);
    toast({ title: "Draft deleted" });
    router.push(ONE_OFF);
  };

  return (
    <ListPage>
      <Bar>
        <Badge>Draft</Badge>
        <div role="status" aria-live="polite">
          {saveState === "saving" && <Status>Saving…</Status>}
          {saveState === "saved" && (
            <Status>
              <Icon icon={Check} size={14} /> Saved
            </Status>
          )}
          {saveState === "error" && (
            <Status>
              <Icon icon={CircleAlert} size={14} /> Not saved
              <Button
                type="button"
                $variant="outline"
                $size="sm"
                onClick={() => void flush()}
              >
                Retry
              </Button>
            </Status>
          )}
        </div>
        <Spacer />
        <Row>
          <Button
            type="button"
            $variant="secondary"
            disabled={noRecipients}
            onClick={() => {
              setPreviewId(recipients[0]?.id ?? "");
              setPreviewOpen(true);
            }}
          >
            <Icon icon={Eye} size={16} />
            Preview
          </Button>
          <DisabledReason
            reason={noRecipients ? "Add at least one recipient." : null}
          >
            <Button type="button" disabled={noRecipients} onClick={askToSend}>
              <Icon icon={SendIcon} size={16} />
              {noRecipients ? "Send" : `Send to ${membersWord(count)}`}
            </Button>
          </DisabledReason>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                $variant="ghost"
                $size="sm"
                aria-label="More actions"
              >
                <Icon icon={MoreHorizontal} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={testing} onSelect={sendTest}>
                <Icon icon={TestTube2} size={16} />
                Send test
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                $variant="danger"
                onSelect={() => setDeleteOpen(true)}
              >
                <Icon icon={Trash2} size={16} />
                Delete draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Row>
      </Bar>

      <Column>
        <AudienceSection
          audience={draft.audience}
          members={api.state.members}
          now={api.now}
          countLabel={countLabel}
          onChange={changeAudience}
          onOpenList={() => setList({ open: true, mode: "all" })}
        />

        <EmailEditor
          value={draft.content}
          onChange={(content) => edit({ content })}
          context="one-off"
          issues={issues}
        />

        {overLimit.length > 0 && (
          <LimitLine role="status">
            <Icon icon={TriangleAlert} size={16} />
            {membersWord(overLimit.length)} will pass the monthly limit
            <Button
              type="button"
              $variant="ghost"
              $size="sm"
              onClick={() => setList({ open: true, mode: "limit" })}
            >
              View
            </Button>
          </LimitLine>
        )}
        {sendError && !confirmOpen && (
          <ErrorLine role="alert">
            <Icon icon={CircleAlert} size={16} />
            {sendError}
          </ErrorLine>
        )}
      </Column>

      <RecipientsSheet
        open={list.open}
        onOpenChange={(o) => !o && setList((l) => ({ ...l, open: false }))}
        mode={list.mode}
        result={result}
        removed={removed}
        overLimitIds={overLimitIds}
        onRemove={removeMember}
        onAddBack={addBack}
      />

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent size="wide" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Preview</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <Stack>
              <Select
                aria-label="Preview as"
                value={previewMember?.id ?? ""}
                onValueChange={setPreviewId}
                options={recipients.map((m) => ({
                  value: m.id,
                  label: `${memberName(m)} (${m.email})`,
                }))}
              />
              {previewMember && (
                <EmailPreview content={draft.content} member={previewMember} />
              )}
            </Stack>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(o) => !sending && setConfirmOpen(o)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Send to {membersWord(count)}?</AlertDialogTitle>
          <AlertDialogDescription>
            “{subjectName}” · {toWhom(draft.audience)}
            {sendError ? ` · ${sendError}` : ""}
          </AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary" disabled={sending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                disabled={sending}
                onClick={(e) => {
                  e.preventDefault();
                  void confirmSend();
                }}
              >
                {sending ? "Sending…" : "Send"}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
          <AlertDialogDescription>{subjectName}</AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                $variant="danger"
                onClick={() => void deleteDraft()}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </ListPage>
  );
}
