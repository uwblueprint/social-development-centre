"use client";

import * as React from "react";
import { startTransition, useActionState } from "react";
import { styled } from "next-yak";
import {
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  MailQuestion,
  MailX,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { ErrorIcon, Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState, type ActionState } from "@/lib/forms";
import { confirmMembers, previewMembers, type AddMode } from "../_data/actions";
import type { ImportEntry, ImportPreview } from "../_data/types";
import { csvToLines, summarizePreview } from "../_lib/import";
import { communityCopy as copy } from "../_copy";

const idlePreviewState: ActionState<ImportPreview> = { status: "idle" };
const g = copy.addDialog.groups;

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

const Step = styled.div`
  display: grid;
  gap: var(--space-4);
`;

const UploadRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
`;

const Note = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Summary = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const ErrorNote = styled.p`
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

const GroupList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
`;

const GroupItem = styled.li`
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
`;

const GroupTrigger = styled(Button)`
  justify-content: flex-start;
  width: 100%;
  height: auto;
  min-height: var(--space-6);
  padding: var(--space-1);
  text-align: left;
  font-weight: var(--weight-medium);
  white-space: normal;
`;

const Chevron = styled.span<{ $open?: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--duration) var(--ease);
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
`;

type Tone = "success" | "muted" | "warning" | "danger";

const GroupIcon = styled.span<{ $tone: Tone }>`
  display: inline-flex;
  flex-shrink: 0;
  color: ${({ $tone }) =>
    $tone === "success"
      ? "var(--color-success)"
      : $tone === "warning"
        ? "var(--color-warning)"
        : $tone === "danger"
          ? "var(--color-danger)"
          : "var(--color-text-muted)"};
`;

const Detail = styled.p`
  margin: 0;
  padding-left: calc(var(--space-6) + var(--space-3));
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Addresses = styled.ul`
  margin: 0;
  padding: var(--space-1) 0 0 calc(var(--space-6) + var(--space-3));
  list-style: none;
  display: grid;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

const ResubscribeRow = styled.div`
  padding-left: calc(var(--space-6) + var(--space-3));
  padding-top: var(--space-1);
`;

const person = (e: ImportEntry | string) => (typeof e === "string" ? e : e.name ? `${e.name} · ${e.email}` : e.email);

/** One preview group: icon, "N what happens" label that reveals the addresses, and a short detail line. */
function Group({
  icon,
  tone,
  label,
  detail,
  people,
  children,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  detail?: string;
  people: (ImportEntry | string)[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  if (people.length === 0) return null;
  return (
    <GroupItem>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <GroupTrigger type="button" $variant="ghost" $size="sm" aria-label={copy.addDialog.toggleAddresses(label, open)}>
            <Chevron aria-hidden="true" $open={open}>
              <Icon icon={ChevronRight} size={14} />
            </Chevron>
            <GroupIcon aria-hidden="true" $tone={tone}>
              <Icon icon={icon} size={16} />
            </GroupIcon>
            {label}
          </GroupTrigger>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Addresses>
            {people.map((p) => (
              <li key={typeof p === "string" ? p : p.email}>{person(p)}</li>
            ))}
          </Addresses>
        </CollapsibleContent>
      </Collapsible>
      {detail && <Detail>{detail}</Detail>}
      {children}
    </GroupItem>
  );
}

/**
 * Add member (mode "single": one person) and Import members (mode "bulk": pasted addresses or a CSV).
 * Two steps: enter, then a preview that groups every address by what will happen. Nothing is
 * saved or sent until the admin confirms, and nothing changes that the preview doesn't show.
 */
export function AddMembersDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AddMode;
}) {
  const { toast } = useToast();
  const single = mode === "single";
  const [step, setStep] = React.useState<"input" | "preview">("input");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [emailsText, setEmailsText] = React.useState("");
  const [paying, setPaying] = React.useState(false);
  const [resubscribe, setResubscribe] = React.useState(false);
  const [csvNote, setCsvNote] = React.useState<string | null>(null);
  const [csvError, setCsvError] = React.useState<string | null>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const emailsRef = React.useRef<HTMLTextAreaElement>(null);

  const [previewState, previewAction] = useActionState(previewMembers.bind(null, mode), idlePreviewState);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmMembers.bind(null, mode), idleState);

  // Moves to the preview once a check returns one; derived at render time instead of in an effect.
  const [handledPreview, setHandledPreview] = React.useState(previewState);
  if (previewState !== handledPreview) {
    setHandledPreview(previewState);
    if (previewState.data) {
      setStep("preview");
      setResubscribe(false);
    }
  }

  // Inline errors only: move focus to the first invalid field.
  React.useEffect(() => {
    if (previewState.fieldErrors?.email) emailRef.current?.focus();
    else if (previewState.fieldErrors?.emails) emailsRef.current?.focus();
  }, [previewState]);

  React.useEffect(() => {
    if (confirmState.status === "success") {
      onOpenChange(false);
      toast({ title: confirmState.message ?? copy.addDialog.addedFallback });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState]);

  function formData() {
    const fd = new FormData();
    if (single) {
      fd.set("name", name);
      fd.set("email", email);
    } else fd.set("emails", emailsText);
    if (paying) fd.set("paying", "on");
    return fd;
  }

  function handleConfirm() {
    if (confirmPending) return;
    const fd = formData();
    if (resubscribe) fd.set("resubscribe", "on");
    startTransition(() => confirmAction(fd));
  }

  /** Back to the input step, with focus on the field to edit (the preview's buttons disappear). */
  function backToInput() {
    if (confirmPending) return;
    setStep("input");
    requestAnimationFrame(() => (single ? emailRef : emailsRef).current?.focus());
  }

  function pickCsv() {
    // Created on demand, never rendered: the visible control is the kit Button.
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = ".csv,text/csv,text/plain";
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      setCsvNote(null);
      setCsvError(null);
      try {
        const lines = csvToLines(await file.text());
        if (!lines.some((l) => l.includes("@"))) {
          setCsvError(copy.addDialog.csvEmpty(file.name));
        } else {
          setEmailsText((prev) => (prev.trim() ? `${prev.trimEnd()}\n${lines.join("\n")}` : lines.join("\n")));
          setCsvNote(copy.addDialog.csvLoaded(lines.length, file.name));
        }
      } catch {
        setCsvError(copy.addDialog.csvUnreadable(file.name));
      }
      emailsRef.current?.focus();
    };
    picker.click();
  }

  const preview = previewState.data;
  const summary = preview ? summarizePreview(preview, resubscribe) : null;
  const payingLabel = single ? copy.addDialog.payingSingle : copy.addDialog.payingBulk;
  const selfConverting = preview?.unsubscribedSelf.filter((e) => e.willConvert).length ?? 0;
  const adminConverting = preview?.unsubscribedAdmin.filter((e) => e.willConvert).length ?? 0;
  // Edge cases where the generic "Nothing will change" doesn't say why.
  const existing = preview ? preview.alreadyPaying.length + preview.alreadyMembers.length : 0;
  const others = preview
    ? preview.added.length + preview.converted.length + preview.unsubscribedSelf.length + preview.unsubscribedAdmin.length
    : 0;
  const noValid = preview !== undefined && existing + others === 0;
  const allExisting = preview !== undefined && existing > 0 && others === 0 && preview.invalid.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{single ? copy.addDialog.titleSingle : copy.addDialog.titleBulk}</DialogTitle>

        {step === "input" || !preview || !summary ? (
          <Form action={() => previewAction(formData())} noValidate>
            {single ? (
              <>
                <Field label={copy.addDialog.nameLabel}>
                  {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
                </Field>
                <Field label={copy.addDialog.emailLabel} error={fieldError(previewState, "email")} required>
                  {(p) => (
                    <Input
                      {...p}
                      ref={emailRef}
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                    />
                  )}
                </Field>
              </>
            ) : (
              <>
                <Field
                  label={copy.addDialog.emailsLabel}
                  hint={copy.addDialog.emailsHint}
                  error={fieldError(previewState, "emails") ?? csvError ?? undefined}
                  required
                >
                  {(p) => (
                    <Textarea
                      {...p}
                      ref={emailsRef}
                      name="emails"
                      value={emailsText}
                      onChange={(e) => setEmailsText(e.target.value)}
                      placeholder={copy.addDialog.emailsPlaceholder}
                      rows={7}
                    />
                  )}
                </Field>
                <UploadRow>
                  <Button type="button" $variant="secondary" $size="sm" onClick={pickCsv}>
                    <Icon icon={Upload} size={16} />
                    {copy.addDialog.uploadCsv}
                  </Button>
                  <Note role="status">{csvNote}</Note>
                </UploadRow>
              </>
            )}
            <Checkbox name="paying" checked={paying} onCheckedChange={(v) => setPaying(v === true)} label={payingLabel} />
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
            <GroupList>
              <Group
                icon={UserPlus}
                tone="success"
                label={g.added(preview.added.length, preview.paying)}
                detail={g.addedDetail(preview.paying)}
                people={preview.added}
              />
              <Group
                icon={BadgeCheck}
                tone="success"
                label={g.converted(preview.converted.length)}
                detail={g.convertedDetail}
                people={preview.converted}
              />
              <Group
                icon={CircleCheck}
                tone="muted"
                label={g.alreadyPaying(preview.alreadyPaying.length)}
                detail={preview.paying ? undefined : g.alreadyPayingDetail}
                people={preview.alreadyPaying}
              />
              <Group
                icon={CircleCheck}
                tone="muted"
                label={g.alreadyMembers(preview.alreadyMembers.length)}
                detail={g.alreadyMembersDetail(payingLabel)}
                people={preview.alreadyMembers}
              />
              <Group icon={Copy} tone="muted" label={g.duplicates(preview.duplicates.length)} people={preview.duplicates} />
              <Group
                icon={CircleAlert}
                tone="danger"
                label={g.invalid(preview.invalid.length)}
                detail={g.invalidDetail}
                people={preview.invalid}
              />
              <Group
                icon={MailX}
                tone="muted"
                label={g.unsubscribedSelf(preview.unsubscribedSelf.length)}
                detail={g.unsubscribedSelfDetail(selfConverting)}
                people={preview.unsubscribedSelf}
              />
              <Group
                icon={MailQuestion}
                tone="warning"
                label={g.unsubscribedAdmin(preview.unsubscribedAdmin.length)}
                detail={g.unsubscribedAdminDetail(adminConverting)}
                people={preview.unsubscribedAdmin}
              >
                <ResubscribeRow>
                  <Checkbox
                    name="resubscribe"
                    checked={resubscribe}
                    onCheckedChange={(v) => setResubscribe(v === true)}
                    label={g.resubscribe(preview.unsubscribedAdmin.length)}
                  />
                </ResubscribeRow>
              </Group>
            </GroupList>

            <Summary role="status">
              {summary.changes > 0
                ? copy.addDialog.emailsLine(summary.emails)
                : noValid
                  ? copy.addDialog.noValidAddresses
                  : allExisting
                    ? copy.addDialog.allAlreadyMembers(existing)
                    : copy.addDialog.nothingToChange}
            </Summary>

            {confirmState.status === "error" && confirmState.message && (
              <ErrorNote role="alert">
                <ErrorIcon />
                <span>{confirmState.message}</span>
              </ErrorNote>
            )}

            <DialogActions>
              {noValid ? (
                <>
                  <DialogClose asChild>
                    <Button type="button" $variant="secondary">
                      {copy.addDialog.cancel}
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={backToInput}>
                    {copy.addDialog.editList}
                  </Button>
                </>
              ) : (
                <Button type="button" $variant="secondary" onClick={backToInput}>
                  {copy.addDialog.back}
                </Button>
              )}
              {noValid ? null : summary.changes > 0 ? (
                <Button type="button" onClick={handleConfirm} aria-busy={confirmPending || undefined} aria-disabled={confirmPending || undefined}>
                  {confirmPending ? copy.addDialog.applying : copy.addDialog.confirm(summary.changes)}
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button type="button">{copy.addDialog.close}</Button>
                </DialogClose>
              )}
            </DialogActions>
          </Step>
        )}
      </DialogContent>
    </Dialog>
  );
}
