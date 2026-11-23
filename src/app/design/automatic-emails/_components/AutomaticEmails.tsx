"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { ErrorIcon } from "@/components/ui/Field";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { Tag as TagIcon } from "lucide-react";
import { styled } from "next-yak";
import { useLabLoad, useStateLab } from "../../_state-lab/useStateLab";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { type AutomaticEmail, SEED, TAGS, audienceSentence, tagColor, displayName, effectiveAudience, isDiscardable, upcomingRecipients, missingAttachment, newEmail, timingPhrase } from "../_data";
import { EmailEditor, PickRow } from "./EmailEditor";
import { Notice, Page, PageTitle } from "./parts";
import { EmailList } from "./EmailList";
import { MemberRows } from "./parts";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

/** "idle": a new email nobody has touched yet, so there is nothing saved to report. */
export type SaveStatus = "idle" | "saved" | "saving" | "error";
type ModalKind = "publish" | "unpublish" | "leave" | "split";

/** How long "Undo" works after moving an email to trash. The server call is held back this long. */
const UNDO_MS = 5000;

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}
/** Comparable form of a field: empty docs, "", 0 and missing all count as blank. */
function norm(v: unknown) {
  const json = JSON.stringify(v ?? null);
  // Only rich-text docs can be blank; other objects (like the audience) always count.
  const blankDoc = typeof v === "object" && v !== null && json.includes('"type":"doc"') && !/"type":"(text|personalizedText|emailImage|image)"/.test(json);
  return v == null || v === "" || v === 0 || blankDoc ? "" : json;
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

/** The demo keeps its emails for this browser tab, so a reload (or a code change while reviewing) doesn't lose a new draft. */
const DEMO_KEY = "sdc-design-automatic-emails";

/** Long names and descriptions, for the Long text state. */
function longText(e: AutomaticEmail): AutomaticEmail {
  return {
    ...e,
    name: `${e.name}: a much longer name someone typed to tell this email apart from every other one the team has ever written`.slice(0, 200),
    description: `${e.description ?? ""} It also says a lot more than usual, so it runs far past the end of the row and right up to the limit`.slice(0, 80),
  };
}

function Screen({ empty: emptyProp, failSaves: failSavesProp }: { empty: boolean; failSaves: boolean }) {
  const { toast } = useToast();
  const lab = useStateLab({
    data: [
      { id: "tags-failed", label: "Couldn't load tags", description: "The emails load but the tag list doesn't: the chips say so and offer Try again; pills still show tag names." },
      { id: "published-empty", label: "No published emails", description: "Nothing is published: Published is empty and offers Go to drafts." },
      { id: "drafts-empty", label: "No drafts", description: "Every email is published or in trash: Drafts is empty and offers New automatic email." },
      { id: "trash-empty", label: "Trash is empty", description: "Nothing has been moved to trash: Trash is empty, with no action." },
    ],
    actions: [
      { id: "duplicate-failed", label: "Couldn't duplicate", description: "The copy isn't made: a banner over the list says so, with Try again." },
      { id: "split-failed", label: "Couldn't split", description: "Split email fails: the dialog stays open with the error and the chosen tag." },
      { id: "publish-failed", label: "Couldn't publish", description: "Publish fails: the dialog stays open with the error; the email stays a draft." },
      { id: "trash-failed", label: "Couldn't move to trash", description: "Move to trash fails: a banner over the list says so, with Try again; the email stays where it was." },
      {
        id: "handover-failed",
        label: "Split published, original not updated",
        description: "A split version publishes but the original doesn't start leaving its tag out: people with the tag could get both. The new version says so, with Try again.",
      },
    ],
    notApplicable: ["noPermission", "sessionExpired", "offline", "reconnecting", "readOnly", "sectionFailed", "sectionEmpty", "partialData", "staleData", "singleItem", "conflict", "rateLimited", "actionDenied", "undoExpired", "validationError", "saving"],
  });
  const [banner, setBanner] = useState<ReactNode>(null);
  const load = useLabLoad(lab);
  const empty = emptyProp || lab.empty;
  const failSaves = failSavesProp || lab.saveFailed;
  const [emails, setEmails] = useState<AutomaticEmail[]>(() => (emptyProp ? [] : clone(SEED)));
  const restored = useRef(false);
  useEffect(() => {
    // Read storage once: in development React runs effects twice, and a second read would see the
    // starting data the save below has just written, losing the restored drafts.
    if (emptyProp || restored.current) return;
    try {
      const saved = sessionStorage.getItem(DEMO_KEY);
      // Restoring after the first render keeps the server and browser markup the same.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setEmails(JSON.parse(saved) as AutomaticEmail[]);
    } catch {
      // No storage (private window): the demo starts fresh each load.
    }
    restored.current = true;
  }, [emptyProp]);
  const firstSave = useRef(true);
  useEffect(() => {
    if (!restored.current) return;
    // Skip the save in the same pass as the restore: state still holds the starting data then.
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    try {
      sessionStorage.setItem(DEMO_KEY, JSON.stringify(emails));
    } catch {
      // Ignore: storage is a convenience for reviewing.
    }
  }, [emails]);
  const [, setLastSaved] = useState<Record<string, AutomaticEmail>>(() => snapshotAll(emails));
  // Which email is open lives in the URL (?email=…), so the browser's back button returns to the list
  // with its tab and tag filter as they were.
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const editId = params.get("email");
  const goTo = (email: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (email) next.set("email", email);
    else next.delete("email");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };
  const [saved, setSaved] = useState<SaveStatus>("saved");
  const [modal, setModal] = useState<{ kind: ModalKind; id: string } | null>(null);
  // New ids continue after the highest one in use, so restored emails never collide with new ones.
  const newId = () => `e${Math.max(99, ...emailsRef.current.map((e) => Number(e.id.replace(/\D/g, "")) || 0)) + 1}`;
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
          // A failed save shows inline in the editor (errors aren't toasts: they can vanish unread).
          setSaved("error");
          return;
        }
        const e = emailsRef.current.find((x) => x.id === id);
        if (e) setLastSaved((snap) => ({ ...snap, [id]: clone(e) }));
        setSaved("saved");
        if (manual && e) toast({ title: `“${displayName(e)}” saved as a draft`, description: "It won't send until you publish it." });
      },
      manual ? 400 : 700,
    );
  }

  function update(patch: Partial<AutomaticEmail>) {
    if (!editId) return;
    // The editors report their content once on mount; only a real change counts as an edit worth saving.
    const current = emailsRef.current.find((e) => e.id === editId) as Record<string, unknown> | undefined;
    const changed = Object.entries(patch).some(([k, v]) => norm(current?.[k]) !== norm(v));
    if (!changed) return;
    patchEmail(editId, patch);
    save(editId);
  }

  function open(id: string, fresh = false) {
    setSaved(fresh ? "idle" : "saved");
    goTo(id);
  }

  /* Focus follows the page (WAI-ARIA, GOV.UK): opening an email starts at the top with focus on its
     title (the title field for a draft), and coming back puts focus on the email you opened. */
  const lastOpened = useRef<string | null>(null);
  useEffect(() => {
    if (editId) {
      window.scrollTo({ top: 0 });
      lastOpened.current = editId;
      (document.getElementById("title-input") ?? document.getElementById("editor-title"))?.focus();
    } else if (lastOpened.current) {
      document.querySelector<HTMLButtonElement>(`[data-email-id="${lastOpened.current}"]`)?.focus();
      lastOpened.current = null;
    }
  }, [editId]);

  function create() {
    const id = newId();
    const e = newEmail(id);
    setEmails((list) => [...list, e]);
    setLastSaved((snap) => ({ ...snap, [id]: clone(e) }));
    open(id, true);
  }

  /** A draft "Copy of …" that opens straight away, with a toast. */
  function duplicate(e: AutomaticEmail) {
    if (lab.is("duplicate-failed")) {
      setBanner(
        <Notice tone="danger" alert>
          Couldn&apos;t duplicate “{displayName(e)}”. Check your connection, then try again.{" "}
          <Button $variant="outline" $size="sm" onClick={() => duplicate(e)}>
            Try again
          </Button>
        </Notice>,
      );
      return;
    }
    setBanner(null);
    const id = newId();
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
    open(id);
    toast({ title: `“${displayName(copy)}” created as a draft` });
  }

  /**
   * Split by a tag: a draft copy for people with the tag (same rule, plus "must have" the tag), opened
   * straight away. The original keeps sending to everyone until the copy is published; then it starts
   * excluding the tag, so nobody gets both and nobody is left out in between.
   */
  function split(e: AutomaticEmail, tag: string) {
    const id = newId();
    const a = e.audience;
    const copy: AutomaticEmail = {
      ...clone(e),
      id,
      name: `${e.name} (${tag})`.slice(0, 80),
      state: "draft",
      audience: {
        ...a,
        rows: a.rows.includes("require") ? a.rows : [...a.rows, "require"],
        require: a.require.includes(tag) ? a.require : [...a.require, tag],
        only: a.only.filter((t) => t !== tag),
        never: a.never.filter((t) => t !== tag),
      },
      splitFrom: { id: e.id, tag },
      edited: 0,
      approved: 0,
      waiting: 0,
      wasPublished: false,
    };
    setEmails((list) => [...list, copy]);
    setLastSaved((snap) => ({ ...snap, [id]: clone(copy) }));
    open(id);
    toast({
      title: `Split “${displayName(e)}” for ${tag}`,
      description: "Edit the new version, then publish it. Until then, nothing changes for anyone.",
    });
  }


  /* Moving to trash has no confirmation: the email moves at once and a toast offers Undo for 5 seconds.
     The server call is "pending" until then. A real app sends it when the timer ends, or straight away
     (fetch keepalive / sendBeacon) if the page is hidden or closed. In this demo the state is already
     trash, so committing just drops the entry. */
  /* Discarding a never-published draft is the same call (it goes to trash on the server), but the
     Trash tab never lists emails that were never published, so to the admin it's simply gone. */
  const pendingTrash = useRef(new Map<string, { prevState: AutomaticEmail["state"]; timer: ReturnType<typeof setTimeout> }>());
  function commitAllTrash() {
    for (const p of pendingTrash.current.values()) clearTimeout(p.timer);
    pendingTrash.current.clear();
  }
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") commitAllTrash();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", commitAllTrash);
    window.addEventListener("beforeunload", commitAllTrash);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", commitAllTrash);
      window.removeEventListener("beforeunload", commitAllTrash);
      commitAllTrash();
    };
  }, []);

  function trash(e: AutomaticEmail) {
    if (lab.is("trash-failed")) {
      // From the list, a banner says so. From the editor nothing is shown yet: the editor needs an
      // inline error slot for this (it isn't edited here), so for now it stays open and unchanged.
      if (!editId) {
        setBanner(
          <Notice tone="danger" alert>
            Couldn&apos;t {isDiscardable(e) ? "discard" : "move"} “{displayName(e)}”{isDiscardable(e) ? "" : " to trash"}. Check your connection, then try again.{" "}
            <Button $variant="outline" $size="sm" onClick={() => trash(e)}>
              Try again
            </Button>
          </Notice>,
        );
      }
      return;
    }
    setBanner(null);
    const id = e.id;
    const prevState = e.state;
    const discard = isDiscardable(e);
    patchEmail(id, { state: "trash" });
    if (editId) goTo(null);
    const timer = setTimeout(() => pendingTrash.current.delete(id), UNDO_MS);
    pendingTrash.current.set(id, { prevState, timer });
    toast({
      title: discard ? `“${displayName(e)}” discarded` : `“${displayName(e)}” moved to trash`,
      actionLabel: "Undo",
      onAction: () => {
        const p = pendingTrash.current.get(id);
        if (!p) {
          toast({
            title: "It's too late to undo",
            description: discard ? "Discarded drafts can't be brought back." : "Emails in trash can't be restored.",
          });
          return;
        }
        clearTimeout(p.timer);
        pendingTrash.current.delete(id);
        patchEmail(id, { state: p.prevState });
        toast({ title: `“${displayName(e)}” restored` });
      },
    });
  }

  function leave() {
    clearTimeout(saveTimer.current);
    // A new email left untouched was never saved, so it doesn't stay behind as an empty draft.
    if (saved === "idle" && editId) setEmails((list) => list.filter((e) => e.id !== editId));
    setSaved("saved");
    goTo(null);
  }

  function confirm(splitTag?: string) {
    if (!modal) return;
    const e = emails.find((x) => x.id === modal.id);
    setModal(null);
    if (!e) return;
    if (modal.kind === "unpublish") {
      patchEmail(e.id, { state: "draft", wasPublished: true, waiting: e.waiting + e.approved, approved: 0, edited: 0 });
      toast({ title: `“${displayName(e)}” unpublished`, description: "Sending is paused until you publish it again." });
    } else if (modal.kind === "publish") {
      patchEmail(e.id, { state: "published", wasPublished: true });
      const from = e.splitFrom && emails.find((x) => x.id === e.splitFrom!.id && x.state !== "trash");
      if (from && e.splitFrom && lab.is("handover-failed")) {
        patchEmail(e.id, { handoverFailed: true });
        toast({ title: `“${displayName(e)}” published` });
      } else if (from && e.splitFrom) {
        // Publishing a split copy hands its tag over: the original now skips people with it.
        const { tag } = e.splitFrom;
        const a = from.audience;
        patchEmail(from.id, {
          audience: { ...a, rows: a.rows.includes("never") ? a.rows : [...a.rows, "never"], never: a.never.includes(tag) ? a.never : [...a.never, tag] },
        });
        toast({ title: `“${displayName(e)}” published`, description: `“${displayName(from)}” no longer goes to people with ${tag}.` });
      } else {
        toast({ title: `“${displayName(e)}” published`, description: "It starts sending on schedule." });
      }
    } else if (modal.kind === "split") {
      if (splitTag) split(e, splitTag);
    } else {
      // Only reached when the last save failed or is still running.
      leave();
    }
  }

  const modalEmail = modal && emails.find((x) => x.id === modal.id);

  // What the list shows for the State lab's data states.
  let shownEmails = empty ? [] : emails;
  if (lab.is("published-empty")) shownEmails = shownEmails.filter((e) => e.state !== "published");
  if (lab.is("drafts-empty")) shownEmails = shownEmails.filter((e) => e.state !== "draft");
  if (lab.is("trash-empty")) shownEmails = shownEmails.filter((e) => e.state !== "trash");
  if (lab.longText) shownEmails = shownEmails.map(longText);
  if (lab.manyItems) shownEmails = manyEmails(shownEmails);

  return (
    <>
      {editId && (!cur || lab.notFound) ? (
        <NotFound onBack={() => goTo(null)} />
      ) : cur ? (
        <EmailEditor
          key={cur.id}
          email={cur}
          note={splitNote(cur, emails, () => {
            const from = cur.splitFrom && emails.find((x) => x.id === cur.splitFrom!.id);
            if (!from || !cur.splitFrom) return;
            const a = from.audience;
            const tag = cur.splitFrom.tag;
            patchEmail(from.id, { audience: { ...a, rows: a.rows.includes("never") ? a.rows : [...a.rows, "never"], never: a.never.includes(tag) ? a.never : [...a.never, tag] } });
            patchEmail(cur.id, { handoverFailed: false });
            toast({ title: `“${displayName(from)}” no longer goes to people with ${tag}` });
          })}
          saved={saved}
          onUpdate={update}
          onRetrySave={() => save(cur.id)}
          onAsk={(kind) => (kind === "trash" ? trash(cur) : setModal({ kind, id: cur.id }))}
          onBack={() => (cur.state === "draft" && (saved === "saving" || saved === "error") ? setModal({ kind: "leave", id: cur.id }) : leave())}
        />
      ) : (
        <EmailList
          emails={shownEmails}
          loading={load}
          loadFailed={lab.loadFailed}
          onRetry={() => router.refresh()}
          tagsFailed={lab.is("tags-failed")}
          onRetryTags={() => router.refresh()}
          banner={banner}
          onCreate={create}
          onOpen={open}
          onDuplicate={duplicate}
          onSplit={(e) => setModal({ kind: "split", id: e.id })}
          onTrash={trash}
        />
      )}

      <AlertDialog open={!!modalEmail} onOpenChange={(isOpen) => !isOpen && setModal(null)}>
        {modal && modalEmail && modal.kind === "split" ? (
          <SplitContent email={modalEmail} failed={lab.is("split-failed")} onConfirm={(tag) => confirm(tag)} />
        ) : (
          modal &&
          modalEmail && (
            <ConfirmContent
              kind={modal.kind}
              email={modalEmail}
              emails={emails}
              failed={modal.kind === "publish" && lab.is("publish-failed")}
              onConfirm={() => confirm()}
            />
          )
        )}
      </AlertDialog>
    </>
  );
}

