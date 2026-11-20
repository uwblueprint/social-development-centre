"use client";

import { styled } from "next-yak";
import { AlertCircle, ArrowLeft, Check, ChevronDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { Textarea } from "@/components/ui/Textarea";
import {
  ago,
  bodyOf,
  fill,
  fmtDay,
  gmailComposeUrl,
  isEdited,
  MEMBERS,
  plural,
  subjectOf,
  TEMPLATE_KEYS,
  TEMPLATES,
  type Send,
  type TemplateKey,
} from "./data";
import type { OpenEmail } from "./OutboxPage";

/*
 * Opening a recipient replaces the calendar with their email. It opens read-only; "Edit email" switches
 * the subject and message to fields, and only then can the template be changed.
 * TODO(editor): swap the subject Input and message Textarea for Shallot's EmailEditor
 * (src/app/design/email-editor on gaurav/design-automatic-emails) once TipTap lands in main.
 */

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  max-width: 760px;
`;

const Back = styled(Button)`
  align-self: flex-start;
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

const Name = styled.h2`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
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

const Alert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-lg);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  & > svg {
    flex: none;
    margin-top: 2px;
  }
`;

const AlertText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--color-text);

  & strong {
    color: var(--color-danger);
    font-weight: var(--weight-medium);
  }
`;

const ExternalLink = styled.a`
  align-self: flex-start;
  color: var(--color-text);
  font-weight: var(--weight-medium);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

const EmailCard = styled(Card)`
  padding: 0;
  overflow: visible;
`;

const Meta = styled.dl`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: baseline;
  gap: var(--space-2) var(--space-3);
  margin: 0;
  padding: var(--space-4);
  font-size: var(--text-sm);

  & dt {
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    min-width: 0;
  }
`;

const MetaDivider = styled.div`
  grid-column: 1 / -1;
  height: 1px;
  margin: var(--space-1) calc(var(--space-4) * -1);
  background: var(--color-border);
`;

const TemplateRow = styled.dd`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);

  & > :last-child:not(:first-child) {
    margin-left: auto;
  }
`;

const Body = styled.div`
  padding: var(--space-5) var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-md);
  line-height: var(--leading-body);
  white-space: pre-line;
`;

const EditBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0 var(--space-4);
  padding: var(--space-3) 0 var(--space-4);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  line-height: var(--leading-footer);
`;

const FooterSmall = styled.div`
  font-size: var(--text-xs);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const PickerButton = styled(Button)`
  gap: var(--space-1);
`;

interface Props {
  send: Send;
  open: OpenEmail;
  onChange: (o: OpenEmail) => void;
  onBack: () => void;
  onSave: () => void;
  onPickTemplate: (key: TemplateKey) => void;
  onApprove: () => void;
  onSendNow: () => void;
  onResend: () => void;
  onDelete: () => void;
  onReset: () => void;
  onResetDraft: () => void;
}

