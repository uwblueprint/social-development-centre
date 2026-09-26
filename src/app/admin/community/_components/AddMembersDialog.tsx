"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState, type ActionState } from "@/lib/forms";
import { confirmImport, previewImport } from "../_data/actions";
import type { ImportPreview, MemberTier } from "../_data/types";
import { communityCopy as copy } from "../_copy";

const idlePreviewState: ActionState<ImportPreview> = { status: "idle" };

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

const Step = styled.div`
  display: grid;
  gap: var(--space-3);
`;

const Summary = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const ErrorNote = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

const IssueList = styled.div`
  display: grid;
  gap: 2px;
`;

const IssueTrigger = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

const IssueChevron = styled.span<{ $open?: boolean }>`
  display: inline-flex;
  transition: transform var(--duration) var(--ease);
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
`;

const IssueAddresses = styled.ul`
  margin: 0;
  padding: 2px 0 var(--space-1) var(--space-5);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-wrap: anywhere;
`;

const DuplicatesNote = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

/** A compact, expandable "N reason" line that reveals the affected addresses. */
function IssueLine({ label, addresses }: { label: string; addresses: string[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <IssueTrigger type="button" aria-label={copy.addDialog.toggleAddresses(label, open)}>
          <IssueChevron aria-hidden="true" $open={open}>
            <Icon icon={ChevronRight} size={12} />
          </IssueChevron>
          {label}
        </IssueTrigger>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <IssueAddresses>
          {addresses.map((email) => (
            <li key={email}>{email}</li>
          ))}
        </IssueAddresses>
      </CollapsibleContent>
    </Collapsible>
  );
}

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
      toast({ title: confirmState.message ?? copy.addDialog.addedFallback });
    } else if (confirmState.status === "error") {
      onOpenChange(false);
      toast({ title: confirmState.message ?? copy.addDialog.notAddedFallback });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState]);

  const preview = previewState.data;
  const addCount = preview ? preview.toCreate.length + preview.toUpgrade.length : 0;

  function handleConfirm() {
    const fd = new FormData();
    fd.set("emails", emailsText);
    confirmAction(fd);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{tab === "paying" ? copy.addDialog.titlePaying : copy.addDialog.titleGeneral}</DialogTitle>

        {step === "input" || !preview ? (
          <Form action={previewAction}>
            <Field
              label={copy.addDialog.emailsLabel}
              hint={copy.addDialog.emailsHint}
              error={fieldError(previewState, "emails")}
              required
            >
              {(p) => (
                <Textarea
                  {...p}
                  name="emails"
                  value={emailsText}
                  onChange={(event) => setEmailsText(event.target.value)}
                  placeholder={copy.addDialog.emailsPlaceholder}
                  rows={6}
                />
              )}
            </Field>
            <DialogActions>
              <DialogClose asChild>
                <Button type="button" $variant="secondary">
                  {copy.addDialog.cancel}
                </Button>
              </DialogClose>
              <SubmitButton>{copy.addDialog.continue}</SubmitButton>
            </DialogActions>
          </Form>
        ) : (
          <Step>
            {previewState.status === "error" && <ErrorNote>{previewState.message}</ErrorNote>}

            {addCount > 0 && <Summary>{copy.addDialog.summary(addCount)}</Summary>}

            <IssueList>
              {preview.toSkip.length > 0 && (
                <IssueLine label={copy.addDialog.skipped(preview.toSkip.length)} addresses={preview.toSkip.map((s) => s.email)} />
              )}
              {preview.unsubscribed.length > 0 && (
                <IssueLine label={copy.addDialog.unsubscribedIssue(preview.unsubscribed.length)} addresses={preview.unsubscribed} />
              )}
              {preview.invalid.length > 0 && (
                <IssueLine label={copy.addDialog.invalid(preview.invalid.length)} addresses={preview.invalid} />
              )}
              {preview.duplicatesRemoved > 0 && <DuplicatesNote>{copy.addDialog.duplicates(preview.duplicatesRemoved)}</DuplicatesNote>}
            </IssueList>

            <DialogActions>
              <Button type="button" $variant="secondary" onClick={() => setStep("input")} disabled={confirmPending}>
                {copy.addDialog.back}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={confirmPending || addCount === 0}
                aria-busy={confirmPending || undefined}
              >
                {confirmPending ? copy.addDialog.adding : copy.addDialog.addCount(addCount)}
              </Button>
            </DialogActions>
          </Step>
        )}
      </DialogContent>
    </Dialog>
  );
}
