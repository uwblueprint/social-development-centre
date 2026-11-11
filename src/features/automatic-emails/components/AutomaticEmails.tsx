"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/components/ui/Toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import {
  createAutomaticEmail,
  duplicateAutomaticEmail,
  publishAutomaticEmail,
  restoreAutomaticEmail,
  saveAutomaticEmail,
  setEmailFallback,
  trashAutomaticEmail,
  unpublishAutomaticEmail,
} from "../actions";
import { patchFromEmail } from "../mapping";
import {
  type AutomaticEmail,
  type Recipient,
  type TagNames,
  type TagOption,
  EVERYONE,
  audienceSentence,
  displayName,
  effectiveAudience,
  timingPhrase,
} from "../model";
import { EmailEditor } from "./EmailEditor";
import { EmailList } from "./EmailList";
import { MemberRows } from "./parts";

/** "idle": a new email nobody has touched yet, so there is nothing saved to report. */
export type SaveStatus = "idle" | "saved" | "saving" | "error";
type ModalKind = "publish" | "unpublish" | "trash" | "leave";

const LIST = "/admin/automatic-emails";
const SOMETHING_WRONG = "Something went wrong. Try again.";

function useTagNames(tags: TagOption[]): TagNames {
  return useMemo(() => new Map(tags.map((t) => [t.id, t.name])), [tags]);
}

/** Comparable form of a field: empty docs, "", 0 and missing all count as blank. */
function norm(v: unknown) {
  const json = JSON.stringify(v ?? null);
  // Only rich-text docs can be blank; other objects (like the audience) always count.
  const blankDoc = typeof v === "object" && v !== null && json.includes('"type":"doc"') && !/"type":"(text|personalizedText|emailImage|image)"/.test(json);
  return v == null || v === "" || v === 0 || blankDoc ? "" : json;
}

// ---------- the list ----------

