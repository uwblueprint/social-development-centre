"use client";

/*
 * The actions on an automatic email, shared by the list rows and the email page. `run(kind, email)` opens the
 * right dialog (one confirmation each for Publish and Unpublish, listing only what applies) or acts directly
 * (Duplicate, Restore). Render `dialogs` once next to the caller.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { styled } from "next-yak";
import { AlertDialog, AlertDialogActions, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { EmailPreview } from "../editor";
import { useEmails } from "../store";
import { ADMINS, type AutomaticEmail, type Member } from "../model";
import { AUTOMATIC_BASE, OUTBOX_BASE, plural } from "./summary";

export type ActionKind = "publish" | "unpublish" | "trash" | "render" | "test" | "insights" | "duplicate" | "restore";

const List = styled.ul`
  margin: 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-text-muted);
`;

const InlineError = styled.p`
  margin: 0;
  display: flex;
  gap: var(--space-2);
  color: var(--color-danger);
  font-size: var(--text-sm);
`;

const LinkItem = styled(Link)`
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: none;
    border-radius: var(--radius-sm);
    box-shadow: var(--focus-ring);
  }
`;

const PreviewBox = styled.div`
  max-height: 50vh;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
`;

function memberName(m: Member | undefined): string {
  if (!m) return "A member";
  return [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
}

function name(e: AutomaticEmail): string {
  return e.name.trim() || "Untitled email";
}

/* ---------- Unpublish effects (also shown when trashing a published email) ---------- */

function UnpublishEffects({ id }: { id: string }) {
  const api = useEmails();
  const p = React.useMemo(() => api.previewUnpublish(id), [api, id]);
  const shown = p.edited.slice(0, 5);
  const none = p.edited.length === 0 && p.approved === 0 && p.waitingForReview === 0 && p.openByOther.length === 0;
  return (
    <Body>
      {none && <p>No emails are waiting.</p>}
      {p.edited.length > 0 && (
        <div>
          <p>{plural(p.edited.length, "edited email")} will be reset:</p>
          <List>
            {shown.map((s) => (
              <li key={s.id}>
                <LinkItem href={`${OUTBOX_BASE}?send=${s.id}`}>Email to {memberName(api.member(s.memberId))}</LinkItem>
              </li>
            ))}
            {p.edited.length > shown.length && <li>and {p.edited.length - shown.length} more</li>}
          </List>
        </div>
      )}
      {p.approved > 0 && <p>{plural(p.approved, "approved email")} need approval again.</p>}
      {p.waitingForReview > 0 && <p>{plural(p.waitingForReview, "email")} waiting for review.</p>}
      {p.openByOther.map(({ send, by }) => (
        <p key={send.id}>
          {by} has the email to {memberName(api.member(send.memberId))} open.
        </p>
      ))}
    </Body>
  );
}

/* ---------- Publish ---------- */

