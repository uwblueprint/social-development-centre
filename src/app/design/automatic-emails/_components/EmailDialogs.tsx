"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { EMAIL_FOOTER } from "./EmailEditor";
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
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { VARIABLES } from "@/app/design/email-editor/variables";
import { type AutomaticEmail, MEMBERS, upcomingRecipients, TODAY, textToDoc } from "../_data";
import { renderEmailDoc, renderEmailText } from "./renderEmail";

const SAMPLE = "Maya Chen";
const SAMPLE_ADDRESS = "maya@example.com";

/** The previewed member's details by variable id. Referrer and referred names use the editor's examples. */
function valuesFor(name: string): Record<string, string> {
  const m = MEMBERS.find((x) => x.n === name) ?? { n: name, d: 0 };
  const [first, ...rest] = m.n.split(" ");
  const joined = new Date(TODAY);
  joined.setDate(joined.getDate() - m.d);
  const examples = Object.fromEntries(VARIABLES.filter((v) => v.group !== "member").map((v) => [v.id, v.example]));
  return {
    ...examples,
    first_name: first,
    last_name: rest.join(" "),
    full_name: m.n,
    email: m.n === SAMPLE ? SAMPLE_ADDRESS : `${m.n.toLowerCase().split(" ").join(".")}@example.org`,
    join_date: joined.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }),
  };
}

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
  fallbacks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: AutomaticEmail;
  fallbacks: Record<string, string>;
}) {
  const { toast } = useToast();
  const eligible = useMemo(() => upcomingRecipients(email).map((m) => m.name), [email]);
  const [picked, setPicked] = useState(eligible[0] ?? SAMPLE);
  const sample = eligible.length === 0;
  const asMember = sample ? SAMPLE : eligible.includes(picked) ? picked : eligible[0];
  const first = asMember.split(" ")[0];
  const address = sample ? SAMPLE_ADDRESS : `${asMember.toLowerCase().split(" ").join(".")}@example.org`;
  const options = eligible.map((n) => ({ value: n, label: n }));
  const values = valuesFor(asMember);
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
            {(props) => <Select {...props} options={options} value={asMember} onValueChange={setPicked} />}
          </Field>
        )}
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
            {email.body ? renderEmailDoc(email.body, values, fallbacks) : <BodyPlaceholder>No message yet.</BodyPlaceholder>}
          </MailBody>
          <MailFooter>
            <p>{EMAIL_FOOTER.organization}</p>
            <p>{`${EMAIL_FOOTER.address} · ${EMAIL_FOOTER.contact}`}</p>
            <p>
              {EMAIL_FOOTER.reason} <Underlined>Unsubscribe from emails</Underlined> · <Underlined>Cancel membership</Underlined>
            </p>
          </MailFooter>
        </Mail>
        <DialogActions>
          <Button $variant="outline" onClick={() => toast({ title: `Test sent to your inbox, previewed as ${asMember}` })}>
            <Icon icon={Send} size={14} />
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

