"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  bodyOf,
  fill,
  fmtDay,
  MEMBERS,
  plural,
  seedSends,
  span,
  subjectOf,
  TEMPLATES,
  type Send,
  type TemplateKey,
} from "./data";
import { RecipientsPanel, type PanelMode } from "./RecipientsPanel";
import { OutboxCalendar } from "./OutboxCalendar";
import { EmailView } from "./EmailView";

/*
 * The Outbox on a calendar: the left panel lists who an email is going to (For review, All, and
 * Couldn't send when something failed); the right side is the month calendar, which an email
 * replaces when you open one. Demo data only; the backend contract is in docs/backend/outbox.md.
 */

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  align-items: start;
  min-height: 100vh;

  @media (max-width: 899px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Main = styled.div`
  min-width: 0;
  padding: var(--space-4) var(--space-6) var(--space-8);
`;

const BulkList = styled.ul`
  list-style: none;
  margin: var(--space-4) 0 0;
  padding: 0;
  max-height: 50vh;
  overflow-y: auto;

  & > li + li {
    border-top: 1px solid var(--color-border);
  }
`;

const BulkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-3) 0;
`;

const BulkWho = styled.div`
  flex: 999 1 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const Warn = styled.span`
  color: var(--color-warning);
  font-weight: var(--weight-medium);
`;

