"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { CircleAlert, Download, FileSpreadsheet, FileUp, LoaderCircle, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog, DialogActions, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tag, TagList } from "@/components/ui/Tag";
import { TODAY, plural } from "./data";
import { useStateLab } from "../_state-lab/useStateLab";
import { DIALOG_NOT_APPLICABLE, Lock, NO_CONFLICT, NO_ITEMS, SubmitNote, useSubmit } from "./DialogStates";
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
  joinedAt: string;
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
`;

const Form = styled.form`
  display: contents;
`;

const Text = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Start = styled.div`
  display: flex;
`;

/* Step 2: a real file picker. Dashed 1px border with the field radius; while dragging it highlights and the copy changes. */
const DropZone = styled.div<{ $over: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  border: 1px dashed ${({ $over }) => ($over ? "var(--color-focus)" : "var(--color-border-strong)")};
  border-radius: var(--radius-md);
  background: ${({ $over }) => ($over ? "var(--color-bg-hover)" : "transparent")};
  text-align: center;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);

  & > svg {
    color: var(--color-text-muted);
  }
`;

const Small = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

/* The kit has no link button: a ghost Button stripped to inline underlined text. Still a real button with the kit focus ring. */
const InlineAction = styled(Button)`
  && {
    display: inline;
    height: auto;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    font-size: inherit;
    line-height: inherit;
    vertical-align: baseline;
    color: var(--color-text);
    text-decoration: underline;
    background: transparent;
  }
  &&:hover:not(:disabled) {
    background: transparent;
    text-decoration-thickness: 2px;
  }
`;

/* The real file input lives in the kit Input, hidden: the Upload button opens it. */
const HiddenInput = styled(Input)`
  display: none;
`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: var(--leading-body);

  & > svg {
    flex: none;
    color: var(--color-text-muted);
  }
`;

const FileName = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const FileSize = styled.span`
  flex: none;
  color: var(--color-text-muted);
`;

/* Square icon-only button, as wide as it is tall. */
const IconButton = styled(Button)`
  flex: none;
  aspect-ratio: 1;
  padding: 0;
`;

const Problem = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);
  overflow-wrap: anywhere;

  & svg {
    flex: none;
    margin-top: 2px;
    color: var(--color-danger);
  }
`;

const Mapping = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3) var(--space-4);

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Lead = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const NewTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Groups = styled.div``;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
`;

/* A capped, scrollable list. Focusable so keyboard users can scroll it; the ring is drawn inside. */
const Scroll = styled.div`
  align-self: stretch;
  max-height: 40vh;
  overflow-y: auto;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-inset);
  }
`;

const Rows = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Row = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-2) 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);
  overflow-wrap: anywhere;

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const Who = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1 1 14rem;
  min-width: 0;
`;

const Muted = styled.span`
  color: var(--color-text-muted);
`;

const RowNumber = styled.span`
  flex: none;
  min-width: 4rem;
  color: var(--color-text-muted);
`;

const Value = styled.span`
  flex: 1 1 10rem;
  min-width: 0;
`;

const Reason = styled.span`
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);

  & svg {
    flex: none;
    margin-top: 2px;
    color: var(--color-danger);
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinning = styled.span`
  display: inline-flex;

  & svg {
    animation: ${spin} 0.8s linear infinite;
  }
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
  invalid: "Check the email address",
  duplicate: "Repeats an earlier row in this file",
  existing: "Already added",
};

const STEPS = ["Download a template", "Upload your spreadsheet", "Match columns", "Review"];

/** Rows shown per section; the rest are counted ("and 230 more"). */
const SHOW_ROWS = 50;

const isError = (r: CheckedRow) => r.issue === "missing" || r.issue === "invalid" || r.issue === "duplicate";
const fullName = (r: CheckedRow) => [r.firstName, r.lastName].filter(Boolean).join(" ");
const count = (n: number) => n.toLocaleString("en-CA");

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- component ---------- */

