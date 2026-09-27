"use client";

import * as React from "react";
import { startTransition, useActionState } from "react";
import { styled } from "next-yak";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  FileUp,
  MailQuestion,
  MailX,
  Upload,
  UserPlus,
  UserX,
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

/** A check, plus (for one clear new person) the result of adding them straight away. */
type PreviewState = ActionState<ImportPreview> & { applied?: ActionState };
const idlePreviewState: PreviewState = { status: "idle" };

/** One new person and nothing else to decide: the single form adds them without a preview. */
function isPlainAdd(p: ImportPreview) {
  return (
    p.added.length === 1 &&
    p.converted.length + p.alreadyPaying.length + p.alreadyMembers.length + p.duplicates.length + p.invalid.length === 0 &&
    p.unsubscribedSelf.length + p.unsubscribedAdmin.length + p.deleted.length === 0
  );
}

const modeOf = (fd: FormData): AddMode => (fd.get("mode") === "single" ? "single" : "bulk");
const g = copy.addDialog.groups;

/* The title has no description under it, so the form keeps its own distance from it. */
const Form = styled.form`
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-3);
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

/* Import from a file / Back on the left; Cancel and the main button on the right. */
const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-4);
  margin-top: var(--space-1);
`;

const FooterEnd = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-left: auto;
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

