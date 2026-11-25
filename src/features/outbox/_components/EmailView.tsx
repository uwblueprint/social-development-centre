"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ArrowLeft, ArrowUpRight, Info, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmailEditor } from "@/features/email-editor";
import { EmailDocView } from "./EmailDocView";
import {
  automaticEmailHref,
  bodyOf,
  fillFor,
  isEdited,
  draftOf,
  templateFor,
  subjectOf,
  timingLabel,
  type Send,
} from "../_data";
import { useOutboxLock } from "../_lock";
import { useOutboxData } from "../_outboxData";
import type { OpenEmail } from "../_types";
import { FailureAlert } from "./FailureAlert";
import { MemberPanel } from "./MemberPanel";
import { OfflineGate } from "./OfflineGate";
import { docsEqual } from "../_emailDoc";

/*
 * Opening a recipient replaces the calendar with their email. It opens read-only; "Edit email" switches
 * the subject and message to fields. The template is never editable; it stays a link.
 *
 * Clearing the queue: opened from a list, an email shows "{i} of {n}" with Previous / Next. "Approve and
 * next" (or "Resend and next") acts and opens the next email in the list's order; on the last one it is
 * plain "Approve" / "Resend" and returns to the calendar.
 * Keyboard (when focus is not in the list, a field, or a dialog or menu, and nothing is being edited):
 *   j  next email      k  previous email      a  approve (or resend) and open the next one
 * Same j / k as the list. The shortcut for a is in the primary button's tooltip.
 * The read view is a card with the template and subject as rows, then the message and the email's footer, drawn by
 * EmailDocView with this member's details filled in. "Edit email" switches to Shallot's EmailEditor
 * (src/app/design/email-editor, shared with Automatic Emails). The Outbox stores an edit as the editor's own documents (TipTap JSON), so formatting is
 * kept; _emailDoc.ts has the conversions (templates are written as text with "[First name]" labels).
 */

/** The template picker's id, so the switch-template dialog can hand focus back to it. */
export const TEMPLATE_PICKER_ID = "outbox-template-picker";

/*
 * Layout: the email column (--flow-width) with the member panel (--search-width) to its right, --space-6 apart.
 * The email column shrinks from 720px down to 416px first, so the panel sits beside it from 416 + 24 + 280 = 720px (room for a scrollbar at 1440px)
 * of pane (a laptop-width window). Narrower than that, the panel drops below the email's actions,
 * full column width. The container is the pane, not the window, because the list pane takes space beside it.
 */
const Outer = styled.div`
  container-type: inline-size;
  min-width: 0;
`;

/* The top bar spans both columns when they sit side by side, so the next arrow lines up with the panel's right edge. */
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  max-width: var(--flow-width);

  @container (min-width: 720px) {
    max-width: calc(var(--flow-width) + var(--space-5) + var(--search-width));
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
  align-items: start;
  /* Side by side: the same distance each side of the divider (the panel's own border and padding), so the gap is --space-5, not --space-6. */
  @container (min-width: 720px) {
    column-gap: var(--space-5);
  }

  @container (min-width: 720px) {
    grid-template-columns: minmax(0, var(--flow-width)) var(--search-width);
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
`;

/* What happened while the connection was down. Info tone, with an icon and words. */
const Note = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-lg);
  background: var(--color-info-subtle);
  font-size: var(--text-sm);

  & > svg {
    flex: none;
    color: var(--color-info);
  }
`;

/* A ghost button's own padding (plus its 1px border) is pulled back out, so its visible content lines up with the column edge and only the hover box bleeds. */
const Back = styled(Button)`
  align-self: flex-start;
  margin-left: calc(-1 * (var(--space-3) + 1px));
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
`;

const HeaderText = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const NameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/* Takes the calendar's place, so it matches the calendar's section title. */
const Name = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);

  /* Focused by script when the email opens, so a keyboard user lands on what they opened. Not a control: no ring for the mouse. */
  &:focus {
    outline: none;
  }
  &:focus-visible {
    border-radius: var(--radius-sm);
    box-shadow: var(--focus-ring);
  }
`;

const Sub = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const HeaderActions = styled.div`
  flex: none;
  display: flex;
  gap: var(--space-2);
`;

const EmailCard = styled(Card)`
  padding: 0;
  overflow: visible;
  transition: border-color var(--duration) var(--ease-out);

  /* Editing happens in place, so the card itself shows where focus is and when a field has an error. */
  &[data-editing]:focus-within {
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring-text);
  }
  &[data-invalid],
  &[data-invalid]:focus-within {
    border-color: var(--color-danger);
  }
  &[data-invalid]:focus-within {
    box-shadow: var(--focus-ring-text-invalid);
  }
