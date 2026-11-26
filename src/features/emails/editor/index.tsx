"use client";

/*
 * The Email Editor. One editor for automatic emails, one-off emails and a single Outbox email.
 * It never saves: it only calls onChange. The parent owns Update / Discard / autosave.
 * Public signatures are the contract other flows import; additions must stay optional.
 */
import * as React from "react";
import { styled } from "next-yak";
import { Bold, Braces, Eye, Italic, Link2, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverActions, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { Tooltip } from "@/components/ui/Tooltip";
import { useEmails } from "../store";
import { MOMENT_LABEL, VARIABLES, variablesFor, type EmailContent, type Member, type Moment, type VarKey } from "../model";
import { copy, ONE_OFF_PROMPT, PROMPT_BY_MOMENT } from "./copy";
import { EmailFooter, EmailPreview } from "./Preview";
import { RichSurface, type SurfaceHandle } from "./RichSurface";
import { normalizeLink, plainText, tokensIn, varDef } from "./richtext";

export { EmailPreview, EmailFooter };

export interface CheckIssue {
  id: string;
  field: "subject" | "body";
  message: string; // one short line, e.g. "Add a subject."
}

export interface EmailEditorProps {
  value: EmailContent;
  onChange(next: EmailContent): void;
  /** undefined for one-off emails (member variables only). */
  moment?: Moment;
  /** Picks the writing prompt shown in an empty email. */
  context: "automatic" | "one-off" | "outbox";
  readOnly?: boolean;
  /** Issues from checkEmail to show inline with "Go to" links. */
  issues?: CheckIssue[];
  /** Preview as this member (inbox-style card). Omit for no Preview button. */
  previewMembers?: Member[];
}

/* ---------- checks ---------- */

/** Short checks: empty subject/message, variables that don't apply to the moment. */
export function checkEmail(content: EmailContent, moment?: Moment): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const valid = new Set<string>(variablesFor(moment).map((v) => v.key));
  const where = moment ? `a “${MOMENT_LABEL[moment.type]}” email` : "a one-off email";
  if (!content.subject.trim()) {
    issues.push({ id: "empty-subject", field: "subject", message: "Add a subject." });
  }
  const bodyTokens = tokensIn(content.bodyHtml);
  if (plainText(content.bodyHtml) === "" && bodyTokens.length === 0) {
    issues.push({ id: "empty-body", field: "body", message: "Write a message." });
  }
  for (const [field, keys] of [
    ["subject", tokensIn(content.subject)],
    ["body", bodyTokens],
  ] as const) {
    for (const key of keys) {
      if (valid.has(key)) continue;
      issues.push({
        id: `bad-var:${field}:${key}`,
        field,
        message: `“${varDef(key)?.label ?? key}” doesn't work in ${where}.`,
      });
    }
  }
  return issues;
}

/* ---------- styles ---------- */

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Frame = styled.div`
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  overflow: hidden;

  &:focus-within {
    box-shadow: var(--focus-ring);
  }
  &[data-invalid] {
    border-color: var(--color-danger);
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Spacer = styled.span`
  margin-left: auto;
`;

const ToolToggle = styled(Toggle)`
  && {
    height: calc(var(--space-5) + var(--space-2));
    min-width: calc(var(--space-5) + var(--space-2));
    padding: 0 var(--space-2);
    border-color: transparent;
    background: transparent;
  }
  &&[data-state="on"],
  &&[data-state="on"]:hover:not([data-disabled]) {
    background: var(--color-bg-selected);
    border-color: transparent;
    color: var(--color-text);
  }
`;

const Divider = styled.span`
  align-self: stretch;
  width: 1px;
  margin: var(--space-1) var(--space-1);
  background: var(--color-border);
`;

const SubjectBox = styled.div`
  position: relative;
`;

const SubjectAction = styled.div`
  position: absolute;
  top: 50%;
  right: var(--space-1);
  transform: translateY(-50%);
`;

const IssueList = styled.span`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: flex-start;
`;

const IssueRow = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

/* The footer reads as the last lines of the message: same text column, greyed, no box. */
const FooterInline = styled.div`
  padding: 0 var(--space-3) var(--space-3);
`;

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
`;

const PopoverBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const VarList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
`;

/* Group headers and rows share one left edge (--space-2) so labels line up. */
const VarGroup = styled.span`
  padding: var(--space-2) var(--space-2) var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);

  &:first-child {
    padding-top: 0;
  }
`;

const VarItem = styled.button`
  all: unset;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    background: var(--color-bg-hover);
    box-shadow: var(--focus-ring);
  }
`;

const VarExample = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
`;

const PreviewBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

/* ---------- pieces ---------- */