/* Dividers only between groups: no line under the dialog title. */
const GroupList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const GroupItem = styled.li`
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) 0;

  & + & {
    border-top: 1px solid var(--color-border);
  }
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

type View = "single" | "file";

/**
 * Add members: one dialog for one person or many. The single view adds one person (Name, Email,
 * "Make them a paying member"); a clear new person is added at once, and anything that needs a look
 * (already a member, unsubscribed, deleted) goes to the preview. "Import from a file" switches to the
 * file view: upload a CSV with name and email columns (a template is offered), check the rows, then
 * the same preview, which groups every row by what will happen. Nothing is saved or sent until then.
 */
export function AddMembersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [view, setView] = React.useState<View>("single");
  const [step, setStep] = React.useState<"input" | "preview">("input");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [fileText, setFileText] = React.useState("");
  const [paying, setPaying] = React.useState(false);
  const [resubscribe, setResubscribe] = React.useState(false);
  const [csvNote, setCsvNote] = React.useState<string | null>(null);
  const [csvError, setCsvError] = React.useState<string | null>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const fileTextRef = React.useRef<HTMLTextAreaElement>(null);
  const uploadRef = React.useRef<HTMLButtonElement>(null);
  const importLinkRef = React.useRef<HTMLButtonElement>(null);

  const [previewState, previewAction] = useActionState(async (_prev: PreviewState, fd: FormData): Promise<PreviewState> => {
    const mode = modeOf(fd);
    const result = await previewMembers(mode, idlePreviewState, fd);
    if (mode === "single" && result.data && isPlainAdd(result.data)) {
      return { ...result, applied: await confirmMembers(mode, idleState, fd) };
    }
    return result;
  }, idlePreviewState);
  const [confirmState, confirmAction, confirmPending] = useActionState(
    (prev: ActionState, fd: FormData) => confirmMembers(modeOf(fd), prev, fd),
    idleState,
  );

  // Moves to the preview once a check returns one; derived at render time instead of in an effect.
  const [handledPreview, setHandledPreview] = React.useState(previewState);
  if (previewState !== handledPreview) {
    setHandledPreview(previewState);
    if (previewState.data && !previewState.applied) {
      setStep("preview");
      setResubscribe(false);
    }
  }

  // Inline errors only: move focus to the invalid field.
  React.useEffect(() => {
    if (previewState.fieldErrors?.email) emailRef.current?.focus();
    if (previewState.fieldErrors?.emails) fileTextRef.current?.focus();
  }, [previewState]);

  // Done: close and say what happened, whether it was added straight away or confirmed from the preview.
  const applied = previewState.applied?.status === "success" ? previewState.applied : confirmState.status === "success" ? confirmState : null;
  React.useEffect(() => {
    if (applied) {
      onOpenChange(false);
      toast({ title: applied.message ?? copy.addDialog.addedFallback });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  function formData() {
    const fd = new FormData();
    if (view === "single") {
      fd.set("mode", "single");
      fd.set("name", name);
      fd.set("email", email);
    } else {
      fd.set("mode", "bulk");
      fd.set("emails", fileText);
    }
    if (paying) fd.set("paying", "on");
    return fd;
  }

  function handleConfirm() {
    if (confirmPending) return;
    const fd = formData();
    if (resubscribe) fd.set("resubscribe", "on");
    startTransition(() => confirmAction(fd));
  }

  /** Back to the view the list came from, with focus in its field (the preview's buttons disappear). */
  function backToInput() {
    if (confirmPending) return;
    setStep("input");
    requestAnimationFrame(() => (view === "single" ? emailRef : fileTextRef).current?.focus());
  }

  function switchView(next: View) {
    setView(next);
    requestAnimationFrame(() => (next === "file" ? uploadRef : importLinkRef).current?.focus());
  }

  /** A CSV with just the header row, so the columns are right first time. */
  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(["name,email\n"], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = copy.addDialog.templateFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
          setFileText((prev) => (prev.trim() ? `${prev.trimEnd()}\n${lines.join("\n")}` : lines.join("\n")));
          setCsvNote(copy.addDialog.csvLoaded(lines.length, file.name));
        }
      } catch {
        setCsvError(copy.addDialog.csvUnreadable(file.name));
      }
      fileTextRef.current?.focus();
    };
    picker.click();
  }

  const preview = previewState.data;
  const summary = preview ? summarizePreview(preview, resubscribe) : null;
  const payingLabel = view === "single" ? copy.addDialog.paying : copy.addDialog.payingBulk;
  const selfConverting = preview?.unsubscribedSelf.filter((e) => e.willConvert).length ?? 0;
  const adminConverting = preview?.unsubscribedAdmin.filter((e) => e.willConvert).length ?? 0;
  // Edge cases where the generic "Nothing will change" doesn't say why.
  const existing = preview ? preview.alreadyPaying.length + preview.alreadyMembers.length : 0;
  const others = preview
    ? preview.added.length + preview.converted.length + preview.unsubscribedSelf.length + preview.unsubscribedAdmin.length
    : 0;
  const noValid = preview !== undefined && existing + others + preview.deleted.length === 0;
  const allExisting = preview !== undefined && existing > 0 && others === 0 && preview.invalid.length === 0;

  /** The main button names what confirming does, when it does one kind of thing. */
  function confirmLabel(p: ImportPreview, changes: number) {
    const converts = p.converted.length + selfConverting + adminConverting;
    if (changes === p.added.length && !resubscribe) return copy.addDialog.confirmAdd(changes);
    if (p.added.length === 0 && !resubscribe && changes === converts) return copy.addDialog.confirmConvert(changes);
    if (resubscribe && p.added.length + converts === 0) return copy.addDialog.confirmResubscribe(changes);
    return copy.addDialog.confirm(changes);
  }

  const payingCheckbox = (
    <Checkbox name="paying" checked={paying} onCheckedChange={(v) => setPaying(v === true)} label={payingLabel} />
  );
  const cancel = (
    <DialogClose asChild>
      <Button type="button" $variant="secondary">
        {copy.addDialog.cancel}
      </Button>
    </DialogClose>
  );
  const appliedError = previewState.applied?.status === "error" ? previewState.applied.message : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{copy.addDialog.title}</DialogTitle>

        {step === "input" || !preview || !summary ? (
          <Form action={() => previewAction(formData())} noValidate>
            {view === "single" ? (
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
                {payingCheckbox}
                {appliedError && (
                  <ErrorNote role="alert">
                    <ErrorIcon />
                    <span>{appliedError}</span>
                  </ErrorNote>
                )}
                <Footer>
                  <Button ref={importLinkRef} type="button" $variant="link" onClick={() => switchView("file")}>
                    <Icon icon={FileUp} size={16} />
                    {copy.addDialog.importFromFile}
                  </Button>
                  <FooterEnd>
                    {cancel}
                    <SubmitButton>
                      <Icon icon={UserPlus} size={16} />
                      {copy.addDialog.add}
                    </SubmitButton>
                  </FooterEnd>
                </Footer>
              </>
            ) : (
              <>
                <UploadRow>
                  <Button ref={uploadRef} type="button" $variant="secondary" $size="sm" onClick={pickCsv}>
                    <Icon icon={Upload} size={16} />
                    {copy.addDialog.uploadCsv}
                  </Button>
                  <Button type="button" $variant="link" onClick={downloadTemplate}>
                    <Icon icon={Download} size={16} />
                    {copy.addDialog.downloadTemplate}
                  </Button>
                  <Note role="status">{csvNote}</Note>
                </UploadRow>
                <Field
                  label={copy.addDialog.emailsLabel}
                  hint={copy.addDialog.fileHint}
                  error={fieldError(previewState, "emails") ?? csvError ?? undefined}
                  required
                >
                  {(p) => (
                    <Textarea
                      {...p}
                      ref={fileTextRef}
                      name="emails"
                      value={fileText}
                      onChange={(e) => setFileText(e.target.value)}
                      rows={7}
                    />
                  )}
                </Field>
                {payingCheckbox}
                <Footer>
                  <Button type="button" $variant="link" onClick={() => switchView("single")}>
                    <Icon icon={ArrowLeft} size={16} />
                    {copy.addDialog.backToAdd}
                  </Button>
                  <FooterEnd>
                    {cancel}
                    <SubmitButton>{copy.addDialog.continue}</SubmitButton>
                  </FooterEnd>
                </Footer>
              </>
            )}
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
              <Group icon={UserX} tone="muted" label={g.deleted(preview.deleted.length)} detail={g.deletedDetail} people={preview.deleted} />
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
              {summary.changes > 0 ? (
                <>
                  <Button type="button" $variant="secondary" onClick={backToInput}>
                    {copy.addDialog.back}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    aria-busy={confirmPending || undefined}
                    aria-disabled={confirmPending || undefined}
                  >
                    {confirmPending ? copy.addDialog.applying : confirmLabel(preview, summary.changes)}
                  </Button>
                </>
              ) : (
                // Nothing will change: the useful next step is fixing the list, so that's the main button.
                <>
                  <DialogClose asChild>
                    <Button type="button" $variant="secondary">
                      {copy.addDialog.close}
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={backToInput}>
                    {copy.addDialog.editList}
                  </Button>
                </>
              )}
            </DialogActions>
          </Step>
        )}
      </DialogContent>
    </Dialog>
  );
}
