"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { styled } from "next-yak";
import { Check, CircleAlert } from "lucide-react";
import { PageLoading } from "@/components/patterns/PageLoading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Select } from "@/components/ui/Select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { checkEmail, EmailEditor, EmailPreview } from "../editor";
import {
  MOMENT_LABEL,
  type AutomaticEmail,
  type Delay,
  type Moment,
  type MomentType,
  type SendMode,
} from "../model";
import { useEmails } from "../store";
import { ActionMenu } from "./ActionMenu";
import { ConditionsEditor } from "./ConditionsEditor";
import { RecipientsSection } from "./RecipientsSection";
import { BackLink, LoadError, NotFound, Page } from "./states";
import {
  AUTOMATIC_BASE,
  FIELD,
  momentClause,
  plural,
  tagConflicts,
  validateForPublish,
  whoShort,
} from "./summary";
import { useAutomaticActions, type ActionKind } from "./useAutomaticActions";
import { useUnsavedGuard } from "./useUnsavedGuard";

/* The fields autosave writes. Everything else on the record belongs to the store. */
type Form = Pick<
  AutomaticEmail,
  "name" | "moment" | "delay" | "conditions" | "content" | "sendMode"
>;
type SaveStatus = "saved" | "dirty" | "saving" | "error";
type PillKey = "moment" | "delay" | "mode" | "who";

const DEFAULT_NAME = "Untitled email";
const WHO_ID = "auto-who";
const pick = (e: AutomaticEmail): Form => ({
  name: e.name === DEFAULT_NAME ? "" : e.name,
  moment: e.moment,
  delay: e.delay,
  conditions: e.conditions,
  content: e.content,
  sendMode: e.sendMode,
});

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: var(--z-raised);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-3) 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
`;

const Titles = styled.div`
  display: flex;
  flex: 1 1 280px;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-2);
  min-width: 0;