export function AutomaticEmailsList({ emails, tags }: { emails: AutomaticEmail[]; tags: TagOption[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const tagNames = useTagNames(tags);
  const [trashing, setTrashing] = useState<AutomaticEmail | null>(null);

  async function duplicate(e: AutomaticEmail) {
    const result = await duplicateAutomaticEmail(e.id);
    if (!result.ok) return toast({ title: SOMETHING_WRONG });
    toast({ title: `Draft copy of “${displayName(e)}” created` });
    router.push(`${LIST}/${result.id}`);
  }

  async function restore(e: AutomaticEmail) {
    const result = await restoreAutomaticEmail(e.id);
    if (!result.ok) return toast({ title: SOMETHING_WRONG });
    toast({ title: `“${displayName(e)}” restored to Drafts` });
    router.refresh();
  }

  async function trash() {
    const e = trashing;
    setTrashing(null);
    if (!e) return;
    const result = await trashAutomaticEmail(e.id);
    if (!result.ok) return toast({ title: SOMETHING_WRONG });
    toast({ title: `“${displayName(e)}” moved to trash` });
    router.refresh();
  }

  return (
    <>
      <EmailList
        emails={emails}
        tagNames={tagNames}
        onCreate={() => router.push(`${LIST}/new`)}
        onOpen={(id) => router.push(`${LIST}/${id}`)}
        onDuplicate={(e) => void duplicate(e)}
        onRestore={(e) => void restore(e)}
        onTrash={setTrashing}
      />
      <AlertDialog open={!!trashing} onOpenChange={(isOpen) => !isOpen && setTrashing(null)}>
        {trashing && <ConfirmContent kind="trash" email={trashing} tagNames={tagNames} recipients={[]} onConfirm={() => void trash()} />}
      </AlertDialog>
    </>
  );
}

// ---------- one email ----------

/** A new email the admin hasn't changed yet. It's created in the database on its first change. */
export function blankEmail(): AutomaticEmail {
  return {
    id: "",
    name: "",
    trigger: "join_any",
    tag: null,
    delay: "same",
    days: "30",
    unit: "days",
    audience: EVERYONE,
    mode: "auto",
    state: "draft",
    subject: "",
    edited: 0,
    approved: 0,
    waiting: 0,
  };
}

export function AutomaticEmailScreen({
  email: initial,
  tags,
  recipients,
  fallbacks: initialFallbacks,
}: {
  /** The email, or blankEmail() for a new one. */
  email: AutomaticEmail;
  tags: TagOption[];
  recipients: Recipient[];
  fallbacks: Record<string, string>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const tagNames = useTagNames(tags);
  const [email, setEmail] = useState(initial);
  const [saved, setSaved] = useState<SaveStatus>(initial.id ? "saved" : "idle");
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [fallbacks, setFallbacks] = useState(initialFallbacks);

  // The save timer reads the latest edits when it fires, not the ones from when it started.
  const emailRef = useRef(email);
  useEffect(() => {
    emailRef.current = email;
  }, [email]);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(saveTimer.current), []);
  // Saves run one at a time, so a slow one can't land after a newer one.
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  async function persist(): Promise<boolean> {
    const current = emailRef.current;
    let id = current.id;
    if (!id) {
      const created = await createAutomaticEmail();
      if (!created.ok) return false;
      id = created.id;
      emailRef.current = { ...emailRef.current, id };
      setEmail((e) => ({ ...e, id }));
      // The address becomes the email's own without reloading the editor the admin is typing in.
      window.history.replaceState(null, "", `${LIST}/${id}`);
    }
    const result = await saveAutomaticEmail(id, patchFromEmail({ ...emailRef.current, id }));
    return result.ok;
  }

  function save(manual = false) {
    clearTimeout(saveTimer.current);
    setSaved("saving");
    saveTimer.current = setTimeout(
      () => {
        saving.current = saving.current.then(async () => {
          const ok = await persist();
          setSaved(ok ? "saved" : "error");
          if (manual) toast({ title: ok ? "Draft saved. It won't send until you publish." : "Couldn't save the draft. Your text is still here." });
        });
      },
      manual ? 0 : 700,
    );
  }

  function update(patch: Partial<AutomaticEmail>) {
    // The editors report their content once on mount; only a real change counts as an edit worth saving.
    const current = emailRef.current as unknown as Record<string, unknown>;
    const changed = Object.entries(patch).some(([k, v]) => norm(current[k]) !== norm(v));
    if (!changed) return;
    emailRef.current = { ...emailRef.current, ...patch };
    setEmail(emailRef.current);
    if (emailRef.current.state === "draft") save();
  }

  function changeFallback(id: string, value: string) {
    setFallbacks((f) => ({ ...f, [id]: value }));
    void setEmailFallback(id, value).then((result) => {
      if (!result.ok) toast({ title: SOMETHING_WRONG });
    });
  }

  function leave() {
    clearTimeout(saveTimer.current);
    router.push(LIST);
    router.refresh();
  }

  async function restore() {
    const result = await restoreAutomaticEmail(email.id);
    if (!result.ok) return toast({ title: SOMETHING_WRONG });
    setEmail((e) => ({ ...e, state: "draft" }));
    setSaved("saved");
    toast({ title: `“${displayName(email)}” restored to Drafts` });
  }

  async function confirm() {
    const kind = modal;
    setModal(null);
    if (kind === "leave") return leave();
    // Publishing reads what's saved, so the latest edits go first.
    if (kind === "publish") {
      clearTimeout(saveTimer.current);
      await saving.current;
      if (!(await persist())) {
        setSaved("error");
        return toast({ title: "Couldn't save the draft. Your text is still here." });
      }
      setSaved("saved");
    }
    const id = emailRef.current.id;
    if (kind === "publish") {
      const result = await publishAutomaticEmail(id);
      if (!result.ok) return toast({ title: SOMETHING_WRONG });
      if (result.blockers.length) return toast({ title: `To publish: ${result.blockers.join(", ")}.` });
      setEmail((e) => ({ ...e, state: "published" }));
      toast({ title: "Published. It starts sending on schedule." });
      router.refresh();
    } else if (kind === "unpublish") {
      const result = await unpublishAutomaticEmail(id);
      if (!result.ok) return toast({ title: SOMETHING_WRONG });
      setEmail((e) => ({ ...e, state: "draft", wasPublished: true, edited: 0, approved: 0, waiting: 0 }));
      setSaved("saved");
      toast({ title: "Unpublished. Sending is paused until you publish again." });
      router.refresh();
    } else if (kind === "trash") {
      if (!id) return leave();
      const result = await trashAutomaticEmail(id);
      if (!result.ok) return toast({ title: SOMETHING_WRONG });
      toast({ title: `“${displayName(email)}” moved to trash` });
      leave();
    }
  }

  return (
    <>
      <EmailEditor
        email={email}
        tags={tags}
        tagNames={tagNames}
        recipients={email.state === "published" ? recipients : []}
        fallbacks={fallbacks}
        onFallbackChange={changeFallback}
        saved={saved}
        onUpdate={update}
        onRetrySave={() => save(true)}
        onAsk={setModal}
        onRestore={() => void restore()}
        onBack={() => (email.state === "draft" && (saved === "saving" || saved === "error") ? setModal("leave") : leave())}
      />
      <AlertDialog open={!!modal} onOpenChange={(isOpen) => !isOpen && setModal(null)}>
        {modal && (
          <ConfirmContent kind={modal} email={email} tagNames={tagNames} recipients={recipients} onConfirm={() => void confirm()} />
        )}
      </AlertDialog>
    </>
  );
}

// ---------- confirmations ----------

function confirmCopy(kind: ModalKind, e: AutomaticEmail, tagNames: TagNames) {
  const name = displayName(e);
  if (kind === "unpublish") {
    const lines = ["Sending stops until you publish again."];
    if (e.edited) lines.push(`${e.edited}${e.edited === 1 ? " email you edited in the Outbox" : " emails you edited in the Outbox"} will lose those edits.`);
    if (e.approved) lines.push(`${e.approved}${e.approved === 1 ? " email you approved needs" : " emails you approved need"} approval again.`);
    if (e.waiting) lines.push(`${e.waiting}${e.waiting === 1 ? " email waiting for review comes" : " emails waiting for review come"} back when you publish.`);
    return { title: `Unpublish “${name}”?`, lines, confirm: "Unpublish", cancel: "Cancel", danger: false };
  }
  if (kind === "publish") {
    const lines = [`It sends ${timingPhrase(e, tagNames)}.`, `Who gets it: ${audienceSentence(effectiveAudience(e), tagNames)}`];
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
    lines: ["Your latest changes didn't save. If you leave now, they're lost."],
    confirm: "Leave anyway",
    cancel: "Stay",
    danger: true,
  };
}

function ConfirmContent({
  kind,
  email,
  tagNames,
  recipients,
  onConfirm,
}: {
  kind: ModalKind;
  email: AutomaticEmail;
  tagNames: TagNames;
  recipients: Recipient[];
  onConfirm: () => void;
}) {
  const copy = confirmCopy(kind, email, tagNames);
  return (
    <AlertDialogContent>
      <AlertDialogTitle>{copy.title}</AlertDialogTitle>
      {copy.lines.map((line) => (
        <AlertDialogDescription key={line}>{line}</AlertDialogDescription>
      ))}
      {kind === "publish" && <EligibleAccordion members={email.state === "published" ? recipients : []} />}
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

function EligibleAccordion({ members }: { members: Recipient[] }) {
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
