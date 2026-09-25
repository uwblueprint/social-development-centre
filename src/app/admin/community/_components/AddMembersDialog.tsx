"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState, type ActionState } from "@/lib/forms";
import { confirmImport, previewImport } from "../_data/actions";
import type { ImportPreview, MemberTier } from "../_data/types";

const idlePreviewState: ActionState<ImportPreview> = { status: "idle" };

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

const Step = styled.div`
  display: grid;
  gap: var(--space-4);
`;

const SummaryList = styled.dl`
  display: grid;
  gap: var(--space-2);
  margin: 0;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: var(--text-sm);
`;

const SummaryLabel = styled.dt`
  color: var(--color-text-muted);
`;

const SummaryValue = styled.dd`
  margin: 0;
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const IssueList = styled.ul`
  margin: calc(var(--space-1) * -1) 0 0;
  padding-left: var(--space-5);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-wrap: anywhere;
`;

const Note = styled.p`
  margin: calc(var(--space-1) * -1) 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const ErrorNote = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

const EmailCount = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

export function AddMembersDialog({
  open,
  onOpenChange,
  tab,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: MemberTier;
}) {
  const { toast } = useToast();
  const [step, setStep] = React.useState<"input" | "preview">("input");
  const [emailsText, setEmailsText] = React.useState("");
  const [skipEmails, setSkipEmails] = React.useState(false);

  const [previewState, previewAction] = useActionState(previewImport.bind(null, tab), idlePreviewState);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmImport.bind(null, tab), idleState);

  // Moves to the preview step once a check returns a result, success or not
  // (the "nothing to add" case still returns `data` to explain why);
  // derived at render time instead of in an effect.
  const [handledPreview, setHandledPreview] = React.useState(previewState);
  if (previewState !== handledPreview) {
    setHandledPreview(previewState);
    if (previewState.data) setStep("preview");
  }

  React.useEffect(() => {
    if (confirmState.status === "success") {
      onOpenChange(false);
      toast({ title: confirmState.message ?? "Members added." });
    } else if (confirmState.status === "error") {
      onOpenChange(false);
      toast({ title: confirmState.message ?? "The members weren't added." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState]);

  const preview = previewState.data;
  const addCount = preview ? preview.toCreate.length + preview.toUpgrade.length : 0;
  const emailsToSend = preview ? (skipEmails ? 0 : preview.emailsToSend) : 0;

  function handleConfirm() {
    const fd = new FormData();
    fd.set("emails", emailsText);
    fd.set("skipEmails", skipEmails ? "yes" : "no");
    confirmAction(fd);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{tab === "paying" ? "Add paying members" : "Add general members"}</DialogTitle>
        <DialogDescription>
          Paste the email addresses to add. We check them before anything is saved or sent.
        </DialogDescription>

        {step === "input" || !preview ? (
          <Form action={previewAction}>
            <Field
              label="Email addresses"
              hint="One per line or separated by commas"
              error={fieldError(previewState, "emails")}
              required
            >
              {(p) => (
                <Textarea
                  {...p}
                  name="emails"
                  value={emailsText}
                  onChange={(event) => setEmailsText(event.target.value)}
                  placeholder="ada@example.org, grace@example.org"
                  rows={6}
                />
              )}
            </Field>
            <DialogActions>
              <DialogClose asChild>
                <Button type="button" $variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton>Check addresses</SubmitButton>
            </DialogActions>
          </Form>
        ) : (
          <Step>
            {previewState.status === "error" && <ErrorNote>{previewState.message}</ErrorNote>}

            <SummaryList>
              <SummaryRow>
                <SummaryLabel>New members to add</SummaryLabel>
                <SummaryValue>{preview.toCreate.length}</SummaryValue>
              </SummaryRow>
              {tab === "paying" && (
                <SummaryRow>
                  <SummaryLabel>General members to upgrade</SummaryLabel>
                  <SummaryValue>{preview.toUpgrade.length}</SummaryValue>
                </SummaryRow>
              )}
              <SummaryRow>
                <SummaryLabel>Already members (skipped)</SummaryLabel>
                <SummaryValue>{preview.toSkip.length}</SummaryValue>
              </SummaryRow>
              {preview.toSkip.length > 0 && <Note>Paying members are never downgraded.</Note>}
              <SummaryRow>
                <SummaryLabel>Unsubscribed (not added)</SummaryLabel>
                <SummaryValue>{preview.unsubscribed.length}</SummaryValue>
              </SummaryRow>
              {preview.unsubscribed.length > 0 && (
                <>
                  <IssueList>
                    {preview.unsubscribed.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </IssueList>
                  <Note>Restore them individually first.</Note>
                </>
              )}
              <SummaryRow>
                <SummaryLabel>Invalid</SummaryLabel>
                <SummaryValue>{preview.invalid.length}</SummaryValue>
              </SummaryRow>
              {preview.invalid.length > 0 && (
                <IssueList>
                  {preview.invalid.map((token) => (
                    <li key={token}>{token}</li>
                  ))}
                </IssueList>
              )}
              <SummaryRow>
                <SummaryLabel>Duplicates removed</SummaryLabel>
                <SummaryValue>{preview.duplicatesRemoved}</SummaryValue>
              </SummaryRow>
            </SummaryList>

            <EmailCount>Emails that will be sent: {emailsToSend}</EmailCount>
            <Checkbox
              label="Don't send welcome emails (only for importing SDC's existing list)"
              checked={skipEmails}
              onCheckedChange={(value) => setSkipEmails(value === true)}
            />

            <DialogActions>
              <Button type="button" $variant="secondary" onClick={() => setStep("input")} disabled={confirmPending}>
                Back
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={confirmPending} aria-busy={confirmPending || undefined}>
                {confirmPending ? "Adding…" : `Add ${addCount} members`}
              </Button>
            </DialogActions>
          </Step>
        )}
      </DialogContent>
    </Dialog>
  );
}