/** Dialogs open focused on themselves, not on a button: the title and text are read first, and Tab goes in order. */
function focusDialogItself(event: Event) {
  event.preventDefault();
  (event.currentTarget as HTMLElement | null)?.focus();
}

function confirmCopy(kind: ModalKind, e: AutomaticEmail, emails: AutomaticEmail[]) {
  const name = displayName(e);
  if (kind === "unpublish") {
    const lines = ["Sending stops until you publish again."];
    if (e.edited) lines.push(`${e.edited}${e.edited === 1 ? " email you edited in the Outbox" : " emails you edited in the Outbox"} will lose those edits.`);
    if (e.approved) lines.push(`${e.approved}${e.approved === 1 ? " email you approved needs" : " emails you approved need"} approval again.`);
    if (e.waiting) lines.push(`${e.waiting}${e.waiting === 1 ? " email waiting for review comes" : " emails waiting for review come"} back when you publish.`);
    return { title: `Unpublish “${name}”?`, lines, confirm: "Unpublish", cancel: "Cancel", danger: false };
  }
  if (kind === "publish" && missingAttachment(e)) {
    return {
      title: "Publish without an attachment?",
      lines: ["The email mentions an attachment, but nothing is attached."],
      confirm: "Publish anyway",
      cancel: "Go back",
      danger: false,
    };
  }
  if (kind === "publish") {
    const lines = [`It sends ${timingPhrase(e)}.`, `Who gets it: ${audienceSentence(effectiveAudience(e))}`];
    const from = e.splitFrom && emails.find((x) => x.id === e.splitFrom!.id && x.state !== "trash");
    if (from && e.splitFrom) lines.push(`“${displayName(from)}” stops going to people with ${e.splitFrom.tag}, so nobody gets both.`);
    if (e.wasPublished) {
      const back = e.waiting + e.approved;
      if (back) lines.push(`${back}${back === 1 ? " email comes" : " emails come"} back for review.`);
      lines.push("2 members missed this email while it was unpublished. They wait for your approval in Waiting for you.");
    }
    return { title: `Publish “${name}”?`, lines, confirm: "Publish", cancel: "Cancel", danger: false };
  }
  return {
    title: "Leave without saving?",
    lines: ["Your latest changes didn't save. If you leave now, they're lost."],
    confirm: "Leave anyway",
    cancel: "Stay",
    danger: true,
  };
}

