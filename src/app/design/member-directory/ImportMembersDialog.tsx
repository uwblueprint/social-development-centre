"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Check, CircleAlert, Download, FileUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TODAY, addMonths, plural, type MembershipKind } from "./data";
import { useStateLab } from "../_state-lab/useStateLab";
import { DIALOG_NOT_APPLICABLE, Lock, NO_CONFLICT, NO_ITEMS, SubmitActions, SubmitNote, useSubmit } from "./DialogStates";
import {
  MAX_IMPORT_ROWS,
  TEMPLATE_CSV,
  checkRows,
  detectFields,
  downloadCsv,
  parseCsv,
  toCsv,
  type CheckedRow,
  type ImportField,
  type RowIssue,
} from "./csv";

/** One person to create. The caller adds the id and the "Joined" activity, as it does for Add member. */
export interface NewMember {
  firstName: string;
  lastName: string;
  email: string;
  tags: string[];
  status: "member";
  kind: MembershipKind;
  joinedAt: string;
  endsAt: string;
  howJoined: string;
}

/** People already in the directory whose tags the import adds to (only when the admin ticks the box). */
export interface TagUpdate {
  email: string;
  tags: string[];
}

export interface ImportMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Emails already in the directory. Compared case-insensitively. */
  existingEmails: Set<string>;
  /** Tag names that exist, so "volunteer" in the file takes the spelling "Volunteer". */
  knownTags: string[];
  /** Called once with everyone to add. The caller shows the toast with Undo. */
  onImport: (people: NewMember[], tagUpdates: TagUpdate[]) => void;
}

/* ---------- layout ---------- */

/* Wide dialog: the kit Dialog tops out at 480px, so this widens it for the preview. Still 90vw on a phone. */
const WideContent = styled(DialogContent)`
  && {
    max-width: 640px;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

const Form = styled.form`
  display: contents;
`;

const DropZone = styled.div<{ $over: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  border: 1px dashed ${({ $over }) => ($over ? "var(--color-focus)" : "var(--color-border-strong)")};
  border-radius: var(--radius-md);
  background: ${({ $over }) => ($over ? "var(--color-bg-hover)" : "var(--color-surface)")};
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/* The real file input lives in the kit Input, hidden: the Button next to it opens it (see ImportBody). */
const HiddenInput = styled(Input)`
  display: none;
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Mapping = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3) var(--space-4);

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Summary = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  font-weight: var(--weight-medium);
`;

const Preview = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 40vh;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
`;

const PreviewRow = styled.li`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const Result = styled.span<{ $tone: "ok" | "skip" | "error" }>`
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);

  & svg {
    flex: none;
    margin-top: 2px;
    color: ${({ $tone }) => ($tone === "ok" ? "var(--color-success)" : $tone === "error" ? "var(--color-danger)" : "var(--color-text-muted)")};
  }
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const Problem = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;

  & svg {
    flex: none;
    margin-top: 2px;
    color: var(--color-danger);
  }
