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
import { useToast } from "@/components/ui/Toast";
import { type AutomaticEmail, MEMBERS, type ScheduledRecipient } from "../_data";
import { Row, RowMain, RowSide } from "./parts";

const MEMBER_OPTIONS = MEMBERS.map((m) => ({ value: m.n, label: m.n }));

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

  p {
    margin: 0;
  }
`;

const BodyPlaceholder = styled.div`
  padding: var(--space-4);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const MailFooter = styled.div`
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-xs);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const ColumnHeads = styled(Row)`
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
  background: var(--color-surface);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
`;

const Underlined = styled.span`
  text-decoration: underline;
`;

const Scroll = styled.div`
  margin: var(--space-3) calc(var(--space-5) * -1) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
`;

const Small = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Strong = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const Right = styled(RowSide)`
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  text-align: right;
  font-size: var(--text-sm);
`;

export function EmailPreviewDialog({
  open,
  onOpenChange,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: AutomaticEmail;
}) {
  const { toast } = useToast();
  const [asMember, setAsMember] = useState(MEMBERS[0].n);
  const first = asMember.split(" ")[0];
  const address = `${asMember.toLowerCase().split(" ").join(".")}@example.org`;
  const subject = email.subject ? email.subject.split("[First name]").join(first) : "(No subject yet)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Preview email</DialogTitle>
        <DialogDescription>Shown with {first}&apos;s details. Fields with no value use their fallback.</DialogDescription>
        <Field label="Preview as">
          {(props) => <Select {...props} options={MEMBER_OPTIONS} value={asMember} onValueChange={setAsMember} />}
        </Field>
        <Mail>
          <MailHeaders>
            <dt>From</dt>
            <dd>Social Development Centre</dd>
            <dt>To</dt>
            <dd>
              {asMember} &lt;{address}&gt;
            </dd>
            <dt>Reply-to</dt>
            <dd>suhanya@waterlooregion.org</dd>
            <dt>Subject</dt>
            <dd>
              <Strong>{subject}</Strong>
            </dd>
          </MailHeaders>
          <MailBody>
            <p>Hi {first},</p>
            <BodyPlaceholder>
              The message body goes here. It&apos;s written in the Email Editor, and personalization fields like first
              name fill in for each member.
            </BodyPlaceholder>
            <p>
              Warmly,
              <br />
              The Social Development Centre team
            </p>
          </MailBody>
          <MailFooter>
            You&apos;re getting this email because you&apos;re a member of the Social Development Centre.{" "}
            <Underlined>Unsubscribe</Underlined>
          </MailFooter>
        </Mail>
        <DialogActions>
          <Button $variant="outline" onClick={() => toast({ title: `Test sent to your inbox, previewed as ${asMember}` })}>
            Send test to my inbox
          </Button>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduledDialog({
  open,
  onOpenChange,
  title,
  recipients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  recipients: ScheduledRecipient[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Members scheduled to get this email so far. More are added as their trigger happens.
        </DialogDescription>
        <Scroll>
          <ColumnHeads aria-hidden="true">
            <RowMain>Recipient</RowMain>
            <Right>Sends on</Right>
          </ColumnHeads>
          {recipients.map((p) => (
            <Row key={p.name}>
              <RowMain>
                <Strong>{p.name}</Strong>
                <Small>{p.email}</Small>
              </RowMain>
              <Right>
                <span>{p.sendDate}</span>
                <Small>{p.when}</Small>
              </Right>
            </Row>
          ))}
        </Scroll>
        <DialogActions>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