function PublishDialog({ email, onClose }: { email: AutomaticEmail; onClose(): void }) {
  const api = useEmails();
  const { toast } = useToast();
  const p = React.useMemo(() => api.previewPublish(email.id), [api, email.id]);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    const res = await api.publish(email.id);
    setPending(false);
    if (!res.ok) return setError(res.error);
    toast({ title: `“${name(email)}” is live.`, description: p.scheduled ? `${plural(p.scheduled, "member")} scheduled.` : undefined });
    onClose();
  }

  const none = p.scheduled === 0 && p.comeBackForReview === 0 && p.missed === 0 && p.overLimit === 0;
  return (
    <AlertDialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>Publish “{name(email)}”?</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div>
            <Body>
              {none && <p>No members scheduled.</p>}
              {p.scheduled > 0 && <p>{plural(p.scheduled, "member")} scheduled.</p>}
              {p.comeBackForReview > 0 && <p>{plural(p.comeBackForReview, "email")} back in review.</p>}
              {p.missed > 0 && <p>{plural(p.missed, "member")} missed it while unpublished. They wait for your approval.</p>}
              {p.overLimit > 0 && <p>{plural(p.overLimit, "member")} over the monthly limit.</p>}
              {error && <InlineError role="alert">Couldn&apos;t publish: {error}</InlineError>}
            </Body>
          </div>
        </AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary" disabled={pending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button type="button" onClick={confirm} disabled={pending} aria-busy={pending}>
            {pending ? "Publishing…" : "Publish"}
          </Button>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- Unpublish / trash ---------- */

function UnpublishDialog({ email, onClose, then }: { email: AutomaticEmail; onClose(): void; then?: "trash" }) {
  const api = useEmails();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const trashing = then === "trash";

  async function confirm() {
    setPending(true);
    setError(null);
    const res = trashing ? await api.trash(email.id) : await api.unpublish(email.id);
    setPending(false);
    if (!res.ok) return setError(res.error);
    toast({ title: trashing ? `“${name(email)}” is in the trash.` : `“${name(email)}” is unpublished.` });
    onClose();
  }

  return (
    <AlertDialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>{trashing ? `Move “${name(email)}” to trash?` : `Unpublish “${name(email)}”?`}</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div>
            <UnpublishEffects id={email.id} />
            {error && <InlineError role="alert">Couldn&apos;t finish: {error}</InlineError>}
          </div>
        </AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary" disabled={pending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button type="button" $variant={trashing ? "danger" : "primary"} onClick={confirm} disabled={pending} aria-busy={pending}>
            {pending ? "Working…" : trashing ? "Move to trash" : "Unpublish"}
          </Button>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TrashDialog({ email, onClose }: { email: AutomaticEmail; onClose(): void }) {
  const api = useEmails();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  if (email.state === "published") return <UnpublishDialog email={email} onClose={onClose} then="trash" />;

  async function confirm() {
    setPending(true);
    setError(null);
    const res = await api.trash(email.id);
    setPending(false);
    if (!res.ok) return setError(res.error);
    toast({ title: `“${name(email)}” is in the trash.` });
    onClose();
  }
  return (
    <AlertDialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>Move “{name(email)}” to trash?</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div>
            <Body>{error ? <InlineError role="alert">Couldn&apos;t move it: {error}</InlineError> : <p>Restore it from Trash any time.</p>}</Body>
          </div>
        </AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary" disabled={pending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button type="button" $variant="danger" onClick={confirm} disabled={pending} aria-busy={pending}>
            {pending ? "Moving…" : "Move to trash"}
          </Button>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- Render as member / send test ---------- */

function useMemberChoice() {
  const api = useEmails();
  const members = api.state.members;
  const [id, setId] = React.useState(members[0]?.id ?? "");
  const options = React.useMemo(() => members.map((m) => ({ value: m.id, label: `${memberName(m)} (${m.email})` })), [members]);
  const member = members.find((m) => m.id === id);
  return { members, id, setId, options, member };
}

function RenderDialog({ email, onClose }: { email: AutomaticEmail; onClose(): void }) {
  const c = useMemberChoice();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Render as member</DialogTitle>
        <DialogDescription>{name(email)}</DialogDescription>
        <Body>
          {c.members.length === 0 ? (
            <Muted>No members yet.</Muted>
          ) : (
            <>
              <Field label="Member">{(p) => <Select {...p} options={c.options} value={c.id} onValueChange={c.setId} placeholder="Choose a member" />}</Field>
              {c.member && (
                <PreviewBox>
                  <EmailPreview content={email.content} member={c.member} moment={email.moment ?? undefined} />
                </PreviewBox>
              )}
            </>
          )}
        </Body>
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" $variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

function TestDialog({ email, onClose }: { email: AutomaticEmail; onClose(): void }) {
  const api = useEmails();
  const c = useMemberChoice();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentAs, setSentAs] = React.useState<string | null>(null);

  async function send() {
    setPending(true);
    setError(null);
    const res = await api.sendTest(email.content, c.id || undefined);
    setPending(false);
    if (!res.ok) return setError(res.error);
    setSentAs(memberName(c.member));
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <DialogTitle>Send test</DialogTitle>
        <DialogDescription>{name(email)}</DialogDescription>
        <Body>
          {c.members.length > 0 && (
            <Field label="Fill in details for">
              {(p) => <Select {...p} options={c.options} value={c.id} onValueChange={c.setId} placeholder="Choose a member" />}
            </Field>
          )}
          {sentAs && (
            <p role="status">
              Test sent to {ADMINS.me} as {sentAs}.
            </p>
          )}
          {error && <InlineError role="alert">Test not sent: {error}</InlineError>}
        </Body>
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" $variant="secondary" disabled={pending}>
              {sentAs ? "Close" : "Cancel"}
            </Button>
          </DialogClose>
          <Button type="button" onClick={send} disabled={pending} aria-busy={pending}>
            {pending ? "Sending…" : sentAs ? "Send another test" : "Send test"}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

function InsightsDialog({ email, onClose }: { email: AutomaticEmail; onClose(): void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Insights</DialogTitle>
        <DialogDescription>{name(email)}</DialogDescription>
        <Body>
          <Muted>Not in this prototype.</Muted>
        </Body>
        <DialogActions>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- The hook ---------- */

export function useAutomaticActions() {
  const api = useEmails();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState<{ kind: ActionKind; email: AutomaticEmail } | null>(null);
  const close = React.useCallback(() => setOpen(null), []);

  const run = React.useCallback(
    async (kind: ActionKind, email: AutomaticEmail) => {
      if (kind === "duplicate") {
        const copy = api.duplicate(email.id);
        toast({ title: `Copy of “${name(email)}” saved.`, actionLabel: "Open", onAction: () => router.push(`${AUTOMATIC_BASE}/${copy.id}`) });
        return;
      }
      if (kind === "restore") {
        const res = await api.restore(email.id);
        toast(res.ok ? { title: `“${name(email)}” is back in Drafts.` } : { title: `Couldn't restore “${name(email)}”.`, description: res.error });
        return;
      }
      setOpen({ kind, email });
    },
    [api, router, toast],
  );

  let dialogs: React.ReactNode = null;
  if (open) {
    const { kind, email } = open;
    // Read the live record so the dialog reflects the latest state, falling back to what was passed in.
    const live = api.state.automatic.find((a) => a.id === email.id);
    const merged = live ? { ...live, ...email, state: live.state } : email;
    if (kind === "publish") dialogs = <PublishDialog email={merged} onClose={close} />;
    else if (kind === "unpublish") dialogs = <UnpublishDialog email={merged} onClose={close} />;
    else if (kind === "trash") dialogs = <TrashDialog email={merged} onClose={close} />;
    else if (kind === "render") dialogs = <RenderDialog email={merged} onClose={close} />;
    else if (kind === "test") dialogs = <TestDialog email={merged} onClose={close} />;
    else if (kind === "insights") dialogs = <InsightsDialog email={merged} onClose={close} />;
  }
  return { run, dialogs };
}