function ConfirmContent({
  kind,
  email,
  emails,
  failed,
  onConfirm,
}: {
  kind: ModalKind;
  email: AutomaticEmail;
  emails: AutomaticEmail[];
  /** The action fails (State lab): the dialog stays open and says so. */
  failed?: boolean;
  onConfirm: () => void;
}) {
  const copy = confirmCopy(kind, email, emails);
  const [error, setError] = useState(false);
  const what = kind === "publish" ? "publish" : "do that";
  return (
    <AlertDialogContent onOpenAutoFocus={focusDialogItself}>
      <AlertDialogTitle>{copy.title}</AlertDialogTitle>
      {error && (
        <Notice tone="danger" alert>
          Couldn&apos;t {what}. Check your connection, then try again.
        </Notice>
      )}
      {copy.lines.map((line) => (
        <AlertDialogDescription key={line}>{line}</AlertDialogDescription>
      ))}
      {kind === "publish" && !missingAttachment(email) && <EligibleAccordion email={email} />}
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button $variant="outline">{copy.cancel}</Button>
        </AlertDialogCancel>
        <Button
          $variant={copy.danger ? "danger" : "primary"}
          onClick={() => {
            if (failed) setError(true);
            else onConfirm();
          }}
        >
          {copy.confirm}
        </Button>
      </AlertDialogActions>
    </AlertDialogContent>
  );
}