`;

const Spread = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

/* ---------- copy ---------- */

const FIELD_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "tags", label: "Tags" },
  { value: "skip", label: "Don't import" },
];

const ISSUE_TEXT: Record<RowIssue, string> = {
  missing: "No email",
  invalid: "Not a valid email",
  duplicate: "Repeats an earlier row in this file",
  existing: "Already in the directory",
};

const STEPS = ["Choose a file", "Match columns", "Review"];

const isError = (r: CheckedRow) => r.issue === "missing" || r.issue === "invalid" || r.issue === "duplicate";

/* ---------- component ---------- */

export function ImportMembersDialog({ open, onOpenChange, ...rest }: ImportMembersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WideContent>
        {/* Mounted only while open, so closing the dialog resets every step. */}
        <ImportBody onOpenChange={onOpenChange} {...rest} />
      </WideContent>
    </Dialog>
  );
}

function ImportBody({
  onOpenChange,
  existingEmails,
  knownTags,
  onImport,
}: Omit<ImportMembersDialogProps, "open">) {
  const [step, setStep] = React.useState(0);
  const [fileName, setFileName] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [data, setData] = React.useState<string[][]>([]);
  const [fields, setFields] = React.useState<ImportField[]>([]);
  const [fileError, setFileError] = React.useState<string>();
  const [mapError, setMapError] = React.useState<string>();
  const [over, setOver] = React.useState(false);
  const [addTags, setAddTags] = React.useState(false);
  const picker = React.useRef<HTMLInputElement>(null);

  const lab = useStateLab({ notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS, ...NO_CONFLICT] });
  const sub = useSubmit(lab);

  const tagsMapped = fields.includes("tags");
  const rows = React.useMemo(() => checkRows(data, fields, existingEmails, knownTags), [data, fields, existingEmails, knownTags]);
  const ready = rows.filter((r) => !r.issue);
  const existing = rows.filter((r) => r.issue === "existing");
  const errors = rows.filter(isError);
  const tagUpdates = addTags && tagsMapped ? existing.filter((r) => r.tags.length) : [];
  const newTags = [...new Set(ready.flatMap((r) => r.tags).concat(tagUpdates.flatMap((r) => r.tags)))].filter(
    (t) => !knownTags.some((k) => k.toLowerCase() === t.toLowerCase()),
  );

  async function readFile(file: File | undefined) {
    if (!file) return;
    setFileError(undefined);
    let parsed: string[][];
    try {
      parsed = parseCsv(await file.text());
    } catch {
      parsed = [];
    }
    if (parsed.length < 2) {
      setFileError("We couldn't find any people in that file. Check it's a CSV with a header row and at least one row of data, then choose it again.");
      return;
    }
    if (parsed.length - 1 > MAX_IMPORT_ROWS) {
      setFileError(`That file has ${(parsed.length - 1).toLocaleString("en-CA")} rows. Import up to ${MAX_IMPORT_ROWS.toLocaleString("en-CA")} at a time: split the file and import it in parts.`);
      return;
    }
    const [head, ...body] = parsed;
    setFileName(file.name);
    setHeaders(head.map((h) => h.trim()));
    setData(body);
    setFields(detectFields(head));
    setMapError(undefined);
    setAddTags(false);
    setStep(1);
  }

  function setField(index: number, value: ImportField) {
    setMapError(undefined);
    // A field comes from one column only: picking it here frees it from the column that had it.
    setFields((cur) => cur.map((f, i) => (i === index ? value : value !== "skip" && f === value ? "skip" : f)));
  }

  function toReview() {
    if (!fields.includes("email")) {
      setMapError("Choose which column has email addresses. Every person needs one.");
      return;
    }
    setStep(2);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sub.busy || !ready.length) return;
    sub.run(() => {
      const people: NewMember[] = ready.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        tags: r.tags,
        status: "member",
        // TODO(PM): decide the membership type for imported people. Complimentary for now; the file could also carry it.
        kind: "complimentary",
        joinedAt: TODAY,
        endsAt: addMonths(TODAY, 12),
        howJoined: "Added by an admin",
      }));
      onImport(
        people,
        tagUpdates.map((r) => ({ email: r.email, tags: r.tags })),
      );
      onOpenChange(false);
    });
  }

  function downloadErrors() {
    const out = [[...headers, "Issue"], ...errors.map((r) => [...r.raw, ISSUE_TEXT[r.issue as RowIssue]])];
    downloadCsv(`${fileName.replace(/\.csv$/i, "") || "import"}-errors.csv`, toCsv(out));
  }

  const back = (
    <Button type="button" $variant="ghost" onClick={() => setStep(step - 1)}>
      Back
    </Button>
  );

  return (
    <>
      <DialogTitle>Import members from CSV</DialogTitle>
      <DialogDescription>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </DialogDescription>

      {step === 0 && (
        <Body>
          <DropZone
            $over={over}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              void readFile(e.dataTransfer.files[0]);
            }}
          >
            <Icon icon={FileUp} size={24} />
            <span>Drop a CSV file here</span>
            {/* The kit has no file picker, so this is the kit Input (type="file"), hidden and opened by the visible Button. */}
            <HiddenInput
              ref={picker}
              type="file"
              accept=".csv,text/csv"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                void readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button type="button" $variant="outline" onClick={() => picker.current?.click()}>
              Choose CSV file
            </Button>
          </DropZone>
          {fileError && (
            <Problem role="alert">
              <Icon icon={CircleAlert} size={16} />
              <span>{fileError}</span>
            </Problem>
          )}
          <Hint>Needs a column with email. First name, last name and tags are optional.</Hint>
          <Spread>
            <Button type="button" $variant="ghost" $size="sm" onClick={() => downloadCsv("members-template.csv", TEMPLATE_CSV)}>
              <Icon icon={Download} size={16} />
              Download a template
            </Button>
          </Spread>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogActions>
        </Body>
      )}

      {step === 1 && (
        <Body>
          <Hint>
            We found {plural(data.length, "row")} in {fileName}. Check what each column holds.
          </Hint>
          <Mapping>
            {headers.map((h, i) => (
              <Field key={i} label={h || `Column ${i + 1}`} hint={data[0]?.[i] ? `For example: ${data[0][i]}` : undefined}>
                {(props) => (
                  <Select {...props} options={FIELD_OPTIONS} value={fields[i]} onValueChange={(v) => setField(i, v as ImportField)} />
                )}
              </Field>
            ))}
          </Mapping>
          <Hint>Separate several tags in one cell with ; or |.</Hint>
          {mapError && (
            <Problem role="alert">
              <Icon icon={CircleAlert} size={16} />
              <span>{mapError}</span>
            </Problem>
          )}
          <DialogActions>
            {back}
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={toReview}>
              Continue
            </Button>
          </DialogActions>
        </Body>
      )}

      {step === 2 && (
        <Form onSubmit={submit}>
          <Body>
            <Lock disabled={sub.busy}>
              <Summary aria-live="polite">
                {plural(ready.length, "person", "people")} ready to add
                {existing.length > 0 && ` · ${existing.length} already in the directory`}
                {errors.length > 0 && ` · ${errors.length} with ${errors.length === 1 ? "an error" : "errors"}`}
              </Summary>
              {newTags.length > 0 && <Hint>New tags will be created: {newTags.join(", ")}.</Hint>}
              <Preview aria-label="Preview of the file">
                {rows.slice(0, 50).map((r) => {
                  const tone = !r.issue ? "ok" : isError(r) ? "error" : "skip";
                  const text = r.issue
                    ? ISSUE_TEXT[r.issue] + (r.issue === "existing" && tagUpdates.includes(r) ? ". Their tags will be added." : ". Skipped.")
                    : "Ready to add";
                  return (
                    <PreviewRow key={r.line}>
                      <span>
                        {[r.firstName, r.lastName].filter(Boolean).join(" ") || r.email || <Muted>No name or email</Muted>}
                        {(r.firstName || r.lastName) && r.email ? <Muted> · {r.email}</Muted> : null}
                      </span>
                      {r.tags.length > 0 && <Muted>Tags: {r.tags.join(", ")}</Muted>}
                      <Result $tone={tone}>
                        <Icon icon={tone === "ok" ? Check : tone === "error" ? CircleAlert : Minus} size={14} />
                        <span>
                          Row {r.line}: {text}
                        </span>
                      </Result>
                    </PreviewRow>
                  );
                })}
              </Preview>
              {rows.length > 50 && <Hint>Showing the first 50 of {rows.length.toLocaleString("en-CA")} rows.</Hint>}
              {existing.length > 0 && <Hint>People already in the directory are skipped.</Hint>}
              {tagsMapped && existing.length > 0 && (
                <Checkbox label="Add their tags to the existing people" checked={addTags} onCheckedChange={(v) => setAddTags(v === true)} />
              )}
              {errors.length > 0 && (
                <Spread>
                  <Button type="button" $variant="outline" $size="sm" onClick={downloadErrors}>
                    <Icon icon={Download} size={16} />
                    Download rows with errors
                  </Button>
                </Spread>
              )}
            </Lock>
            <SubmitNote submit={sub} />
            {ready.length > 0 ? (
              <SubmitActions submit={`Add ${plural(ready.length, "person", "people")}`} state={sub} leading={back} />
            ) : (
              <DialogActions>
                {back}
                <DialogClose asChild>
                  <Button type="button" $variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                {/* NEEDS APPROVAL: reason copy is a proposal. */}
                <DisabledReason reason="Nobody in this file can be added yet. Go back to match the columns, or choose another file.">
                  <Button type="button" disabled>
                    Add 0 people
                  </Button>
                </DisabledReason>
              </DialogActions>
            )}
          </Body>
        </Form>
      )}
    </>
  );
}