export function EmailView({ send, open, onChange, onBack, onSave, onPickTemplate, onApprove, onSendNow, onResend, onDelete, onReset, onResetDraft }: Props) {
  const m = MEMBERS[send.member];
  const editing = open.editing;
  const draftT = TEMPLATES[open.draftTemplate];
  const draftEdited = open.draftSubject !== draftT.subject || open.draftBody !== draftT.body;
  const personalized = editing ? draftEdited : isEdited(send);
  const templateName = editing ? draftT.name : TEMPLATES[send.template].name;
  // While editing, reset shows after any change, including switching to another template.
  const canReset = editing ? draftEdited || open.draftTemplate !== send.template : isEdited(send);

  const sub =
    send.status === "couldnt"
      ? `Couldn't send ${ago(-send.day)}`
      : send.day < 0
        ? `${plural(-send.day, "day", "days")} past due`
        : send.day === 0
          ? "Sends today"
          : `Sends ${fmtDay(send.day)}`;

  const footer = (
    <Footer>
      <div>
        Social Development Centre Waterloo Region
        <br />
        Mailing address to come · suhanya@waterlooregion.org
      </div>
      <FooterSmall>
        You&apos;re getting this because you&apos;re an SDC member. <u>Unsubscribe from emails</u> · <u>Cancel membership</u>
      </FooterSmall>
    </Footer>
  );

  return (
    <Wrap>
      <Back
        $variant="ghost"
        $size="sm"
        onClick={() => {
          if (editing && (draftEdited || open.draftTemplate !== send.template) && !window.confirm("Discard your changes?")) return;
          onBack();
        }}
      >
        <Icon icon={ArrowLeft} size={16} />
        Back to calendar
      </Back>

      {send.status === "couldnt" && (
        <Alert role="alert">
          <Icon icon={AlertCircle} size={16} />
          <AlertText>
            {send.fail === "admin" && (
              <>
                <strong>This email wasn&apos;t approved in time</strong>
                <span>It was still waiting for review on its send day so it didn&apos;t go out, give it a look below and click Resend when it&apos;s ready</span>
              </>
            )}
            {send.fail === "platform" && (
              <>
                <strong>Something went wrong on our end</strong>
                <span>
                  We tried sending this a few times and it still didn&apos;t go through, we&apos;ll try again with tomorrow morning&apos;s emails or you can send it yourself from Gmail if it can&apos;t wait
                </span>
                <ExternalLink href={gmailComposeUrl(m.email, fill(subjectOf(send), m), fill(bodyOf(send), m))} target="_blank" rel="noopener noreferrer">
                  Send it from Gmail (opens in a new tab)
                </ExternalLink>
              </>
            )}
            {send.fail === "bounce" && (
              <>
                <strong>{m.email} bounced</strong>
                <span>This address may be wrong, please confirm the right email with the recipient and then click Resend</span>
              </>
            )}
          </AlertText>
        </Alert>
      )}

      <Header>
        <HeaderText>
          <NameRow>
            <Name>{m.name}</Name>
            {m.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </NameRow>
          <Sub>{sub}</Sub>
        </HeaderText>
        <HeaderActions>
          {editing ? (
            <>
              <Button $variant="outline" onClick={() => onChange({ ...open, editing: false, draftTemplate: send.template, draftSubject: subjectOf(send), draftBody: bodyOf(send) })}>
                Cancel
              </Button>
              <Button $variant="primary" onClick={onSave}>
                Save edits
              </Button>
            </>
          ) : (
            <Button
              $variant="outline"
              onClick={() => onChange({ ...open, editing: true, draftTemplate: send.template, draftSubject: subjectOf(send), draftBody: bodyOf(send) })}
            >
              <Icon icon={Pencil} size={16} />
              Edit email
            </Button>
          )}
        </HeaderActions>
      </Header>

      <EmailCard>
        <Meta>
          <dt>Template</dt>
          <TemplateRow>
            {editing ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <PickerButton $variant="outline" $size="sm" aria-label={`Template: ${personalized ? `personalized, based on ${templateName}` : templateName}. Change template`}>
                    <Tag color={personalized ? "sky" : undefined}>{personalized ? "Personalized" : templateName}</Tag>
                    <Icon icon={ChevronDown} size={14} />
                  </PickerButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Switch template</DropdownMenuLabel>
                  {TEMPLATE_KEYS.map((k) => (
                    <DropdownMenuItem key={k} onSelect={() => k !== open.draftTemplate && onPickTemplate(k)}>
                      {k === open.draftTemplate ? <Icon icon={Check} size={14} /> : <Icon icon={Check} size={14} style={{ visibility: "hidden" }} />}
                      {TEMPLATES[k].name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Tag color={personalized ? "sky" : undefined}>{personalized ? "Personalized" : templateName}</Tag>
            )}
            {canReset && (
              <Button $variant="ghost" $size="sm" onClick={editing ? onResetDraft : onReset}>
                Reset to original template
              </Button>
            )}
          </TemplateRow>
          <MetaDivider aria-hidden="true" />
          <dt>Subject</dt>
          <dd>
            <strong>{fill(editing ? open.draftSubject : subjectOf(send), m)}</strong>
          </dd>
        </Meta>
        {editing ? (
          <EditBody>
            <Field label="Subject">
              {(p) => <Input {...p} value={open.draftSubject} onChange={(e) => onChange({ ...open, draftSubject: e.target.value })} />}
            </Field>
            <Field label="Message" hint="Write [First name] where the member's first name should go.">
              {(p) => <Textarea {...p} rows={8} value={open.draftBody} onChange={(e) => onChange({ ...open, draftBody: e.target.value })} />}
            </Field>
          </EditBody>
        ) : (
          <Body>{fill(bodyOf(send), m)}</Body>
        )}
        {footer}
      </EmailCard>

      {!editing && (
        <Actions>
          <Button $variant="ghost" onClick={onDelete}>
            Delete email
          </Button>
          {send.status === "review" && (
            <Button $variant="primary" onClick={onApprove}>
              Approve
            </Button>
          )}
          {(send.status === "scheduled" || send.status === "pending") && (
            <Button $variant="primary" onClick={onSendNow}>
              Send now
            </Button>
          )}
          {send.status === "couldnt" && (
            <Button $variant="primary" onClick={onResend}>
              Resend
            </Button>
          )}
        </Actions>
      )}
    </Wrap>
  );
}