function EligibleAccordion({ email }: { email: AutomaticEmail }) {
  const members = upcomingRecipients(email);
  if (!members.length) return <AlertDialogDescription>No members are scheduled to get this yet.</AlertDialogDescription>;
  return (
    <>
      <AlertDialogDescription>
        {members.length === 1 ? "1 member is scheduled to get this." : `${members.length} members are scheduled to get this.`}
      </AlertDialogDescription>
      <Accordion type="single" collapsible>
        <AccordionItem value="members">
          <AccordionTrigger>View members</AccordionTrigger>
          <AccordionContent>
            <div>
              <MemberRows members={members} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}

/** "Split from …" on the new version, the pending handover on the original, or a failed handover. */
function splitNote(e: AutomaticEmail, emails: AutomaticEmail[], onRetryHandover: () => void): ReactNode {
  if (e.splitFrom) {
    const from = emails.find((x) => x.id === e.splitFrom!.id && x.state !== "trash");
    if (from && e.handoverFailed)
      return (
        <Notice tone="danger" alert>
          “{displayName(from)}” still goes to people with {e.splitFrom.tag}, so they could get both emails.{" "}
          <Button $variant="outline" $size="sm" onClick={onRetryHandover}>
            Try again
          </Button>
        </Notice>
      );
    if (from && e.state === "draft")
      return (
        <Notice tone="info">
          Split from “{displayName(from)}”. When you publish this, people with {e.splitFrom.tag} get this email instead of “{displayName(from)}”.
        </Notice>
      );
  }
  const pending = emails.find((x) => x.splitFrom?.id === e.id && x.state === "draft");
  if (pending && e.state !== "trash")
    return (
      <Notice tone="info">
        “{displayName(pending)}” is a draft split from this email. Until it&apos;s published, people with {pending.splitFrom!.tag} still get this one.
      </Notice>
    );
  return null;
}

/** Many emails, for the State lab: copies of the real ones, so pagination, search and chips have something to page. */
function manyEmails(emails: AutomaticEmail[]): AutomaticEmail[] {
  if (!emails.length) return emails;
  return Array.from({ length: 120 }, (_, i) => {
    const e = emails[i % emails.length];
    return { ...e, id: `${e.id}-many-${i}`, name: `${e.name} ${Math.floor(i / emails.length) + 1}` };
  });
}

/** An email link that doesn't exist any more (or never did). */
function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <Page>
      <Button $variant="ghost" $size="sm" onClick={onBack} style={{ alignSelf: "flex-start" }}>
        <Icon icon={ArrowLeft} size={14} />
        Automatic emails
      </Button>
      <PageTitle id="editor-title" tabIndex={-1}>
        This automatic email doesn&apos;t exist
      </PageTitle>
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>It may have been moved to trash and removed, or the link is wrong.</p>
    </Page>
  );
}

