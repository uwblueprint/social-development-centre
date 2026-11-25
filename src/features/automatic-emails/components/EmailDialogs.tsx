"use client";

import { useState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { VARIABLES } from "@/features/email-editor/variables";
import { EMAIL_FOOTER, REPLY_TO } from "../footer";
import { type AutomaticEmail, type Recipient, textToDoc } from "../model";
import { renderEmailDoc, renderEmailText } from "./renderEmail";

/** Shown when nobody is scheduled yet: the editor's example member. */
const SAMPLE_NAME = "Maya Chen";
const SAMPLE_FIELDS: Record<string, string> = Object.fromEntries(VARIABLES.map((v) => [v.id, v.example]));

const Mail = styled.div`
  margin-top: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  overflow: hidden;
`;

const MailHeaders = styled.dl`
  margin: 0;
  padding: var(--space-3) var(--space-4);
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--color-border);

  dt {
    color: var(--color-text-muted);
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

const MailBody = styled.div`
  padding: var(--space-5) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  font-size: var(--text-md);
  line-height: var(--leading-prose);

  p,
  h1,
  blockquote {
    margin: 0;
  }
  h1 {
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
  }
  blockquote {
    padding-left: var(--space-3);
    border-left: 3px solid var(--color-border-strong);
    color: var(--color-text-muted);
  }
`;

const BodyPlaceholder = styled.div`
  padding: var(--space-4);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  line-height: var(--leading-footer);
  color: var(--color-text-muted);
`;

const MailFooter = styled.div`
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-xs);
  line-height: var(--leading-footer);
  color: var(--color-text-muted);

  p {
    margin: 0;
  }
`;

const Underlined = styled.span`
  text-decoration: underline;
`;

const Strong = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

export function EmailPreviewDialog({
  open,
  onOpenChange,
  email,
  recipients,
  fallbacks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: AutomaticEmail;
  /** Who the Outbox has this email scheduled for. Empty shows the sample member. */
  recipients: Recipient[];
  fallbacks: Record<string, string>;
}) {
  const [picked, setPicked] = useState(recipients[0]?.personId ?? "");
  const sample = recipients.length === 0;
  const member = recipients.find((r) => r.personId === picked) ?? recipients[0];
  const asName = member?.name ?? SAMPLE_NAME;
  const first = member?.fields.first_name ?? asName.split(" ")[0];
  const address = member?.email ?? SAMPLE_FIELDS.email;
  // Referrer and referred names use the editor's examples, as in the design.
  const values = member ? { ...SAMPLE_FIELDS, first_name: "", last_name: "", full_name: "", ...member.fields } : SAMPLE_FIELDS;
  const options = recipients.map((r) => ({ value: r.personId, label: r.name }));
  const subjectDoc = email.subjectDoc ?? (email.subject ? textToDoc(email.subject) : undefined);
  const subject = renderEmailText(subjectDoc, values, fallbacks) || "(No subject yet)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Preview email</DialogTitle>
        <DialogDescription style={{ lineHeight: "var(--leading-prose)" }}>
          {sample
            ? "Shown with a sample member. Fields with no value use their backup text."
            : `Shown with ${first}'s details. Fields with no value use their backup text.`}
        </DialogDescription>
        {!sample && (
          <Field label="Preview as">
            {(props) => <Select {...props} options={options} value={member?.personId ?? ""} onValueChange={setPicked} />}
          </Field>
        )}
        <Mail>
          <MailHeaders>
            <dt>From</dt>
            <dd>Social Development Centre</dd>
            <dt>To</dt>
            <dd>
              {asName} &lt;{address}&gt;
            </dd>
            <dt>Reply-to</dt>
            <dd>{REPLY_TO}</dd>
            <dt>Subject</dt>
            <dd>
              <Strong>{subject}</Strong>
            </dd>
          </MailHeaders>
          <MailBody>
            {email.body ? renderEmailDoc(email.body, values, fallbacks) : <BodyPlaceholder>No message yet.</BodyPlaceholder>}
          </MailBody>
          <MailFooter>
            <p>{EMAIL_FOOTER.organization}</p>
            <p>{`${EMAIL_FOOTER.address} · ${EMAIL_FOOTER.contact}`}</p>
            <p>
              {EMAIL_FOOTER.reason} <Underlined>Unsubscribe from emails</Underlined>
            </p>
          </MailFooter>
        </Mail>
        <DialogActions>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
