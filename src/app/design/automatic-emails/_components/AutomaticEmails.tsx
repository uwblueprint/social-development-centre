"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { type AutomaticEmail, SEED, displayName, newEmail, previewFor } from "../_data";
import { EmailEditor } from "./EmailEditor";
import { EmailList } from "./EmailList";

export type SaveStatus = "saved" | "saving" | "error";
type ModalKind = "publish" | "unpublish" | "trash" | "leave";

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}
function snapshotAll(list: AutomaticEmail[]) {
  return Object.fromEntries(list.map((e) => [e.id, clone(e)]));
}

/** Prototype scenarios come from the URL: `?empty` starts with no emails, `?failSaves` makes every save fail. */
export function AutomaticEmails({ empty, failSaves }: { empty: boolean; failSaves: boolean }) {
  return (
    <AppToastProvider>
      <Screen empty={empty} failSaves={failSaves} />
    </AppToastProvider>
  );
}

function Screen({ empty, failSaves }: { empty: boolean; failSaves: boolean }) {
  const { toast } = useToast();
  const [emails, setEmails] = useState<AutomaticEmail[]>(() => (empty ? [] : clone(SEED)));
  const [lastSaved, setLastSaved] = useState<Record<string, AutomaticEmail>>(() => snapshotAll(emails));
  const [editId, setEditId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SaveStatus>("saved");
  const [modal, setModal] = useState<{ kind: ModalKind; id: string } | null>(null);
  const [nextId, setNextId] = useState(6);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(saveTimer.current), []);
  // The save timer reads the latest edits when it fires, not the ones from when it started.
  const emailsRef = useRef(emails);
  useEffect(() => {
    emailsRef.current = emails;
  }, [emails]);

  const cur = emails.find((e) => e.id === editId);

  function patchEmail(id: string, patch: Partial<AutomaticEmail>) {
    setEmails((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  // Simulated save. `failSaves` makes every attempt fail; a manual save also confirms with a toast.
  function save(id: string, manual = false) {
    clearTimeout(saveTimer.current);
    setSaved("saving");
    saveTimer.current = setTimeout(
      () => {
        if (failSaves) {
          setSaved("error");
          if (manual) toast({ title: "Couldn't save the draft. Your text is still here." });
          return;
        }
        const e = emailsRef.current.find((x) => x.id === id);
        if (e) setLastSaved((snap) => ({ ...snap, [id]: clone(e) }));
        setSaved("saved");
        if (manual) toast({ title: "Draft saved. It won't send until you publish." });
      },
      manual ? 400 : 700,
    );
  }

  function update(patch: Partial<AutomaticEmail>) {
    if (!editId) return;
    patchEmail(editId, patch);
    save(editId);
  }

  function open(id: string) {
    setEditId(id);
    setSaved("saved");
  }

  function create() {
    const id = `e${nextId}`;
    const e = newEmail(id);
    setEmails((list) => [...list, e]);
    setLastSaved((snap) => ({ ...snap, [id]: clone(e) }));
    setNextId((n) => n + 1);
    open(id);
  }

  function duplicate(e: AutomaticEmail) {
    const id = `e${nextId}`;
    const copy: AutomaticEmail = {
      ...clone(e),
      id,
      name: `Copy of ${e.name}`,
      state: "draft",
      edited: 0,
      approved: 0,
      waiting: 0,
      wasPublished: false,
    };
    setEmails((list) => [...list, copy]);
    setLastSaved((snap) => ({ ...snap, [id]: clone(copy) }));
    setNextId((n) => n + 1);
    open(id);
    toast({ title: `Draft copy of “${displayName(e)}” created` });
  }

  function restore(e: AutomaticEmail) {
    patchEmail(e.id, { state: "draft" });
    toast({ title: `“${displayName(e)}” restored to Drafts` });
  }

  function leave() {
    if (saved !== "saved" && editId) setModal({ kind: "leave", id: editId });
    else setEditId(null);
  }

  function confirm() {
    if (!modal) return;
    const e = emails.find((x) => x.id === modal.id);
    setModal(null);
    if (!e) return;
    if (modal.kind === "unpublish") {
      patchEmail(e.id, { state: "draft", wasPublished: true, waiting: e.waiting + e.approved, approved: 0, edited: 0 });
      toast({ title: "Unpublished. Sending is paused until you publish again." });
    } else if (modal.kind === "publish") {
      patchEmail(e.id, { state: "published" });
      toast({ title: "Published. It starts sending on schedule." });
    } else if (modal.kind === "trash") {
      patchEmail(e.id, { state: "trash" });
      setEditId(null);
      toast({ title: `“${displayName(e)}” moved to trash` });
    } else {
      clearTimeout(saveTimer.current);
      const last = lastSaved[e.id];
      if (last) patchEmail(e.id, clone(last));
      setEditId(null);
      setSaved("saved");
      toast({ title: "Unsaved changes discarded" });
    }
  }

  const modalEmail = modal && emails.find((x) => x.id === modal.id);

  return (
    <>
      {cur ? (
        <EmailEditor
          key={cur.id}
          email={cur}
          saved={saved}
          onUpdate={update}
          onBack={leave}
          onRetrySave={() => save(cur.id)}
          onSaveDraft={() => save(cur.id, true)}
          onAsk={(kind) => setModal({ kind, id: cur.id })}
          onRestore={() => restore(cur)}
        />
      ) : (
        <EmailList
          emails={emails}
          onCreate={create}
          onOpen={open}
          onDuplicate={duplicate}
          onRestore={restore}
          onTrash={(e) => setModal({ kind: "trash", id: e.id })}
        />
      )}

      <AlertDialog open={!!modalEmail} onOpenChange={(isOpen) => !isOpen && setModal(null)}>
        {modal && modalEmail && <ConfirmContent kind={modal.kind} email={modalEmail} onConfirm={confirm} />}
      </AlertDialog>
    </>
  );
}

function confirmCopy(kind: ModalKind, e: AutomaticEmail) {
  const name = displayName(e);
  if (kind === "unpublish") {
    const lines = ["Sending stops until you publish again."];
    if (e.edited) lines.push(`${e.edited}${e.edited === 1 ? " email you edited in the Outbox" : " emails you edited in the Outbox"} will lose those edits.`);
    if (e.approved) lines.push(`${e.approved}${e.approved === 1 ? " email you approved needs" : " emails you approved need"} approval again.`);
    if (e.waiting) lines.push(`${e.waiting}${e.waiting === 1 ? " email waiting for review comes" : " emails waiting for review come"} back when you publish.`);
    return { title: `Unpublish “${name}”?`, lines, confirm: "Unpublish", cancel: "Cancel", danger: false };
  }
  if (kind === "publish") {
    const n = previewFor(e).length;
    const lines = [n ? `${n}${n === 1 ? " member is" : " members are"} scheduled as normal.` : "No one is scheduled yet. Members get it when the trigger happens."];
    if (e.wasPublished) {
      const back = e.waiting + e.approved;
      if (back) lines.push(`${back}${back === 1 ? " email comes" : " emails come"} back for review.`);
      lines.push("2 members missed this email while it was unpublished. They wait for your approval in Waiting for you.");
    }
    return { title: `Publish “${name}”?`, lines, confirm: "Publish", cancel: "Cancel", danger: false };
  }
  if (kind === "trash") {
    return {
      title: `Move “${name}” to trash?`,
      lines: ["Future sends stop and are marked Not sent. You can restore it from Trash later, with its send history."],
      confirm: "Move to trash",
      cancel: "Cancel",
      danger: true,
    };
  }
  return {
    title: "Leave without saving?",
    lines: [
      `Your latest changes to “${name}” haven't saved yet.`,
      "If you leave now, they're lost and the email goes back to its last saved version.",
    ],
    confirm: "Leave anyway",
    cancel: "Stay and keep editing",
    danger: true,
  };
}

function ConfirmContent({ kind, email, onConfirm }: { kind: ModalKind; email: AutomaticEmail; onConfirm: () => void }) {
  const copy = confirmCopy(kind, email);
  return (
    <AlertDialogContent>
      <AlertDialogTitle>{copy.title}</AlertDialogTitle>
      {copy.lines.map((line) => (
        <AlertDialogDescription key={line}>{line}</AlertDialogDescription>
      ))}
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button $variant="outline">{copy.cancel}</Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button $variant={copy.danger ? "danger" : "primary"} onClick={onConfirm}>
            {copy.confirm}
          </Button>
        </AlertDialogAction>
      </AlertDialogActions>
    </AlertDialogContent>
  );
}