const SplitError = styled.p`
  display: flex;
  gap: var(--space-1);
  align-items: center;
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

/**
 * Split by a tag. The tag field is the editor's own tag picker. Split is never disabled: pressing it
 * without a tag shows the error under the field (NN/g: errors next to the field, not a dead button).
 */
function SplitContent({ email, failed, onConfirm }: { email: AutomaticEmail; failed?: boolean; onConfirm: (tag: string) => void }) {
  const [tag, setTag] = useState("");
  const [error, setError] = useState<"" | "missing" | "failed">("");
  const a = effectiveAudience(email);
  const options = TAGS.filter((t) => !a.never.includes(t) && !a.require.includes(t) && !(email.trigger === "tag" && email.tag === t)).map((t) => ({
    value: t,
    label: t,
    color: tagColor(t),
  }));
  function submit() {
    if (!tag) return setError("missing");
    if (failed) return setError("failed");
    onConfirm(tag);
  }
  return (
    <AlertDialogContent onOpenAutoFocus={focusDialogItself}>
      <AlertDialogTitle>Split “{displayName(email)}” by a tag</AlertDialogTitle>
      <AlertDialogDescription>People with the tag get their own version to edit. Nothing changes until you publish it.</AlertDialogDescription>
      {error === "failed" && (
        <Notice tone="danger" alert>
          Couldn&apos;t split it. Check your connection, then try again.
        </Notice>
      )}
      <div>
        <PickRow
          hideLabel
          icon={TagIcon}
          label="Tag"
          heading="Tag"
          placeholder="Choose a tag"
          options={options}
          value={tag}
          onChange={(v) => {
            setTag(v);
            setError("");
          }}
          invalid={error === "missing"}
          describedBy={error === "missing" ? "split-tag-error" : undefined}
        />
        {error === "missing" && (
          <SplitError id="split-tag-error" role="alert">
            <ErrorIcon />
            Choose a tag to split by
          </SplitError>
        )}
      </div>
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button $variant="outline">Cancel</Button>
        </AlertDialogCancel>
        <Button onClick={submit}>{tag ? `Split by ${tag}` : "Split email"}</Button>
      </AlertDialogActions>
    </AlertDialogContent>
  );
}