`;

const Meta = styled.dl`
  margin: 0;
  font-size: var(--text-sm);
`;

/* One term and its value. Rows are split by a full-width hairline; a <dl> can only hold dt/dd groups. */
const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: baseline;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);

  & + &,
  &[data-follows] {
    padding: var(--space-3) var(--space-4) var(--space-4);
    border-top: 1px solid var(--color-border);
  }
  & dt {
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    min-width: 0;
  }
  /* <strong> defaults to 700; the type scale stops at medium. */
  & strong {
    font-weight: var(--weight-medium);
  }
`;

const TemplateRow = styled.dd`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);

  & > :last-child:not(:first-child) {
    margin-left: auto;
    /* Ghost "Reset": bleed its padding so its text ends on the value column's right edge. */
    margin-right: calc(-1 * (var(--space-3) + 1px));
  }
`;

/* The read view of the template: plain text that opens the automatic email in a new tab. Wraps; never truncates. */
const TemplateLink = styled.a`
  color: var(--color-text);
  text-decoration: none;
  border-radius: var(--radius-sm);

  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const LinkIcon = styled.span`
  display: inline-block;
  margin-left: var(--space-1);
  vertical-align: -2px;
  white-space: nowrap;
`;

/* Regular weight, read or edited, so starting to edit changes nothing. A block, so the field fills the row. */
const SubjectText = styled.span`
  display: block;
`;

const ReadBody = styled.div`
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-md);
  line-height: var(--leading-body);
`;

/* What every email ends with: muted, split from the message by a hairline. */
const ReadFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  line-height: var(--leading-footer);
`;

const FooterSmall = styled.div`
  font-size: var(--text-xs);
`;



/** What every email ends with. The editor's footer and the read view's footer say the same. */
const EMAIL_FOOTER = {
  reason: "You're getting this because you're an SDC member.",
  organization: "Social Development Centre Waterloo Region",
  address: "Mailing address to come",
  contact: "suhanya@waterlooregion.org",
};

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  /* Delete on the left, the main action on the right. */
  justify-content: space-between;
  gap: var(--space-2);
