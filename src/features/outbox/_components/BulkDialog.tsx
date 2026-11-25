"use client";

import { styled } from "next-yak";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { bodyOf, type Template, type TemplateKey, fillFor, fmtDay, isEdited, isPastDue, plural, SEND_TIME, span, type Member, type Send } from "../_data";
import { useOutboxData } from "../_outboxData";
import { useOutboxLock } from "../_lock";
import type { BulkKind } from "../_types";
import { EmailDocView } from "./EmailDocView";
import { OfflineGate } from "./OfflineGate";

const List = styled.ul`
  list-style: none;
  /* A scroll box clips outer rings: 4px of inner room for the "Show email" buttons' rings, given back as negative margin. */
  margin: 0 calc(var(--space-1) * -1);
  padding: 0 var(--space-1);
  max-height: 50vh;
  overflow-y: auto;

  & > li + li {
    border-top: 1px solid var(--color-border);
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-3) 0;
`;

const Who = styled.div`
  flex: 999 1 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);

  /* <strong> defaults to 700; the type scale stops at medium. */
  & strong {
    font-weight: var(--weight-medium);
  }
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const Warn = styled.span`
  color: var(--color-warning);
  font-weight: var(--weight-medium);
`;

/* A kit ghost Button as the trigger; the chevron flips when the email is showing. */
const ShowEmail = styled(Button)`
  & svg {
    transition: transform var(--duration) var(--ease-out);
  }
  &[data-state="open"] svg {
    transform: rotate(180deg);
  }
  /* The label says what the button will do: "Show email" closed, "Hide email" open. */
  &[data-state="open"] [data-when="closed"],
  &[data-state="closed"] [data-when="open"] {
    display: none;
  }
`;

const When = styled.p`
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
`;

const EmailBody = styled(EmailDocView)`
  margin: 0 0 var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
`;

const Lead = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  & strong {
    font-weight: var(--weight-medium);
  }
`;

/* People in a group: one name per line. */
const Names = styled.ul`
  list-style: none;
  margin: 0 0 var(--space-3);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  & li {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const Lines = styled.ul`
  list-style: none;
  margin: 0 0 var(--space-3);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
`;

const Scroll = styled.div`
  /* Same inner room as List so rings and the scrollbar don't clip. */
  margin: var(--space-3) calc(var(--space-1) * -1) 0;
  padding: 0 var(--space-1);
  max-height: 50vh;
  overflow-y: auto;