const ShowEmail = styled(CollapsibleTrigger)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;

  &:hover {
    color: var(--color-text);
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  & svg {
    transition: transform var(--duration) var(--ease);
  }
  &[data-state="open"] svg {
    transform: rotate(180deg);
  }
`;

const EmailBody = styled.div`
  margin: 0 0 var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  white-space: pre-line;
`;

const DontAsk = styled.div`
  margin-top: var(--space-4);
`;

export type BulkKind = "approve" | "delete" | "sendnow";

export interface OpenEmail {
  id: string;
  editing: boolean;
  draftTemplate: TemplateKey;
  draftSubject: string;
  draftBody: string;
}

function OutboxScreen() {
  const { toast } = useToast();
  const [sends, setSends] = React.useState<Send[]>(seedSends);
  const [chosenMode, setMode] = React.useState<PanelMode>("review");
  const [closedDays, setClosedDays] = React.useState<Set<number>>(new Set());
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [open, setOpen] = React.useState<OpenEmail | null>(null);
  const [pickedDay, setPickedDay] = React.useState<number | null>(null);
  const [hoverDay, setHoverDay] = React.useState<number | null>(null);
  const [bulk, setBulk] = React.useState<{ kind: BulkKind; ids: string[] } | null>(null);
  const [switchTo, setSwitchTo] = React.useState<TemplateKey | null>(null);
  const [dontAsk, setDontAsk] = React.useState(false);
  const [skipSwitchConfirm, setSkipSwitchConfirm] = React.useState(false);

  const live = sends.filter((s) => s.status !== "sent" && s.status !== "removed");
  const failedCount = live.filter((s) => s.status === "couldnt").length;

  // Once nothing has failed, the Couldn't send tab goes away; fall back to For review.
  const mode: PanelMode = chosenMode === "failed" && failedCount === 0 ? "review" : chosenMode;

  /** Changes sends and offers a 1-minute undo. */
  const act = (ids: string[], patch: (s: Send) => Partial<Send>, title: string) => {
    const before = sends;
    const set = new Set(ids);
    setSends(sends.map((s) => (set.has(s.id) ? { ...s, ...patch(s) } : s)));
    setSelected(new Set());
    setOpen(null);
    toast({ title, actionLabel: "Undo", onAction: () => setSends(before) });
  };

  const approve = (ids: string[]) =>
    act(ids, (s) => ({ status: "scheduled", day: Math.max(s.day, 1) }), ids.length === 1 ? "Approved." : `Approved ${ids.length} emails.`);
  const sendNow = (ids: string[]) => act(ids, () => ({ status: "sent", day: 0 }), ids.length === 1 ? "Sending now." : `Sending ${ids.length} emails now.`);
  const remove = (ids: string[]) => act(ids, () => ({ status: "removed" }), ids.length === 1 ? "Email deleted." : `${ids.length} emails deleted.`);
  const resend = (ids: string[]) => act(ids, () => ({ status: "sent", day: 0 }), ids.length === 1 ? "Resent." : `Resent ${ids.length} emails.`);

  const openEmail = (id: string) => {
    const s = sends.find((x) => x.id === id);
    if (!s) return;
    setOpen({ id, editing: false, draftTemplate: s.template, draftSubject: subjectOf(s), draftBody: bodyOf(s) });
  };

  const openSend = open ? sends.find((s) => s.id === open.id) ?? null : null;

  const saveEdits = () => {
    if (!open || !openSend) return;
    const t = TEMPLATES[open.draftTemplate];
    const plain = open.draftSubject === t.subject && open.draftBody === t.body;
    setSends(
      sends.map((s) =>
        s.id === open.id
          ? { ...s, template: open.draftTemplate, subject: plain ? null : open.draftSubject, body: plain ? null : open.draftBody }
          : s,
      ),
    );
    setOpen({ ...open, editing: false });
    toast({ title: "Saved." });
  };

  const switchTemplate = (key: TemplateKey) => {
    if (!open) return;
    const before = open;
    const t = TEMPLATES[key];
    setOpen({ ...open, draftTemplate: key, draftSubject: t.subject, draftBody: t.body });
    toast({ title: `Switched to ${t.name}.`, actionLabel: "Undo", onAction: () => setOpen(before) });
  };

  const bulkTargets = bulk ? sends.filter((s) => bulk.ids.includes(s.id)) : [];
  const bulkTitle = !bulk
    ? ""
    : bulk.kind === "approve"
      ? `Approve ${plural(bulkTargets.length, "email", "emails")}?`
      : bulk.kind === "sendnow"
        ? `Send ${plural(bulkTargets.length, "email", "emails")} now?`
        : bulkTargets.length === 1
          ? `Delete the email to ${MEMBERS[bulkTargets[0].member].name}?`
          : `Delete ${plural(bulkTargets.length, "email", "emails")}?`;
  const bulkConfirm = !bulk
    ? ""
    : bulk.kind === "approve"
      ? `Approve ${bulkTargets.length}`
      : bulk.kind === "sendnow"
        ? `Send ${bulkTargets.length} now`
        : bulkTargets.length === 1
          ? "Delete email"
          : `Delete ${plural(bulkTargets.length, "email", "emails")}`;

  return (
    <Layout>
      <RecipientsPanel
        sends={live}
        mode={mode}
        onMode={(m) => {
          setMode(m);
          setSelected(new Set());
          setPickedDay(null);
        }}
        selected={selected}
        onSelected={setSelected}
        openId={open?.id ?? null}
        onOpen={openEmail}
        pickedDay={pickedDay}
        closedDays={closedDays}
        onClosedDays={setClosedDays}
        onHoverDay={setHoverDay}
        onBulk={(kind, ids) => setBulk({ kind, ids })}
        onResend={resend}
      />
      <Main>
        {open && openSend ? (
          <EmailView
            send={openSend}
            open={open}
            onChange={setOpen}
            onBack={() => setOpen(null)}
            onSave={saveEdits}
            onPickTemplate={(key) => (skipSwitchConfirm ? switchTemplate(key) : (setDontAsk(false), setSwitchTo(key)))}
            onApprove={() => approve([openSend.id])}
            onSendNow={() => sendNow([openSend.id])}
            onResend={() => resend([openSend.id])}
            onDelete={() => setBulk({ kind: "delete", ids: [openSend.id] })}
            onReset={() => {
              const before = sends;
              setSends(sends.map((s) => (s.id === openSend.id ? { ...s, subject: null, body: null } : s)));
              toast({ title: "Reset to the original template.", actionLabel: "Undo", onAction: () => setSends(before) });
            }}
            onResetDraft={() => {
              const before = open;
              const t = TEMPLATES[openSend.template];
              setOpen({ ...open, draftTemplate: openSend.template, draftSubject: t.subject, draftBody: t.body });
              toast({ title: "Reset to the original template.", actionLabel: "Undo", onAction: () => setOpen(before) });
            }}
          />
        ) : (
          <OutboxCalendar
            sends={sends}
            pickedDay={pickedDay}
            hoverDay={hoverDay}
            onPickDay={(day, tab) => {
              setPickedDay(day);
              // Picking a day opens it in All, even if it was collapsed.
              setClosedDays((c) => {
                const n = new Set(c);
                n.delete(day);
                return n;
              });
              setMode(tab);
              setSelected(new Set());
            }}
          />
        )}
      </Main>

      <Dialog open={!!bulk} onOpenChange={(o) => !o && setBulk(null)}>
        <DialogContent>
          <DialogTitle>{bulkTitle}</DialogTitle>
          <BulkList>
            {bulkTargets.map((s) => {
              const m = MEMBERS[s.member];
              const due = s.status === "review" && s.day < 0;
              return (
                <li key={s.id}>
                  <Collapsible>
                    <BulkRow>
                      <BulkWho>
                        {due ? <Warn>{span(-s.day)} past due</Warn> : <Muted>Due {fmtDay(s.day)}</Muted>}
                        <span>
                          <strong>{m.name}</strong> <Muted>· {m.email}</Muted>
                        </span>
                      </BulkWho>
                      <ShowEmail>
                        Show email
                        <Icon icon={ChevronDown} size={14} />
                      </ShowEmail>
                    </BulkRow>
                    <CollapsibleContent>
                      <EmailBody>{fill(bodyOf(s), m)}</EmailBody>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            })}
          </BulkList>
          <DialogActions>
            <DialogClose asChild>
              <Button $variant="outline">{bulk?.kind === "delete" ? (bulkTargets.length === 1 ? "Keep email" : "Keep emails") : "Go back"}</Button>
            </DialogClose>
            <Button
              $variant={bulk?.kind === "delete" ? "danger" : "primary"}
              onClick={() => {
                if (!bulk) return;
                if (bulk.kind === "approve") approve(bulk.ids);
                else if (bulk.kind === "sendnow") sendNow(bulk.ids);
                else remove(bulk.ids);
                setBulk(null);
              }}
            >
              {bulkConfirm}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!switchTo} onOpenChange={(o) => !o && setSwitchTo(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{switchTo ? `Switch to ${TEMPLATES[switchTo].name}?` : ""}</AlertDialogTitle>
          <AlertDialogDescription>
            {openSend
              ? `The subject and message for ${MEMBERS[openSend.member].first} will be replaced with this template, and any changes made to this email will be lost. You can undo for 1 minute.`
              : ""}
          </AlertDialogDescription>
          <DontAsk>
            <Checkbox label="Don't ask me again" checked={dontAsk} onCheckedChange={(v) => setDontAsk(v === true)} />
          </DontAsk>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button $variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                $variant="primary"
                onClick={() => {
                  if (switchTo) switchTemplate(switchTo);
                  if (dontAsk) setSkipSwitchConfirm(true);
                  setSwitchTo(null);
                }}
              >
                Switch template
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

export function OutboxPage() {
  return (
    <AppToastProvider>
      <OutboxScreen />
    </AppToastProvider>
  );
}