`;

interface EmailViewProps {
  send: Send;
  open: OpenEmail;
  onChange: (o: OpenEmail) => void;
  onBack: () => void;
  onSave: () => void;
  onApprove: () => void;
  onResend: () => void;
  onDelete: () => void;
  onReset: () => void;
  onResetDraft: () => void;
  /** Where this email sits in the list it was opened from; null when it isn't in that list. */
  position: { index: number; count: number } | null;
  hasPrev: boolean;
  hasNext: boolean;
  /** Offline, only emails that were opened before can be opened. */
  canOpenPrev: boolean;
  canOpenNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Every send, so the panel can list this member's other emails. */
  sends: Send[];
  /** State lab Validation error: what the server rejected in the edit fields, keyed by field. */
  errors: { subject?: string; body?: string } | null;
  /** Something that happened while offline, shown at the top. */
  sentNote: string | null;
}

export function EmailView({ send, open, onChange, onBack, onSave, onApprove, onResend, onDelete, onReset, onResetDraft, errors, sentNote, sends, hasPrev, hasNext, canOpenPrev, canOpenNext, onPrev, onNext }: EmailViewProps) {
  const { members, templates } = useOutboxData();
  // The email stays readable and its draft editable while changes are locked (offline, signed out, saving...).
  const { locked, reason, busy } = useOutboxLock();
  const m = members[send.member];
  const editing = open.editing;
  const panelId = React.useId();
  const subjectId = `${panelId}-subject`;
  const bodyId = `${panelId}-body`;
  const nameRef = React.useRef<HTMLHeadingElement>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  // The editor reads its text once, when it mounts. When the draft changes from outside it (its Undo), the editor is mounted again on the new text. `typed` is what the editor itself last reported.
  const [typed, setTyped] = React.useState({ subject: open.draftSubject, body: open.draftBody });
  const [editorKey, setEditorKey] = React.useState(0);
  if (typed.subject !== open.draftSubject || typed.body !== open.draftBody) {
    setTyped({ subject: open.draftSubject, body: open.draftBody });
    setEditorKey((k) => k + 1);
  }
  // Opening (or switching to) another email moves focus to its heading; the next Tab is Edit email.
  React.useEffect(() => {
    nameRef.current?.focus();
  }, [send.id]);
  // Entering edit mode puts the caret in the subject. The editor's two fields also get ids, so the error summary can focus them.
  React.useEffect(() => {
    if (!editing) return;
    const frame = requestAnimationFrame(() => {
      const fields = editorRef.current?.querySelectorAll<HTMLElement>('[contenteditable="true"]');
      if (!fields?.length) return;
      fields[0].id = subjectId;
      if (fields[1]) fields[1].id = bodyId;
      fields[0].focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [editing, editorKey]); // eslint-disable-line react-hooks/exhaustive-deps -- the ids are stable for this panel
  const draftT = templateFor(templates[send.template], m);
  const draftEdited = !docsEqual(open.draftSubject, draftT.subject) || !docsEqual(open.draftBody, draftT.body);
  const personalized = editing ? draftEdited : isEdited(send);
  const templateName = templates[send.template].name;
  // The read view: this member's own subject and message, with their details where the email has personalized text.
  const readSubject = React.useMemo(() => fillFor(subjectOf(send, templates), m), [send, m, templates]);
  const readBody = React.useMemo(() => fillFor(bodyOf(send, templates), m), [send, m, templates]);
  const templateLabel = personalized ? `Personalized, based on ${templateName}` : templateName;
  // Reset shows once the subject or message differs from the template's.
  const canReset = editing ? draftEdited : isEdited(send);

  // What the primary action is. A failed send that was never approved is fixed by approving it; a bounce by resending;
  // our own failure is retried by the system, so there is nothing to press.
  const primary: "approve" | "resend" | null =
    send.status === "review" || (send.status === "couldnt" && send.fail === "admin")
      ? "approve"
      : send.status === "couldnt" && send.fail === "bounce"
        ? "resend"
        : null;

  // Shortcuts: j next, k previous, a approve / resend (and open the next), Delete deletes. Not while typing, editing, or in a dialog, menu or the list.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (editing) return;
      if (el?.closest('input, textarea, select, [contenteditable="true"], [data-roving], [role="tablist"]')) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')) return;
      const k = e.key.toLowerCase();
      if (k === "j" && hasNext && canOpenNext) onNext();
      else if (k === "k" && hasPrev && canOpenPrev) onPrev();
      else if (k === "a" && primary && !locked) (primary === "approve" ? onApprove : onResend)();
      else if ((k === "delete" || k === "backspace") && !locked) onDelete();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing, hasPrev, hasNext, canOpenPrev, canOpenNext, primary, locked, onPrev, onNext, onApprove, onResend, onDelete]);

  const why = reason;
  // The button that started the action in flight says so and is disabled, with no reason (its own label explains).
  const doing = (kind: NonNullable<typeof busy>["kind"]) => (busy?.kind === kind ? busy : null);
  const fieldErrors = [
    ...(errors?.subject ? [{ fieldId: subjectId, message: errors.subject }] : []),
    ...(errors?.body ? [{ fieldId: bodyId, message: errors.body }] : []),
  ];

  // The Subject row, read or edited: the same row either way, so starting to edit moves nothing.
  const subjectRow = (value: React.ReactNode) => (
    <MetaRow data-follows="">
      <dt>Subject</dt>
      <dd>
        <SubjectText>{value}</SubjectText>
      </dd>
    </MetaRow>
  );

  return (
    // The email's text stays selectable: a drag here selects text, not rows (see useMarqueeSelect).
    <Outer
      data-no-marquee=""
      data-email-view=""
      // Ctrl or Cmd + Enter saves while editing. Captured, so the editor doesn't turn it into a line break first.
      onKeyDownCapture={(e) => {
        if (!editing || e.key !== "Enter" || !(e.ctrlKey || e.metaKey) || e.nativeEvent.isComposing) return;
        e.preventDefault();
        e.stopPropagation();
        if (!doing("save") && !why("save your changes")) onSave();
      }}
    >
    <Wrap>
      <TopRow>
        <Back
          $variant="ghost"
          $size="sm"
          onClick={onBack}
        >
          <Icon icon={ArrowLeft} size={16} />
          Back to calendar
        </Back>
      </TopRow>


      <Columns>
      <Column>
      {sentNote && (
        <Note>
          <Icon icon={Info} size={16} />
          <span>{sentNote}</span>
        </Note>
      )}
      {send.status === "couldnt" && <FailureAlert send={send} />}
      <Header>
        <HeaderText>
          <NameRow>
            <Name ref={nameRef} tabIndex={-1}>
              {m.name}
            </Name>
          </NameRow>
          <Sub>{timingLabel(send)}</Sub>
        </HeaderText>
        <HeaderActions>
          {editing ? (
            <>
              <Button $variant="outline" onClick={() => onChange({ ...open, editing: false, ...draftOf(send, m, templates) })}>
                Cancel
              </Button>
              <OfflineGate reason={doing("save") ? null : why("save your changes")}>
                <Button $variant="primary" onClick={onSave} disabled={!!doing("save")} aria-busy={!!doing("save") || undefined}>
                  {doing("save")?.label ?? "Save edits"}
                </Button>
              </OfflineGate>
            </>
          ) : (
            <OfflineGate reason={why("edit")}>
              <Button
                $variant="outline"
                onClick={() => onChange({ ...open, editing: true, ...draftOf(send, m, templates) })}
              >
                <Icon icon={Pencil} size={16} />
                Edit email
              </Button>
            </OfflineGate>
          )}
        </HeaderActions>
      </Header>

      {editing && fieldErrors.length > 0 && (
        <ErrorSummary title={fieldErrors.length === 1 ? "Fix 1 thing to save" : `Fix ${fieldErrors.length} things to save`} errors={fieldErrors} />
      )}
      <EmailCard ref={editorRef} data-editing={editing || undefined} data-invalid={(editing && fieldErrors.length > 0) || undefined}>
        <Meta>
          <MetaRow>
            <dt>Template</dt>
            <TemplateRow>
              <TemplateLink
                href={automaticEmailHref(send.template)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${templateLabel}, opens in a new tab`}
              >
                {templateLabel}
                <LinkIcon>
                  <Icon icon={ArrowUpRight} size={14} />
                </LinkIcon>
              </TemplateLink>
              {canReset && (
                <OfflineGate reason={why("reset")}>
                  <Button $variant="ghost" $size="sm" onClick={editing ? onResetDraft : onReset}>
                    Reset to original template
                  </Button>
                </OfflineGate>
              )}
            </TemplateRow>
          </MetaRow>
          {!editing && subjectRow(<EmailDocView doc={readSubject} inline />)}
        </Meta>
        {editing ? (
          /* Edited in place: the subject stays in its row, the toolbar slides in above the message, the footer stays put.
             No attachments or preview: only the subject and message are stored for a send. */
          <EmailEditor
            key={`${send.id}-${editorKey}`}
            moment="one_off"
            initialSubject={open.draftSubject}
            initialBody={open.draftBody}
            footer={EMAIL_FOOTER}
            hidePreview
            embedded
            personalize={false}
            subjectRow={(field) => <Meta>{subjectRow(field)}</Meta>}
            onChange={(d) => {
              if (docsEqual(d.subject, open.draftSubject) && docsEqual(d.body, open.draftBody)) return;
              setTyped({ subject: d.subject, body: d.body });
              onChange({ ...open, draftSubject: d.subject, draftBody: d.body });
            }}
          />
        ) : (
          <>
            <ReadBody>
              <EmailDocView doc={readBody} tight />
            </ReadBody>
            <ReadFooter>
              <div>
                {EMAIL_FOOTER.organization}
                <br />
                {`${EMAIL_FOOTER.address} · ${EMAIL_FOOTER.contact}`}
              </div>
              <FooterSmall>
                {EMAIL_FOOTER.reason} <u>Unsubscribe from emails</u> · <u>Cancel membership</u>
              </FooterSmall>
            </ReadFooter>
          </>
        )}
      </EmailCard>

      {!editing && (
        <Actions>
          <OfflineGate reason={doing("delete") ? null : why("delete")}>
            <Button $variant="danger-outline" onClick={onDelete} disabled={!!doing("delete")} aria-busy={!!doing("delete") || undefined}>
              <Icon icon={Trash2} size={16} />
              {doing("delete")?.label ?? "Delete email"}
            </Button>
          </OfflineGate>
          {primary === "approve" && (
            <OfflineGate reason={doing("approve") ? null : why("approve")}>
              <Tooltip content="Shortcut: A">
                <Button $variant="primary" onClick={onApprove} disabled={!!doing("approve")} aria-busy={!!doing("approve") || undefined}>
                  {doing("approve")?.label ?? "Approve"}
                </Button>
              </Tooltip>
            </OfflineGate>
          )}
          {primary === "resend" && (
            <OfflineGate reason={doing("resend") ? null : why("resend")}>
              <Tooltip content="Shortcut: A">
                <Button $variant="primary" onClick={onResend} disabled={!!doing("resend")} aria-busy={!!doing("resend") || undefined}>
                  {doing("resend")?.label ?? "Resend"}
                </Button>
              </Tooltip>
            </OfflineGate>
          )}
        </Actions>
      )}
      </Column>

      <MemberPanel send={send} sends={sends} />
      </Columns>
    </Wrap>
    </Outer>
  );
}