`;

/** What the dialog asks and what its confirm button says, for this many emails. */
function wording(kind: BulkKind, targets: Send[], members: Member[]): { title: string; note?: string; confirm: string } {
  const emails = plural(targets.length, "email", "emails");
  const approveLabel = targets.length === 1 ? "Approve email" : `Approve ${targets.length} emails`;
  // Approving emails that weren't approved in time: they go out with tomorrow's run.
  if (kind === "approve" && targets.length > 0 && targets.every((s) => s.status === "couldnt"))
    return { title: `Approve ${emails}?`, note: `They will send tomorrow at ${SEND_TIME}.`, confirm: approveLabel };
  if (kind === "approve") return { title: `Approve ${emails}?`, confirm: approveLabel };
  const one = targets.length === 1;
  return {
    title: one ? `Delete the email to ${members[targets[0].member].name}?` : `Delete ${emails}?`,
    confirm: one ? "Delete email" : `Delete ${emails}`,
  };
}

/** Up to this many emails, each gets its own row with "Show email". More than this, they are grouped. */
const SHORT_LIST = 3;

interface Group {
  key: string;
  title: string;
  /** What's under the title: people's names when grouped by email, email names when grouped by person. */
  items: string[];
  /** Singular noun for the count: "person" or "email". */
  unit: string;
}

interface Summary {
  /** What the groups are: one automatic email, one person, or several of either. */
  by: "template" | "person";
  groups: Group[];
}

const byName = (a: string, b: string) => a.localeCompare(b);

/**
 * Groups the emails by whichever of "automatic email" or "person" gives fewer groups, so the list answers the
 * question the person is really asking: one email to many people leads with the email; many emails to the same
 * few people leads with the people; a mix of both gets a collapsed group per email with the counts showing.
 */
function summarize(targets: Send[], members: Member[], templates: Record<TemplateKey, Template>): Summary {
  const byTemplate = new Map<string, string[]>();
  const byPerson = new Map<string, string[]>();
  for (const s of targets) {
    const name = members[s.member].name;
    const tmpl = isEdited(s) ? `${templates[s.template].name} (personalized)` : templates[s.template].name;
    byTemplate.set(s.template, [...(byTemplate.get(s.template) ?? []), name]);
    byPerson.set(String(s.member), [...(byPerson.get(String(s.member)) ?? []), tmpl]);
  }
  const people = byPerson.size < byTemplate.size;
  const groups: Group[] = people
    ? [...byPerson].map(([k, items]) => ({ key: k, title: members[Number(k)].name, items: items.sort(byName), unit: "email" }))
    : [...byTemplate].map(([k, items]) => ({ key: k, title: templates[k as TemplateKey].name, items: items.sort(byName), unit: "person" }));
  groups.sort((a, b) => b.items.length - a.items.length || byName(a.title, b.title));
  return { by: people ? "person" : "template", groups };
}

/** The grouped list for bigger bulk actions. */
function Summary({ summary, verb }: { summary: Summary; verb: string }) {
  const { by, groups } = summary;
  const render = (g: Group) =>
    by === "template" ? (
      <Names>
        {g.items.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </Names>
    ) : (
      <Lines>
        {g.items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </Lines>
    );
  const count = (g: Group) => plural(g.items.length, g.unit, g.unit === "person" ? "people" : "emails");

  // One email (or one person): say it once, then list.
  if (groups.length === 1) {
    const g = groups[0];
    return (
      <>
        <Lead>
          <strong>{g.title}</strong>
          <br />
          <Muted>{by === "template" ? `${count(g)} ${verb} this email.` : `${verb} ${count(g)}.`}</Muted>
        </Lead>
        <Scroll>{render(g)}</Scroll>
      </>
    );
  }
  return (
    <List>
      {groups.map((g) => (
        <li key={g.key}>
          <Collapsible>
            <Row>
              <Who>
                <strong>{g.title}</strong>
                <Muted>{count(g)}</Muted>
              </Who>
              <CollapsibleTrigger asChild>
                <ShowEmail $variant="ghost" $size="sm">
                  <span data-when="closed">{by === "template" ? "Show people" : "Show emails"}</span>
                  <span data-when="open">{by === "template" ? "Hide people" : "Hide emails"}</span>
                  <Icon icon={ChevronDown} size={14} />
                </ShowEmail>
              </CollapsibleTrigger>
            </Row>
            <CollapsibleContent>{render(g)}</CollapsibleContent>
          </Collapsible>
        </li>
      ))}
    </List>
  );
}

interface BulkDialogProps {
  /** The action waiting for a yes, or null when the dialog is closed. */
  bulk: { kind: BulkKind; ids: string[] } | null;
  sends: Send[];
  onConfirm: (kind: BulkKind, ids: string[]) => void;
  onClose: () => void;
}

/** Confirms approving, sending now or deleting, listing each email so it can be read first. */
export function BulkDialog({ bulk, sends, onConfirm, onClose }: BulkDialogProps) {
  const { reason, busy } = useOutboxLock();
  const { members, templates } = useOutboxData();
  const targets = bulk ? sends.filter((s) => bulk.ids.includes(s.id)) : [];
  const text = bulk ? wording(bulk.kind, targets, members) : null;
  const one = targets.length === 1;
  const summary = bulk && targets.length > SHORT_LIST ? summarize(targets, members, templates) : null;
  const verb = bulk?.kind === "approve" ? "will get" : "won't get";

  return (
    <Dialog open={!!bulk} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{text?.title}</DialogTitle>
        {text?.note && <DialogDescription>{text.note}</DialogDescription>}
        {summary && <Summary summary={summary} verb={verb} />}
        {!summary && (
        <List>
          {targets.map((s) => {
            const m = members[s.member];
            return (
              <li key={s.id}>
                <Collapsible>
                  <Row>
                    {/* Only what tells the emails apart: the automatic email it comes from, and the name when the
                        title doesn't already say it. The date and the message are in "Show email". */}
                    <Who>
                      {!one && <strong>{m.name}</strong>}
                      <span>{isEdited(s) ? `Personalized, based on ${templates[s.template].name}` : templates[s.template].name}</span>
                    </Who>
                    <CollapsibleTrigger asChild>
                      <ShowEmail $variant="ghost" $size="sm">
                        <span data-when="closed">Show email</span>
                        <span data-when="open">Hide email</span>
                        <Icon icon={ChevronDown} size={14} />
                      </ShowEmail>
                    </CollapsibleTrigger>
                  </Row>
                  <CollapsibleContent>
                    <When>
                      {s.status === "couldnt" ? <Warn>Not approved in time</Warn> : isPastDue(s) ? <Warn>{span(-s.day)} past due</Warn> : <Muted>Due {fmtDay(s.day)}</Muted>}
                    </When>
                    <EmailBody doc={fillFor(bodyOf(s, templates), m)} tight />
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          })}
        </List>
        )}
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" $variant="secondary" disabled={!!busy}>
              Cancel
            </Button>
          </DialogClose>
          <OfflineGate reason={busy || !bulk ? null : reason(bulk.kind === "approve" ? "approve" : "delete")}>
            <Button
              $variant={bulk?.kind === "delete" ? "danger" : "primary"}
              onClick={() => bulk && onConfirm(bulk.kind, bulk.ids)}
              disabled={!!busy}
              aria-busy={!!busy || undefined}
            >
              {!busy && <Icon icon={bulk?.kind === "delete" ? Trash2 : Check} size={16} />}
              {busy?.label ?? text?.confirm}
            </Button>
          </OfflineGate>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