export function ImportMembersDialog({ open, onOpenChange, ...rest }: ImportMembersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WideContent
        onOpenAutoFocus={(event) => {
          // Open on the dialog itself, not a button, so nothing looks pre-chosen. Tab reaches the first control.
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
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
  const [file, setFile] = React.useState<{ name: string; size: number }>();
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [data, setData] = React.useState<string[][]>([]);
  const [fields, setFields] = React.useState<ImportField[]>([]);
  const [fileError, setFileError] = React.useState<string>();
  const [mapError, setMapError] = React.useState<string>();
  const [over, setOver] = React.useState(false);
  const [addTags, setAddTags] = React.useState(false);
  const picker = React.useRef<HTMLInputElement>(null);
  const uploadButton = React.useRef<HTMLButtonElement>(null);
  const removeButton = React.useRef<HTMLButtonElement>(null);
  // Where focus goes once the drop zone and the file row swap, so it never falls back to the page.
  const focusNext = React.useRef<"upload" | "remove" | undefined>(undefined);

  const lab = useStateLab({ notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS, ...NO_CONFLICT] });
  const sub = useSubmit(lab);

  React.useEffect(() => {
    if (focusNext.current === "upload") uploadButton.current?.focus();
    if (focusNext.current === "remove") removeButton.current?.focus();
    focusNext.current = undefined;
  }, [file]);

  const tagsMapped = fields.includes("tags");
  const rows = React.useMemo(() => checkRows(data, fields, existingEmails, knownTags), [data, fields, existingEmails, knownTags]);
  const ready = rows.filter((r) => !r.issue);
  const existing = rows.filter((r) => r.issue === "existing");
  const errors = rows.filter(isError);
  const tagUpdates = addTags && tagsMapped ? existing.filter((r) => r.tags.length) : [];
  const newTags = [...new Set(ready.flatMap((r) => r.tags).concat(tagUpdates.flatMap((r) => r.tags)))].filter(
    (t) => !knownTags.some((k) => k.toLowerCase() === t.toLowerCase()),
  );

  async function readFile(picked: File | undefined) {
    if (!picked) return;
    setFileError(undefined);
    let parsed: string[][];
    try {
      parsed = parseCsv(await picked.text());
    } catch {
      parsed = [];
    }
    if (parsed.length < 2) {
      setFileError("We couldn't find any people in that file. Check it has a header row and at least one person, then choose it again.");
      return;
    }
    if (parsed.length - 1 > MAX_IMPORT_ROWS) {
      setFileError(`That file has ${count(parsed.length - 1)} rows. You can import up to ${count(MAX_IMPORT_ROWS)} at a time, so split it into smaller files.`);
      return;
    }
    const [head, ...body] = parsed;
    focusNext.current = "remove";
    setFile({ name: picked.name, size: picked.size });
    setHeaders(head.map((h) => h.trim()));
    setData(body);
    setFields(detectFields(head));
    setMapError(undefined);
    setAddTags(false);
  }

  function removeFile() {
    focusNext.current = "upload";
    setFile(undefined);
    setHeaders([]);
    setData([]);
    setFields([]);
  }

  function setField(index: number, value: ImportField) {
    setMapError(undefined);
    // A field comes from one column only: picking it here frees it from the column that had it.
    setFields((cur) => cur.map((f, i) => (i === index ? value : value !== "skip" && f === value ? "skip" : f)));
  }

  /** Continue on steps 1 to 3, Add on step 4, so Enter in a field does what the primary button does. */
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1 && !file) {
      setFileError("Choose a spreadsheet to upload");
      return;
    }
    if (step === 2 && !fields.includes("email")) {
      setMapError("Choose which column has email addresses. Every person needs one.");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (sub.busy || !ready.length) return;
    sub.run(() => {
      const people: NewMember[] = ready.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        tags: r.tags,
        joinedAt: TODAY,
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
    downloadCsv(`${file?.name.replace(/\.csv$/i, "") || "import"}-errors.csv`, toCsv(out));
  }

  const more = (n: number) =>
    n > SHOW_ROWS ? (
      <Row>
        <Muted>and {count(n - SHOW_ROWS)} more</Muted>
      </Row>
    ) : null;

  const who = (r: CheckedRow) => (
    <Who>
      {fullName(r) && <span>{fullName(r)}</span>}
      <Muted>{r.email}</Muted>
    </Who>
  );

  return (
    <>
      <DialogTitle>Import people from a spreadsheet</DialogTitle>
      <DialogDescription>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </DialogDescription>

      <Form onSubmit={submit} noValidate>
        <Body>
          {step === 0 && (
            <>
              <Text>Start from our template, or skip this step if your spreadsheet is ready.</Text>
              <Start>
                <Button type="button" $variant="secondary" onClick={() => downloadCsv("people-template.csv", TEMPLATE_CSV)}>
                  <Icon icon={Download} size={16} />
                  Download a template
                </Button>
              </Start>
            </>
          )}

          {step === 1 &&
            (file ? (
              <FileRow>
                <Icon icon={FileSpreadsheet} size={20} />
                <FileName>{file.name}</FileName>
                <FileSize>{fileSize(file.size)}</FileSize>
                <IconButton ref={removeButton} type="button" $variant="ghost" aria-label={`Remove ${file.name}`} onClick={removeFile}>
                  <Icon icon={X} size={16} />
                </IconButton>
              </FileRow>
            ) : (
              <>
                <DropZone
                  $over={over}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(true);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setOver(false);
                    void readFile(e.dataTransfer.files[0]);
                  }}
                >
                  <Icon icon={FileUp} size={24} />
                  {over ? (
                    <span>Drop the spreadsheet to upload it</span>
                  ) : (
                    <span>
                      <InlineAction ref={uploadButton} type="button" $variant="ghost" onClick={() => picker.current?.click()}>
                        Upload
                      </InlineAction>{" "}
                      or drag and drop a spreadsheet here
                    </span>
                  )}
                  <Small>.csv, up to {count(MAX_IMPORT_ROWS)} people</Small>
                  {/* The kit has no file picker, so this is the kit Input (type="file"), hidden and opened by Upload. */}
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
                </DropZone>
                {fileError && (
                  <Problem role="alert">
                    <Icon icon={CircleAlert} size={16} />
                    <span>{fileError}</span>
                  </Problem>
                )}
              </>
            ))}

          {step === 2 && (
            <>
              <Hint>
                We found {plural(data.length, "row")} in {file?.name}. Check what each column holds.
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
              <Hint>Separate several tags in one cell with ; or |</Hint>
              {mapError && (
                <Problem role="alert">
                  <Icon icon={CircleAlert} size={16} />
                  <span>{mapError}</span>
                </Problem>
              )}
            </>
          )}

          {step === 3 && (
            <Lock disabled={sub.busy}>
              <Lead>
                {ready.length ? `${plural(ready.length, "person", "people")} will be added` : "Nobody in this file can be added yet"}
              </Lead>
              {newTags.length > 0 && (
                <NewTags>
                  <span>New tags:</span>
                  {newTags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </NewTags>
              )}
              <Groups>
              <Accordion type="multiple" defaultValue={ready.length ? ["ready"] : errors.length ? ["errors"] : []}>
                {ready.length > 0 && (
                  <AccordionItem value="ready">
                    <AccordionTrigger>Ready to add ({count(ready.length)})</AccordionTrigger>
                    <AccordionContent>
                      <Scroll role="region" aria-label="People ready to add" tabIndex={0}>
                        <Rows>
                          {ready.slice(0, SHOW_ROWS).map((r) => (
                            <Row key={r.line}>
                              {who(r)}
                              {r.tags.length > 0 && (
                                <TagList>
                                  {r.tags.map((t) => (
                                    <Tag key={t}>{t}</Tag>
                                  ))}
                                </TagList>
                              )}
                            </Row>
                          ))}
                          {more(ready.length)}
                        </Rows>
                      </Scroll>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {existing.length > 0 && (
                  <AccordionItem value="existing">
                    <AccordionTrigger>Already added ({count(existing.length)})</AccordionTrigger>
                    <AccordionContent>
                      <Section>
                        <Hint>
                          {tagUpdates.length
                            ? "They aren't added again. Their tags from this file are added to them."
                            : "They're already in the list, so they're skipped."}
                        </Hint>
                        <Scroll role="region" aria-label="People already added" tabIndex={0}>
                          <Rows>
                            {existing.slice(0, SHOW_ROWS).map((r) => (
                              <Row key={r.line}>{who(r)}</Row>
                            ))}
                            {more(existing.length)}
                          </Rows>
                        </Scroll>
                        {tagsMapped && (
                          <Checkbox
                            label="Add their tags to the people already added"
                            checked={addTags}
                            onCheckedChange={(v) => setAddTags(v === true)}
                          />
                        )}
                      </Section>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {errors.length > 0 && (
                  <AccordionItem value="errors">
                    <AccordionTrigger>Can&apos;t be added ({count(errors.length)})</AccordionTrigger>
                    <AccordionContent>
                      <Section>
                        <Scroll role="region" aria-label="Rows that can't be added" tabIndex={0}>
                          <Rows>
                            {errors.slice(0, SHOW_ROWS).map((r) => (
                              <Row key={r.line}>
                                <RowNumber>Row {r.line}</RowNumber>
                                <Value>{r.email || fullName(r) || <Muted>Blank</Muted>}</Value>
                                <Reason>
                                  <Icon icon={CircleAlert} size={16} />
                                  {ISSUE_TEXT[r.issue as RowIssue]}
                                </Reason>
                              </Row>
                            ))}
                            {more(errors.length)}
                          </Rows>
                        </Scroll>
                        <Button type="button" $variant="secondary" $size="sm" onClick={downloadErrors}>
                          <Icon icon={Download} size={16} />
                          Download these rows
                        </Button>
                      </Section>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
              </Groups>
            </Lock>
          )}

          {step === 3 && <SubmitNote submit={sub} />}
        </Body>

        <DialogActions>
          {step > 0 && (
            <Button type="button" $variant="secondary" data-back="" disabled={sub.busy} onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button type="submit">Continue</Button>
          ) : ready.length > 0 ? (
            <Button type="submit" aria-disabled={sub.busy || undefined} aria-busy={sub.busy || undefined}>
              {sub.busy ? (
                <Spinning>
                  <Icon icon={LoaderCircle} size={16} />
                </Spinning>
              ) : (
                <Icon icon={FileUp} size={16} />
              )}
              Add {plural(ready.length, "person", "people")}
            </Button>
          ) : (
            /* NEEDS APPROVAL: reason copy is a proposal. */
            <DisabledReason reason="Nobody in this file can be added yet. Go back to match the columns, or choose another file.">
              <Button type="button" disabled>
                Add 0 people
              </Button>
            </DisabledReason>
          )}
        </DialogActions>
      </Form>
    </>
  );
}
