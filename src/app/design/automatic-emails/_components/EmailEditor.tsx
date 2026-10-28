"use client";

import { useState } from "react";
import { styled } from "next-yak";
import { ArrowLeft, Check, Eye, Plus, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { ErrorIcon, Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import {
  type AlertWhen,
  type AutomaticEmail,
  type CondType,
  type Condition,
  CONDITION_OPTIONS,
  DEFAULT_ALERT_TO,
  MAX_CONDS,
  RECIPIENT_STATUS,
  TAGS,
  TODAY,
  TRIGGER_OPTIONS,
  checkEmail,
  displayName,
  isTagCond,
  iso,
  maxFor,
  monthDayOf,
  ordinal,
  previewFor,
  recipientsFor,
  unitOf,
} from "../_data";
import type { SaveStatus } from "./AutomaticEmails";
import { EmailPreviewDialog, ScheduledDialog } from "./EmailDialogs";
import { Muted, Notice, Page, PageTitle, Row, RowMain, RowSide } from "./parts";

const TAG_OPTIONS = TAGS.map((t) => ({ value: t, label: t }));
const DELAY_OPTIONS = [
  { value: "now", label: "immediately" },
  { value: "same", label: "the same day" },
  { value: "days", label: "after" },
];
const UNIT_OPTIONS = [
  { value: "days", label: "days" },
  { value: "months", label: "months" },
];
const MATCH_OPTIONS = [
  { value: "all", label: "all" },
  { value: "any", label: "any" },
];
const ALERT_WHEN_OPTIONS = [
  { value: "waiting", label: "as soon as it's waiting" },
  { value: "48h", label: "when it's due within 48 hours" },
  { value: "overdue", label: "when it's past due" },
];
const MONTH_DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: ordinal(i + 1) }));

const BackButton = styled(Button)`
  align-self: flex-start;
  padding-left: var(--space-2);
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  align-items: flex-start;
  justify-content: space-between;
`;

const HeaderMain = styled.div`
  flex: 1 1 360px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const SaveState = styled.span`
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Columns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  align-items: flex-start;
`;

const Column = styled.section<{ $grow: number }>`
  flex: ${({ $grow }) => $grow} 1 ${({ $grow }) => ($grow === 3 ? "460px" : "380px")};
  min-width: 0;
`;

const CardHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-5);
  min-height: var(--space-7);
  border-bottom: 1px solid var(--color-border);
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
`;

const CardSection = styled.div`
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/** Justin's sentence builder: the words between the controls are their visible labels. */
const Sentence = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Inline = styled.div`
  flex: none;
  max-width: 100%;
`;

const NumberInline = styled.div`
  flex: none;
  width: 8ch;
`;

const AlertAddress = styled.div`
  flex: 1 1 200px;
  min-width: 0;
`;

const CondList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const InlineError = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-danger);
`;

const BodyPlaceholder = styled.div`
  min-height: calc(var(--space-8) * 2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Indented = styled.div`
  margin-left: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const RecipientName = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const Detail = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

function ErrorLine({ children }: { children: string }) {
  return (
    <InlineError>
      <ErrorIcon />
      {children}
    </InlineError>
  );
}

