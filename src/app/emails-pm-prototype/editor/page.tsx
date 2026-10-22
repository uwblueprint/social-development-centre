"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { checkEmail, EmailEditor, type CheckIssue } from "@/features/emails/editor";
import { WORD_SAMPLE_HTML, sanitizeHtml } from "@/features/emails/editor/richtext";
import { MOMENT_LABEL, type EmailContent, type Moment, type MomentType } from "@/features/emails/model";
import { useEmails } from "@/features/emails/store";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 48rem;
`;

const H1 = styled.h1`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const SelectWidth = styled.div`
  width: 16rem;
`;

const EMPTY: EmailContent = { subject: "", bodyHtml: "" };
const FILLED: EmailContent = {
  subject: "Welcome, {{member.firstName}}",
  bodyHtml:
    "<p>Hi {{member.firstName}},</p><p>Thanks for joining the <strong>Social Development Centre</strong>. Here is what happens next:</p><ul><li>Pick an opportunity you like</li><li>Come to a <a href=\"https://example.org/welcome\">welcome night</a></li></ul><p>See you soon!</p>",
};
const WRONG_VARIABLE: EmailContent = {
  subject: "{{referrer.firstName}} says hello",
  bodyHtml: "<p>Hi {{member.firstName}}, {{referrer.fullName}} sent you here.</p>",
};

const MOMENTS = [
  { value: "none", label: "One-off (no moment)" },
  ...(Object.keys(MOMENT_LABEL) as MomentType[]).map((m) => ({ value: m, label: MOMENT_LABEL[m] })),
];

export default function EditorSandbox() {
  const api = useEmails();
  const [value, setValue] = React.useState<EmailContent>(EMPTY);
  const [momentType, setMomentType] = React.useState<string>("join-any");
  const [issues, setIssues] = React.useState<CheckIssue[]>([]);

  const moment: Moment | undefined =
    momentType === "none" ? undefined : { type: momentType as MomentType, tag: momentType === "tag-added" ? "Volunteer" : undefined };
  const previewMembers = api.state.members.filter((m) => m.status === "active").slice(0, 6);

  const load = (next: EmailContent, run = false) => {
    setValue(next);
    setIssues(run ? checkEmail(next, moment) : []);
  };

  return (
    <Page>
      <H1>Email editor</H1>
      <Buttons>
        <Button $variant="outline" $size="sm" onClick={() => load(EMPTY)}>
          Empty
        </Button>
        <Button $variant="outline" $size="sm" onClick={() => load(FILLED)}>
          Filled
        </Button>
        <Button $variant="outline" $size="sm" onClick={() => load(WRONG_VARIABLE, true)}>
          With issues
        </Button>
        <Button
          $variant="outline"
          $size="sm"
          onClick={() => load({ subject: value.subject || "Paste test", bodyHtml: sanitizeHtml(WORD_SAMPLE_HTML) })}
        >
          Paste from Word
        </Button>
        <SelectWidth>
          <Select aria-label="Moment" options={MOMENTS} value={momentType} onValueChange={setMomentType} />
        </SelectWidth>
      </Buttons>
      <EmailEditor
        key={momentType}
        value={value}
        onChange={(next) => {
          setValue(next);
          if (issues.length) setIssues(checkEmail(next, moment));
        }}
        moment={moment}
        context={moment ? "automatic" : "one-off"}
        issues={issues}
        previewMembers={previewMembers}
      />
    </Page>
  );
}