function VariablePopover({
  moment,
  open,
  onOpenChange,
  onPick,
  iconOnly,
}: {
  moment?: Moment;
  open: boolean;
  onOpenChange(open: boolean): void;
  onPick(key: VarKey): void;
  iconOnly?: boolean;
}) {
  const vars = variablesFor(moment);
  const groups = Array.from(new Set(vars.map((v) => v.group)));
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          $variant={iconOnly ? "ghost" : "outline"}
          $size="sm"
          aria-label={copy.insertVariable}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Icon icon={Braces} size={14} />
          {iconOnly ? null : copy.insertVariable}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        collisionPadding={16}
        avoidCollisions
        showClose={false}
        onCloseAutoFocus={(e) => e.preventDefault()}
        aria-label={copy.insertVariable}
      >
        <VarList>
          {groups.map((g) => (
            <React.Fragment key={g}>
              <VarGroup>{g}</VarGroup>
              {vars
                .filter((v) => v.group === g)
                .map((v) => (
                  <VarItem
                    key={v.key}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onPick(v.key);
                    }}
                  >
                    <span>{v.label}</span>
                    <VarExample>{v.example}</VarExample>
                  </VarItem>
                ))}
            </React.Fragment>
          ))}
        </VarList>
      </PopoverContent>
    </Popover>
  );
}

function ToolButton({
  label,
  icon,
  pressed,
  onPressedChange,
}: {
  label: string;
  icon: React.ComponentProps<typeof Icon>["icon"];
  pressed: boolean;
  onPressedChange(): void;
}) {
  return (
    <Tooltip content={label} pinOnClick={false}>
      <ToolToggle
        aria-label={label}
        pressed={pressed}
        onMouseDown={(e) => e.preventDefault()}
        onPressedChange={onPressedChange}
      >
        <Icon icon={icon} size={16} />
      </ToolToggle>
    </Tooltip>
  );
}

function FallbackForm({ varKey, onDone }: { varKey: VarKey; onDone(): void }) {
  const api = useEmails();
  const def = VARIABLES.find((v) => v.key === varKey)!;
  const [draft, setDraft] = React.useState(api.state.fallbacks[varKey] ?? def.defaultFallback);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await api.setFallback(varKey, draft.trim());
    setSaving(false);
    if (res.ok) onDone();
    else setError(res.error || "Couldn't save. Try again.");
  };

  return (
    <PopoverBody>
      <Field label={copy.fallbackLabel} error={error}>
        {(p) => (
          <Input
            {...p}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void save();
              }
            }}
          />
        )}
      </Field>
      <PopoverActions>
        <Button type="button" $size="sm" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Done"}
        </Button>
      </PopoverActions>
    </PopoverBody>
  );
}