`;

const TitleInput = styled.input`
  field-sizing: content;
  min-width: 12ch;
  max-width: 100%;
  margin-left: calc(var(--space-2) * -1);
  padding: var(--space-1) var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);

  &::placeholder {
    color: var(--color-text-muted);
  }
  &:hover:not(:read-only) {
    border-color: var(--color-border);
  }
  &:focus-visible {
    outline: none;
    border-color: var(--color-border-strong);
    box-shadow: var(--focus-ring);
  }
  &[aria-invalid="true"] {
    border-color: var(--color-danger);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const Quiet = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Danger = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

const Sentence = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  line-height: var(--leading-body);
`;

const PillButton = styled.button<{
  $unset?: boolean;
  $accent?: boolean;
  $invalid?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: ${({ $unset }) => ($unset ? "var(--color-text-muted)" : "var(--color-text)")};
  border-style: ${({ $unset }) => ($unset ? "dashed" : "solid")};
  border-color: ${({ $invalid, $accent }) => ($invalid ? "var(--color-danger)" : $accent ? "var(--color-accent)" : "var(--color-border-strong)")};

  &:hover {
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const Punct = styled.span`
  margin-left: calc(var(--space-2) * -1);
`;

const PillText = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
`;

const CountButton = styled.button`
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const Wide = styled(PopoverContent)`
  width: min(420px, calc(100vw - var(--space-6)));
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Option = styled(Button)`
  && {
    justify-content: flex-start;
    width: 100%;
  }
`;

const Inline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
`;

const DaysInput = styled.div`
  width: 96px;
`;

const Scroll = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
`;

const memberLabel = (m: {
  firstName?: string;
  lastName?: string;
  email: string;
}) => [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;

const delayText = (d: Delay | null) =>
  !d
    ? ""
    : d.kind === "immediately"
      ? "until the next morning"
      : d.kind === "same-day"
        ? "until the same morning"
        : plural(d.days, "day");

/* ---------- Page wrapper: loading, error, not found ---------- */

export function AutomaticDetail({ id }: { id: string }) {
  const api = useEmails();
  const load = api.usePageLoad();
  const email = api.state.automatic.find((e) => e.id === id);
  if (load.status === "loading") return <PageLoading narrow />;
  if (load.status === "error")
    return (
      <Page>
        <BackLink href={AUTOMATIC_BASE}>Automatic emails</BackLink>
        <LoadError retry={load.retry} />
      </Page>
    );
  if (!email)
    return (
      <Page>
        <BackLink href={AUTOMATIC_BASE}>Automatic emails</BackLink>
        <NotFound />
      </Page>
    );
  // Remount when the state changes (unpublish, restore) so the form starts from the stored record.
  return <EditorBody key={email.state} email={email} />;
}

/* ---------- The builder: one sentence, then the email ---------- */

function EditorBody({ email }: { email: AutomaticEmail }) {
  const api = useEmails();
  const apiRef = React.useRef(api);
  React.useEffect(() => {
    apiRef.current = api;
  });
  const params = useSearchParams();
  const { run, dialogs } = useAutomaticActions();

  const readOnly = email.state !== "draft";
  const live = email.state === "published";

  const [form, setForm] = React.useState<Form>(() => pick(email));
  const formRef = React.useRef(form);
  const savedRef = React.useRef(form);
  const savingRef = React.useRef<Promise<boolean> | null>(null);
  const timerRef = React.useRef<number | undefined>(undefined);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<SaveStatus>("saved");
  const [showErrors, setShowErrors] = React.useState(
    params.get("check") === "1" && !readOnly,
  );
  const [showEmailIssues, setShowEmailIssues] = React.useState(false);
  const [openPill, setOpenPill] = React.useState<PillKey | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [recipientsOpen, setRecipientsOpen] = React.useState(false);
  const id = email.id;

  /* Autosave: writes the latest form, repeating until nothing changed during the write. */
  const flush = React.useCallback(async (): Promise<boolean> => {
    window.clearTimeout(timerRef.current);
    for (;;) {
      if (savingRef.current) await savingRef.current;
      if (formRef.current === savedRef.current) {
        setStatus("saved");
        return true;
      }
      const snap = formRef.current;
      setStatus("saving");
      const p = apiRef.current.updateAutomatic(id, snap).then((r) => {
        if (r.ok) savedRef.current = snap;
        return r.ok;
      });
      savingRef.current = p;
      const ok = await p;
      savingRef.current = null;
      if (!ok) {
        setStatus("error");
        return false;
      }
    }
  }, [id]);

  const update = (patch: Partial<Form>) => {
    if (readOnly) return;
    const next = { ...formRef.current, ...patch };
    formRef.current = next;
    setForm(next);
    setStatus("dirty");
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void flush(), 700);
  };

  // Leaving the page with unsaved text: save it best-effort so nothing typed is lost.
  React.useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
      if (formRef.current !== savedRef.current)
        void apiRef.current.updateAutomatic(id, formRef.current);
    };
  }, [id]);

  const unsaved = !readOnly && status !== "saved";
  const guard = useUnsavedGuard(unsaved, () => void flush());

  const tags = React.useMemo(
    () =>
      [...new Set(api.state.members.flatMap((m) => m.tags))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [api.state.members],
  );

  const issues = validateForPublish(form);
  const emailIssues =
    showErrors || showEmailIssues
      ? checkEmail(form.content, form.moment ?? undefined)
      : [];
  const conflicts = tagConflicts(form.conditions);
  const nameIssue = showErrors
    ? issues.find((i) => i.fieldId === FIELD.name)
    : undefined;
  const sentenceIssue = showErrors
    ? issues.find((i) => i.fieldId !== FIELD.name && i.fieldId !== FIELD.email)
    : undefined;
  const targetOf = (fieldId: string): PillKey | null =>
    fieldId === FIELD.moment || fieldId === FIELD.momentTag
      ? "moment"
      : fieldId === FIELD.delay || fieldId === FIELD.days
        ? "delay"
        : fieldId === FIELD.sendMode
          ? "mode"
          : fieldId === FIELD.name || fieldId === FIELD.email
            ? null
            : "who";
  const invalidPill = sentenceIssue ? targetOf(sentenceIssue.fieldId) : null;
  const firstUnset: PillKey | null = !form.moment
    ? "moment"
    : !form.delay
      ? "delay"
      : !form.sendMode
        ? "mode"
        : null;

  const current: AutomaticEmail = {
    ...email,
    ...form,
    name: form.name.trim() ? form.name : DEFAULT_NAME,
  };
  const act = (kind: ActionKind) =>
    void run(
      kind,
      kind === "unpublish" || kind === "restore" ? email : current,
    );

  async function publish() {
    if (issues.length > 0) {
      setShowErrors(true);
      const first = issues[0].fieldId;
      window.setTimeout(() => {
        if (first === FIELD.name) titleRef.current?.focus();
        else if (first === FIELD.email) {
          const box = document.getElementById("auto-email");
          box?.scrollIntoView({ block: "center", behavior: "smooth" });
          box?.querySelector<HTMLElement>("[contenteditable]")?.focus();
        } else {
          const t = targetOf(first);
          const el = document.getElementById(
            t === "moment"
              ? FIELD.moment
              : t === "delay"
                ? FIELD.delay
                : t === "mode"
                  ? FIELD.sendMode
                  : WHO_ID,
          );
          el?.scrollIntoView({ block: "center", behavior: "smooth" });
          el?.focus();
        }
      }, 0);
      return;
    }
    if (!(await flush())) return;
    void run("publish", { ...email, ...formRef.current });
  }

  function changeMoment(type: string) {
    const before = checkEmail(form.content, form.moment ?? undefined).length;
    const moment: Moment =
      type === "tag-added"
        ? { type, tag: form.moment?.tag }
        : { type: type as MomentType };
    update({ moment });
    // Variables that no longer apply show up at once, not only when she tries to publish.
    if (checkEmail(form.content, moment).length > before)
      setShowEmailIssues(true);
    if (type !== "tag-added") setOpenPill(null);
  }

  function changeDelay(kind: string) {
    if (!kind) return;
    update({
      delay:
        kind === "days-after"
          ? {
              kind,
              days: form.delay?.kind === "days-after" ? form.delay.days : 1,
            }
          : ({ kind } as Delay),
    });
    if (kind !== "days-after") setOpenPill(null);
  }

  const scheduled = React.useMemo(
    () =>
      form.moment && form.delay
        ? api.scheduledFor({ ...email, ...form })
        : null,
    [api, email, form],
  );
  const previewMembers = api.state.members.slice(0, 25);
  const [previewId, setPreviewId] = React.useState(previewMembers[0]?.id ?? "");
  const previewMember =
    previewMembers.find((m) => m.id === previewId) ?? previewMembers[0];

  const tagMoment = form.moment?.type === "tag-added" ? form.moment : null;

  /* A pill: opens a popover to change the value. Read-only pages show the value as plain text. */
  const pill = (
    key: PillKey,
    domId: string,
    text: string,
    placeholder: string,
    body: React.ReactNode,
    wide = false,
  ) => {
    if (readOnly) return <PillText>{text || placeholder}</PillText>;
    const Content = wide ? Wide : PopoverContent;
    return (
      <Popover
        open={openPill === key}
        onOpenChange={(o) => setOpenPill(o ? key : null)}
      >
        <PopoverTrigger asChild>
          <PillButton
            type="button"
            id={domId}
            $unset={!text}
            $accent={firstUnset === key}
            $invalid={invalidPill === key}
          >
            {text || placeholder}
          </PillButton>
        </PopoverTrigger>
        <Content align="start" showClose={false} aria-label={placeholder}>
          {body}
        </Content>
      </Popover>
    );
  };

  const whoText =
    form.conditions.rules.length > 0
      ? whoShort(form.conditions).toLowerCase()
      : "everyone";

  const count =
    scheduled === null ? null : (
      <Popover>
        <PopoverTrigger asChild>
          <CountButton type="button">
            {scheduled.length === 0
              ? "No one yet"
              : `${scheduled.length} will get this`}
          </CountButton>
        </PopoverTrigger>
        {scheduled.length > 0 && (
          <PopoverContent
            align="start"
            showClose={false}
            aria-label="Who will get this"
          >
            <Scroll>
              {scheduled.slice(0, 50).map((m) => (
                <li key={m.id}>{memberLabel(m)}</li>
              ))}
            </Scroll>
          </PopoverContent>
        )}
      </Popover>
    );

  const saveText =
    status === "error" ? (
      <Danger role="status">
        <Icon icon={CircleAlert} size={14} />
        Not saved
        <Button
          type="button"
          $variant="ghost"
          $size="sm"
          onClick={() => void flush()}
        >
          Retry
        </Button>
      </Danger>
    ) : (
      <Quiet role="status" aria-live="polite">
        {status === "saved" ? (
          <>
            <Icon icon={Check} size={14} />
            Saved
          </>
        ) : (
          "Saving…"
        )}
      </Quiet>
    );

  return (
    <Page>
      <Bar>
        <Titles>
          <TitleInput
            ref={titleRef}
            aria-label="Name"
            placeholder="Name this email"
            value={form.name}
            readOnly={readOnly}
            maxLength={120}
            aria-invalid={nameIssue ? true : undefined}
            onChange={(e) => update({ name: e.target.value })}
            onBlur={() => void flush()}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          {live ? (
            <Badge $variant="success">Live</Badge>
          ) : email.state === "trash" ? (
            <Badge>In trash</Badge>
          ) : (
            <Badge>Draft</Badge>
          )}
          {nameIssue && (
            <Danger role="alert">
              <Icon icon={CircleAlert} size={14} />
              {nameIssue.message}
            </Danger>
          )}
        </Titles>
        <Actions>
          {!readOnly && saveText}
          {email.state !== "trash" && (
            <Button
              type="button"
              $variant="secondary"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
          )}
          {live && (
            <Button
              type="button"
              $variant="secondary"
              onClick={() => setRecipientsOpen(true)}
            >
              Recipients
            </Button>
          )}
          {email.state === "draft" && (
            <Button type="button" onClick={() => void publish()}>
              Publish
            </Button>
          )}
          {live && (
            <Button
              type="button"
              $variant="secondary"
              onClick={() => act("unpublish")}
            >
              Unpublish
            </Button>
          )}
          {email.state === "trash" && (
            <Button type="button" onClick={() => act("restore")}>
              Restore
            </Button>
          )}
          <ActionMenu email={email} hideOpen run={(kind) => act(kind)} />
        </Actions>
      </Bar>

      <Sentence role="group" aria-label="When this email sends">
        <span>When</span>
        {pill(
          "moment",
          FIELD.moment,
          form.moment
            ? form.moment.type === "tag-added" && !form.moment.tag
              ? "a member gets a tag"
              : momentClause(form.moment)
            : "",
          "choose when",
          <Stack>
            <OptionList>
              {(Object.keys(MOMENT_LABEL) as MomentType[]).map((t) => (
                <Option
                  key={t}
                  type="button"
                  $variant={form.moment?.type === t ? "secondary" : "ghost"}
                  $size="sm"
                  aria-pressed={form.moment?.type === t}
                  onClick={() => changeMoment(t)}
                >
                  {MOMENT_LABEL[t]}
                </Option>
              ))}
            </OptionList>
            {tagMoment && (
              <Select
                aria-label="Tag"
                value={tagMoment.tag ?? ""}
                placeholder="Choose a tag"
                options={[
                  ...new Set([
                    ...tags,
                    ...(tagMoment.tag ? [tagMoment.tag] : []),
                  ]),
                ].map((t) => ({ value: t, label: t }))}
                onValueChange={(tag) => {
                  update({ moment: { type: "tag-added", tag } });
                  setOpenPill(null);
                }}
              />
            )}
          </Stack>,
        )}
        <Punct>, wait</Punct>
        {pill(
          "delay",
          FIELD.delay,
          delayText(form.delay),
          "choose delay",
          <Inline>
            <ToggleGroup
              type="single"
              aria-label="Delay"
              value={form.delay?.kind ?? ""}
              onValueChange={changeDelay}
            >
              <ToggleGroupItem value="immediately">Right away</ToggleGroupItem>
              <ToggleGroupItem value="same-day">Same day</ToggleGroupItem>
              <ToggleGroupItem value="days-after">Days after</ToggleGroupItem>
            </ToggleGroup>
            {form.delay?.kind === "days-after" && (
              <DaysInput>
                <Input
                  id={FIELD.days}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  aria-label="Number of days"
                  value={form.delay.days ? String(form.delay.days) : ""}
                  onChange={(e) =>
                    update({
                      delay: {
                        kind: "days-after",
                        days: Number.parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </DaysInput>
            )}
          </Inline>,
          true,
        )}
        <Punct>, then</Punct>
        {pill(
          "mode",
          FIELD.sendMode,
          form.sendMode === "automatic"
            ? "send automatically"
            : form.sendMode === "review"
              ? "let me review each first"
              : "",
          "choose how to send",
          <ToggleGroup
            type="single"
            aria-label="Send mode"
            value={form.sendMode ?? ""}
            onValueChange={(v) => {
              if (!v) return;
              update({ sendMode: v as SendMode });
              setOpenPill(null);
            }}
          >
            <ToggleGroupItem value="automatic">
              Send automatically
            </ToggleGroupItem>
            <ToggleGroupItem value="review">Review each first</ToggleGroupItem>
          </ToggleGroup>,
          true,
        )}
        <span>to</span>
        {pill(
          "who",
          WHO_ID,
          whoText,
          "everyone",
          <ConditionsEditor
            value={form.conditions}
            onChange={(conditions) => update({ conditions })}
            tags={tags}
            now={api.now}
          />,
          true,
        )}
        <Punct>.</Punct>
        {count}
        {sentenceIssue ? (
          <Danger role="alert">
            <Icon icon={CircleAlert} size={14} />
            {sentenceIssue.message}
          </Danger>
        ) : (
          conflicts.length > 0 && (
            <Danger role="status">
              <Icon icon={CircleAlert} size={14} />
              {conflicts[0]} is both included and excluded
            </Danger>
          )
        )}
      </Sentence>

      <div id="auto-email">
        <EmailEditor
          value={form.content}
          onChange={(content) => update({ content })}
          moment={form.moment ?? undefined}
          context="automatic"
          readOnly={readOnly}
          issues={emailIssues}
        />
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent size="wide" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Preview</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <Stack>
              <Field label="Member">
                {(p) => (
                  <Select
                    {...p}
                    value={previewId}
                    onValueChange={setPreviewId}
                    options={previewMembers.map((m) => ({
                      value: m.id,
                      label: memberLabel(m),
                    }))}
                  />
                )}
              </Field>
              {previewMember && (
                <EmailPreview
                  content={form.content}
                  member={previewMember}
                  moment={form.moment ?? undefined}
                />
              )}
            </Stack>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <Sheet open={recipientsOpen} onOpenChange={setRecipientsOpen}>
        <SheetContent size="wide" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Recipients</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <RecipientsSection automaticId={email.id} />
          </SheetBody>
        </SheetContent>
      </Sheet>

      {dialogs}
      {guard}
    </Page>
  );
}