export function EmailEditor({
  email: e,
  saved,
  onUpdate,
  onBack,
  onRetrySave,
  onSaveDraft,
  onAsk,
  onRestore,
}: {
  email: AutomaticEmail;
  saved: SaveStatus;
  onUpdate: (patch: Partial<AutomaticEmail>) => void;
  onBack: () => void;
  onRetrySave: () => void;
  onSaveDraft: () => void;
  onAsk: (kind: "publish" | "unpublish" | "trash") => void;
  onRestore: () => void;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState("setup");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduledOpen, setScheduledOpen] = useState(false);

  const isDraft = e.state === "draft";
  const ro = !isDraft;
  const check = checkEmail(e);
  const blockers = saved === "error" ? [...check.blockers, "save your latest changes"] : check.blockers;
  const blockerText = `To publish: ${blockers.join(", ")}.`;
  const preview = previewFor(e);
  const recipients = recipientsFor(e);
  const recipientsLabel = `${preview.length}${preview.length === 1 ? " recipient" : " recipients"}`;
  const isReview = e.mode === "review";
  const alertOn = e.alert !== false;
  // Justin's wording from the read-only notice. Trash has no reason yet.
  const lockReason = e.state === "published" ? "To change it, unpublish it." : null;
  const lock = ro ? { readOnly: true as const, disabledReason: lockReason } : {};

  function setConds(fn: (next: Condition[]) => void) {
    const next = e.conds.map((c) => ({ ...c }));
    fn(next);
    onUpdate({ conds: next });
  }

  function setCondType(i: number, type: CondType) {
    setConds((n) => {
      n[i] = {
        type,
        value: isTagCond(type) ? TAGS[0] : type === "in" ? iso(TODAY).slice(0, 7) : iso(TODAY),
      };
    });
  }

  const setup = (
    <Columns>
      <Column $grow={3} aria-labelledby="email-template">
        <Card>
          <CardHead>
            <CardTitle id="email-template">Email template</CardTitle>
            <Button $variant="secondary" $size="sm" onClick={() => setPreviewOpen(true)}>
              <Icon icon={Eye} />
              Preview email
            </Button>
          </CardHead>
          <CardSection>
            <Field label="Email name" required>
              {(props) => (
                <Input
                  {...props}
                  value={e.name}
                  onChange={(ev) => onUpdate({ name: ev.target.value })}
                  placeholder="Untitled automatic email"
                  maxLength={80}
                  disabled={ro}
                />
              )}
            </Field>
            <Field label="Subject" required>
              {(props) => (
                <Input {...props} value={e.subject} onChange={(ev) => onUpdate({ subject: ev.target.value })} disabled={ro} />
              )}
            </Field>
            <BodyPlaceholder>
              <span>
                Message body. The real editor comes from the Email Editor PRD.
                <br />
                Footer with unsubscribe link is added automatically.
              </span>
            </BodyPlaceholder>
          </CardSection>
        </Card>
      </Column>

      <Column $grow={2} aria-labelledby="sending-schedule">
        <Card>
          <CardHead>
            <CardTitle id="sending-schedule">Sending schedule</CardTitle>
            {preview.length > 0 ? (
              <Button $variant="ghost" $size="sm" onClick={() => setScheduledOpen(true)}>
                <Icon icon={Users} />
                {recipientsLabel}
              </Button>
            ) : (
              <Detail>0 recipients</Detail>
            )}
          </CardHead>

          <CardSection>
            <Stack>
              <Sentence>
                <span>When</span>
                <Inline>
                  <Select
                    aria-label="Trigger"
                    options={TRIGGER_OPTIONS}
                    value={e.trigger}
                    onValueChange={(v) => onUpdate({ trigger: v as AutomaticEmail["trigger"] })}
                    disabled={ro}
                  />
                </Inline>
                {e.trigger === "tag" && (
                  <Inline>
                    <Select aria-label="Tag" options={TAG_OPTIONS} value={e.tag} onValueChange={(v) => onUpdate({ tag: v })} disabled={ro} />
                  </Inline>
                )}
                {e.trigger === "monthly" && (
                  <>
                    <span>on the</span>
                    <Inline>
                      <Select
                        aria-label="Day of the month"
                        options={MONTH_DAY_OPTIONS}
                        value={String(monthDayOf(e))}
                        onValueChange={(v) => onUpdate({ monthDay: v })}
                        disabled={ro}
                      />
                    </Inline>
                  </>
                )}
                <span>send this email</span>
                {e.trigger !== "monthly" && (
                  <>
                    <Inline>
                      <Select
                        aria-label="When to send"
                        options={DELAY_OPTIONS}
                        value={e.delay}
                        onValueChange={(v) => onUpdate({ delay: v as AutomaticEmail["delay"] })}
                        disabled={ro}
                      />
                    </Inline>
                    {e.delay === "days" && (
                      <>
                        <NumberInline>
                          <Input
                            type="number"
                            min={1}
                            aria-label="How many"
                            aria-invalid={check.daysInvalid || undefined}
                            value={e.days}
                            onChange={(ev) => onUpdate({ days: ev.target.value })}
                            disabled={ro}
                          />
                        </NumberInline>
                        <Inline>
                          <Select
                            aria-label="Unit"
                            options={UNIT_OPTIONS}
                            value={unitOf(e)}
                            onValueChange={(v) => onUpdate({ unit: v as AutomaticEmail["unit"] })}
                            disabled={ro}
                          />
                        </Inline>
                      </>
                    )}
                  </>
                )}
              </Sentence>
              {e.trigger === "monthly" && <Muted>Repeats every month to every member who matches the conditions below.</Muted>}
              {(e.trigger === "refers" || e.trigger === "ref_joins") && <Muted>Sends to the member who made the referral.</Muted>}
              {check.daysInvalid && (
                <ErrorLine>{`Enter a whole number of ${unitOf(e)}, from 1 to ${maxFor(e)}.`}</ErrorLine>
              )}
            </Stack>

            <Stack>
              <Sentence>Recipients must:</Sentence>
              {e.conds.length === 0 && <Muted>No conditions yet, so everyone the trigger applies to gets it.</Muted>}
              {e.conds.length > 0 && (
                <CondList>
                  {e.conds.map((c, i) => {
                    const incomplete = !isTagCond(c.type) && !c.value;
                    return (
                      <li key={i}>
                        <Sentence>
                          <Inline>
                            <Select
                              aria-label="Condition"
                              options={CONDITION_OPTIONS}
                              value={c.type}
                              onValueChange={(v) => setCondType(i, v as CondType)}
                              disabled={ro}
                            />
                          </Inline>
                          {isTagCond(c.type) && (
                            <Inline>
                              <Select
                                aria-label="Tag"
                                options={TAG_OPTIONS}
                                value={c.value}
                                onValueChange={(v) => setConds((n) => (n[i].value = v))}
                                disabled={ro}
                              />
                            </Inline>
                          )}
                          {(c.type === "before" || c.type === "after") && (
                            <Inline>
                              <DatePicker
                                aria-label="Date"
                                aria-invalid={incomplete || undefined}
                                value={c.value}
                                onValueChange={(v) => setConds((n) => (n[i].value = v))}
                                disabled={ro}
                              />
                            </Inline>
                          )}
                          {c.type === "in" && (
                            <Inline>
                              <Input
                                type="month"
                                aria-label="Month"
                                aria-invalid={incomplete || undefined}
                                value={c.value}
                                onChange={(ev) => setConds((n) => (n[i].value = ev.target.value))}
                                disabled={ro}
                              />
                            </Inline>
                          )}
                          {!ro && (
                            <Button
                              $variant="ghost"
                              $size="sm"
                              aria-label="Remove condition"
                              onClick={() => setConds((n) => n.splice(i, 1))}
                            >
                              <Icon icon={X} />
                            </Button>
                          )}
                        </Sentence>
                        {incomplete && <ErrorLine>Pick a date or remove this condition.</ErrorLine>}
                      </li>
                    );
                  })}
                </CondList>
              )}
              {check.conflictText && (
                <Notice tone="warning" alert>
                  {check.conflictText} Fix this before publishing.
                </Notice>
              )}
              {check.rangeText && <Notice tone="warning">{check.rangeText}</Notice>}
              {!ro && (
                <Sentence>
                  {e.conds.length >= MAX_CONDS ? (
                    <DisabledReason reason={`You can add up to ${MAX_CONDS} conditions.`}>
                      <Button $variant="outline" $size="sm" disabled>
                        <Icon icon={Plus} />
                        Add condition
                      </Button>
                    </DisabledReason>
                  ) : (
                    <>
                      <Button
                        $variant="outline"
                        $size="sm"
                        onClick={() => setConds((n) => n.push({ type: "has", value: TAGS[1] }))}
                      >
                        <Icon icon={Plus} />
                        Add condition
                      </Button>
                      <Detail>{`${e.conds.length} of ${MAX_CONDS}`}</Detail>
                    </>
                  )}
                </Sentence>
              )}
            </Stack>

            {e.conds.length > 0 && (
              <Sentence>
                <span>Recipients must match</span>
                <Inline>
                  <Select
                    aria-label="Match all or any"
                    options={MATCH_OPTIONS}
                    value={e.match}
                    onValueChange={(v) => onUpdate({ match: v as AutomaticEmail["match"] })}
                    disabled={ro}
                  />
                </Inline>
                <span>of these conditions.</span>
              </Sentence>
            )}
          </CardSection>

          <CardSection>
            <Stack>
              <Checkbox
                {...lock}
                label="Review before sending"
                checked={isReview}
                onCheckedChange={(v) => onUpdate({ mode: v === true ? "review" : "auto" })}
              />
              <Muted>
                {isReview
                  ? "On: each send waits in the Outbox until you approve it."
                  : "Off: this email currently sends automatically on schedule, with no action from you."}
              </Muted>
            </Stack>
            {isReview && (
              <Indented>
                <Stack>
                  <Checkbox
                    {...lock}
                    label="Email an alert when a send is waiting for review"
                    checked={alertOn}
                    onCheckedChange={(v) => onUpdate({ alert: v === true })}
                  />
                  <Muted>For people who don&apos;t check the platform every day.</Muted>
                </Stack>
                {alertOn && (
                  <Stack>
                    <Sentence>
                      <span>Alert</span>
                      <AlertAddress>
                        <Input
                          type="email"
                          aria-label="Alert email address"
                          aria-invalid={check.alertInvalid || undefined}
                          value={e.alertTo ?? DEFAULT_ALERT_TO}
                          onChange={(ev) => onUpdate({ alertTo: ev.target.value })}
                          placeholder="name@example.org"
                          disabled={ro}
                        />
                      </AlertAddress>
                      <Inline>
                        <Select
                          aria-label="When to send the alert"
                          options={ALERT_WHEN_OPTIONS}
                          value={e.alertWhen ?? "48h"}
                          onValueChange={(v) => onUpdate({ alertWhen: v as AlertWhen })}
                          disabled={ro}
                        />
                      </Inline>
                    </Sentence>
                    {check.alertInvalid && <ErrorLine>Enter a valid email address for the alert.</ErrorLine>}
                  </Stack>
                )}
              </Indented>
            )}
          </CardSection>
        </Card>
      </Column>
    </Columns>
  );

  const recipientList = (
    <>
      <Card>
        {recipients.map((r) => (
          <Row key={r.name}>
            <RowMain>
              <RecipientName>{r.name}</RecipientName>
            </RowMain>
            <RowSide>
              <Detail>{r.detail}</Detail>
              <Badge $variant={RECIPIENT_STATUS[r.status].variant}>{RECIPIENT_STATUS[r.status].label}</Badge>
            </RowSide>
          </Row>
        ))}
      </Card>
      <div>
        <Button $variant="outline" $size="sm" onClick={() => toast({ title: "Would open Email Insights filtered to this email" })}>
          View insights
        </Button>
      </div>
    </>
  );

  return (
    <Page>
      <BackButton $variant="ghost" onClick={onBack}>
        <Icon icon={ArrowLeft} />
        All automatic emails
      </BackButton>

      <Header>
        <HeaderMain>
          <PageTitle>{displayName(e)}</PageTitle>
          {isDraft && saved === "saving" && <SaveState>Saving…</SaveState>}
          {isDraft && saved === "saved" && (
            <SaveState>
              <Icon icon={Check} size={14} />
              Saved
            </SaveState>
          )}
          {isDraft && saved === "error" && (
            <SaveState>
              <Badge $variant="danger">Not saved</Badge>
              <Button $variant="outline" $size="sm" onClick={onRetrySave}>
                Retry
              </Button>
            </SaveState>
          )}
        </HeaderMain>
        <Actions>
          {e.state !== "trash" && (
            <Button $variant="ghost" onClick={() => onAsk("trash")}>
              Move to trash
            </Button>
          )}
          {e.state === "trash" && (
            <Button $variant="outline" onClick={onRestore}>
              Restore to drafts
            </Button>
          )}
          {e.state === "published" && (
            <Button $variant="outline" onClick={() => onAsk("unpublish")}>
              Unpublish to edit
            </Button>
          )}
          {isDraft && (
            <>
              <Button $variant="outline" onClick={onSaveDraft}>
                Save draft
              </Button>
              {blockers.length > 0 ? (
                <DisabledReason reason={blockerText}>
                  <Button disabled>Publish</Button>
                </DisabledReason>
              ) : (
                <Button onClick={() => onAsk("publish")}>Publish</Button>
              )}
            </>
          )}
        </Actions>
      </Header>

      {e.state === "published" && (
        <Notice tone="info">
          This email is live and read-only. To change it, unpublish it. Sending stops until you publish again.
        </Notice>
      )}
      {saved === "error" && (
        <Notice tone="danger" alert>
          Your latest changes didn&apos;t save. Your text is still here. Retry, or keep editing and we&apos;ll try again.
        </Notice>
      )}
      {isDraft && blockers.length > 0 && <Muted>{blockerText}</Muted>}

      {recipients.length > 0 ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label="Email sections">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="recipients">
              Recipients <TabsCount>{recipients.length}</TabsCount>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="setup">{setup}</TabsContent>
          <TabsContent value="recipients">{recipientList}</TabsContent>
        </Tabs>
      ) : (
        setup
      )}

      <EmailPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} email={e} />
      <ScheduledDialog
        open={scheduledOpen && preview.length > 0}
        onOpenChange={setScheduledOpen}
        title={recipientsLabel}
        recipients={preview}
      />
    </Page>
  );
}