function LinkPopover({ body, active }: { body: React.RefObject<SurfaceHandle | null>; active: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onOpenChange = (next: boolean) => {
    if (next) {
      body.current?.saveRange();
      setUrl(body.current?.currentLink()?.getAttribute("href") ?? "");
      setError(null);
    }
    setOpen(next);
  };

  const withSelection = (fn: (h: SurfaceHandle) => void) => {
    const h = body.current;
    if (!h) return;
    setOpen(false);
    h.focus();
    h.restoreRange();
    const link = h.currentLink();
    if (link) {
      const r = document.createRange();
      r.selectNodeContents(link);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
    fn(h);
  };

  const apply = () => {
    const href = normalizeLink(url);
    if (!href) {
      setError("Enter a web or email address.");
      return;
    }
    withSelection((h) => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        const text = href.replace(/^mailto:/, "").replace(/</g, "");
        h.exec("insertHTML", `<a href="${href.replace(/"/g, "%22")}">${text}</a>`);
      } else {
        h.exec("createLink", href);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip content="Link" pinOnClick={false}>
        <PopoverTrigger asChild>
          <ToolToggle aria-label="Link" pressed={active} onMouseDown={(e) => e.preventDefault()}>
            <Icon icon={Link2} size={16} />
          </ToolToggle>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="start" showClose={false} onCloseAutoFocus={(e) => e.preventDefault()}>
        <PopoverBody>
          <Field label="Link address" error={error}>
            {(p) => (
              <Input
                {...p}
                value={url}
                inputMode="url"
                autoFocus
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    apply();
                  }
                }}
              />
            )}
          </Field>
          <PopoverActions>
            {active && (
              <Button type="button" $variant="ghost" $size="sm" onClick={() => withSelection((h) => h.exec("unlink"))}>
                Remove link
              </Button>
            )}
            <Button type="button" $size="sm" onClick={apply}>
              Done
            </Button>
          </PopoverActions>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

function IssuesText({ issues, onJump }: { issues: CheckIssue[]; onJump(issue: CheckIssue): void }) {
  return (
    <IssueList>
      {issues.map((i) => (
        <IssueRow key={i.id}>
          {i.message}
          <Button type="button" $variant="ghost" $size="sm" onClick={() => onJump(i)}>
            {copy.jump}
          </Button>
        </IssueRow>
      ))}
    </IssueList>
  );
}

const MISSING_ID = "__missing-details__";
const MISSING_MEMBER: Member = {
  id: MISSING_ID,
  firstName: "",
  lastName: "",
  email: "",
  joinedAt: "",
  tags: [],
  status: "active",
  sentThisMonth: 0,
};

/* ---------- the editor ---------- */

/** Subject + message editor with a short toolbar, variable chips, a fallback popover and a one-line footer. */
export function EmailEditor(props: EmailEditorProps) {
  const { value, onChange, moment, context, readOnly, issues = [], previewMembers } = props;
  const api = useEmails();
  const { toast } = useToast();
  const uid = React.useId();
  const subjectRef = React.useRef<SurfaceHandle>(null);
  const bodyRef = React.useRef<SurfaceHandle>(null);
  const valueRef = React.useRef(value);
  React.useLayoutEffect(() => {
    valueRef.current = value;
  });

  const validKeys = variablesFor(moment)
    .map((v) => v.key)
    .join(",");
  const valid = React.useMemo(() => new Set<string>(validKeys ? validKeys.split(",") : []), [validKeys]);

  const [menu, setMenu] = React.useState<"subject" | "body" | null>(null);
  const [fb, setFb] = React.useState<{ key: VarKey; chip: HTMLElement; from: "subject" | "body" } | null>(null);
  const [fmt, setFmt] = React.useState({ bold: false, italic: false, ul: false, ol: false, link: false });
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewId, setPreviewId] = React.useState<string>(previewMembers?.[0]?.id ?? MISSING_ID);
  const [sending, setSending] = React.useState(false);
  const [testError, setTestError] = React.useState<string | null>(null);

  const subjectIssues = issues.filter((i) => i.field === "subject");
  const bodyIssues = issues.filter((i) => i.field === "body");

  const change = (next: EmailContent) => {
    setTestError(null);
    onChange(next);
  };

  const refreshFmt = React.useCallback(() => {
    const el = bodyRef.current?.element();
    const sel = window.getSelection();
    if (!el || !sel?.anchorNode || !el.contains(sel.anchorNode)) return;
    const next = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      link: !!bodyRef.current?.currentLink(),
    };
    setFmt((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);

  const jump = (issue: CheckIssue) => {
    const surface = issue.field === "subject" ? subjectRef : bodyRef;
    const key = issue.id.startsWith("bad-var:") ? issue.id.split(":")[2] : null;
    if (key && surface.current?.focusChip(key)) return;
    surface.current?.focus();
  };

  const prompt = context === "one-off" || !moment ? ONE_OFF_PROMPT : (PROMPT_BY_MOMENT[moment.type] ?? ONE_OFF_PROMPT);

  const members = previewMembers ?? [];
  const previewMember = previewId === MISSING_ID ? MISSING_MEMBER : (members.find((m) => m.id === previewId) ?? MISSING_MEMBER);

  const canTest = value.subject.trim() !== "" && (plainText(value.bodyHtml) !== "" || tokensIn(value.bodyHtml).length > 0);
  const sendTest = async () => {
    setSending(true);
    setTestError(null);
    const res = await api.sendTest(
      { subject: `[TEST] ${value.subject}`, bodyHtml: value.bodyHtml },
      previewMember.id === MISSING_ID ? undefined : previewMember.id,
    );
    setSending(false);
    if (res.ok) toast({ title: copy.testSent });
    else setTestError(res.error || "Couldn't send the test. Try again.");
  };

  const onChipOpen = (from: "subject" | "body") => (key: VarKey, chip: HTMLElement) => setFb({ key, chip, from });

  /* ---------- read only ---------- */
  if (readOnly) {
    return (
      <Root>
        <Field label={copy.subjectLabel}>
          {(p) => (
            <RichSurface
              kind="subject"
              readOnly
              id={p.id}
              value={value.subject}
              onValue={() => {}}
              valid={valid}
              ariaLabel={copy.subjectLabel}
              onBrace={() => {}}
              onChipOpen={() => {}}
            />
          )}
        </Field>
        <Field label={copy.messageLabel}>
          {(p) => (
            <Frame>
              <RichSurface
                kind="body"
                readOnly
                id={p.id}
                value={value.bodyHtml}
                onValue={() => {}}
                valid={valid}
                ariaLabel={copy.messageLabel}
                onBrace={() => {}}
                onChipOpen={() => {}}
              />
            </Frame>
          )}
        </Field>
        <EmailFooter />
      </Root>
    );
  }

  /* ---------- editing ---------- */
  return (
    <Root>
      <Field label={copy.subjectLabel} error={subjectIssues.length ? <IssuesText issues={subjectIssues} onJump={jump} /> : undefined}>
        {(p) => (
          <SubjectBox>
            <RichSurface
              kind="subject"
              handleRef={subjectRef}
              id={p.id}
              value={value.subject}
              onValue={(subject) => change({ ...valueRef.current, subject })}
              valid={valid}
              ariaLabel={copy.subjectLabel}
              describedBy={p["aria-describedby"]}
              invalid={subjectIssues.length > 0}
              onBrace={() => setMenu("subject")}
              onChipOpen={onChipOpen("subject")}
            />
            <SubjectAction>
              <VariablePopover
                iconOnly
                moment={moment}
                open={menu === "subject"}
                onOpenChange={(o) => {
                  if (o) subjectRef.current?.saveRange();
                  setMenu(o ? "subject" : null);
                }}
                onPick={(k) => subjectRef.current?.insertChip(k)}
              />
            </SubjectAction>
          </SubjectBox>
        )}
      </Field>

      <Field label={copy.messageLabel} error={bodyIssues.length ? <IssuesText issues={bodyIssues} onJump={jump} /> : undefined}>
        {(p) => (
          <Frame data-invalid={bodyIssues.length ? "" : undefined}>
            <Toolbar role="toolbar" aria-label="Formatting" aria-controls={p.id}>
              <ToolButton label="Bold" icon={Bold} pressed={fmt.bold} onPressedChange={() => bodyRef.current?.exec("bold")} />
              <ToolButton label="Italic" icon={Italic} pressed={fmt.italic} onPressedChange={() => bodyRef.current?.exec("italic")} />
              <Divider aria-hidden="true" />
              <LinkPopover body={bodyRef} active={fmt.link} />
              <Divider aria-hidden="true" />
              <ToolButton
                label="Bulleted list"
                icon={List}
                pressed={fmt.ul}
                onPressedChange={() => bodyRef.current?.exec("insertUnorderedList")}
              />
              <ToolButton
                label="Numbered list"
                icon={ListOrdered}
                pressed={fmt.ol}
                onPressedChange={() => bodyRef.current?.exec("insertOrderedList")}
              />
              <Spacer>
                <VariablePopover
                  moment={moment}
                  open={menu === "body"}
                  onOpenChange={(o) => {
                    if (o) bodyRef.current?.saveRange();
                    setMenu(o ? "body" : null);
                  }}
                  onPick={(k) => bodyRef.current?.insertChip(k)}
                />
              </Spacer>
            </Toolbar>
            <RichSurface
              kind="body"
              handleRef={bodyRef}
              id={p.id}
              value={value.bodyHtml}
              onValue={(bodyHtml) => change({ ...valueRef.current, bodyHtml })}
              valid={valid}
              ariaLabel={copy.messageLabel}
              describedBy={p["aria-describedby"]}
              invalid={bodyIssues.length > 0}
              prompt={{ id: `${uid}-prompt`, text: prompt }}
              onBrace={() => setMenu("body")}
              onChipOpen={onChipOpen("body")}
              onSelectionChange={refreshFmt}
            />
            <FooterInline>
              <EmailFooter />
            </FooterInline>
          </Frame>
        )}
      </Field>

      <Bottom>
        {previewMembers && (
          <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
            <SheetTrigger asChild>
              <Button type="button" $variant="outline" $size="sm">
                <Icon icon={Eye} size={14} />
                Preview
              </Button>
            </SheetTrigger>
            <SheetContent size="wide" aria-describedby={undefined}>
              <SheetHeader>
                <SheetTitle>Preview</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <PreviewBody>
                  <Field label="Member">
                    {(p) => (
                      <Select
                        {...p}
                        value={previewId}
                        onValueChange={setPreviewId}
                        options={[
                          ...members.map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}`.trim() || m.email })),
                          { value: MISSING_ID, label: copy.missingMember },
                        ]}
                      />
                    )}
                  </Field>
                  <EmailPreview content={value} member={previewMember} moment={moment} />
                  {testError && <span role="alert">{testError}</span>}
                </PreviewBody>
              </SheetBody>
              <SheetFooter>
                <Button type="button" $variant="outline" disabled={!canTest || sending} onClick={sendTest}>
                  {sending ? "Sending…" : "Send test"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </Bottom>

      {fb && (
        <Popover open onOpenChange={(o) => !o && setFb(null)}>
          <PopoverAnchor virtualRef={{ current: fb.chip }} />
          <PopoverContent
            showClose={false}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              (fb.from === "subject" ? subjectRef : bodyRef).current?.focus();
            }}
          >
            <FallbackForm varKey={fb.key} onDone={() => setFb(null)} />
          </PopoverContent>
        </Popover>
      )}
    </Root>
  );
}
