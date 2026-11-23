"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Check, Copy } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { ThemeChoice } from "@/components/patterns/ThemeSwitcher";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { TagCombobox } from "@/components/ui/TagCombobox";
import { CommunityPhotos, type PhotoDraft } from "@/features/account/CommunityPhotos";
import { LazyFooterEditor as FooterEditor } from "@/features/email-footer/LazyFooterEditor";
import { footerProblem } from "@/features/email-footer/doc";
import { Toast, ToastAction, ToastTitle, useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { ADMINS, ALERTS, ALERT_GROUPS, ALERT_GROUP_TITLES, LOGIN_EMAIL, SEED, isEmail, splitName, type Settings } from "./data";
import { HintedRow } from "./HintedRow";
import { Cell, Column, Row, RowLabel, Section, SectionTitle, Sections } from "./parts";
import { settingTargetId } from "@/features/search/targets";

const SUPPORT_EMAIL = "bsf-support@example.com";

/* For rows whose control is shorter than a field (a button): centre it on the label, which is as tall as a field. */
const ButtonRow = styled(Row)`
  align-items: center;
`;

/* The button on the right, its right edge on the fields' right edge. */
const EndAligned = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/*
 * A value you can't change: the same outline as a field, so it lines up with them, but a light fill and the
 * not-allowed cursor so it reads as uneditable (owner). Its text starts on the fields' text column.
 */
const ReadOnlyValue = styled.div`
  display: flex;
  align-items: center;
  min-height: var(--control-height);
  padding-inline: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
  overflow-wrap: anywhere;
  cursor: not-allowed;
`;

/* A read-only field you click to copy. Its status (a copy icon, or a check and "Copied") sits at the right edge. */
const CopyField = styled.div`
  position: relative;

  & input {
    padding-right: calc(var(--space-8) + var(--space-3));
    cursor: pointer;
  }
`;

const CopyStatus = styled.span`
  position: absolute;
  top: 50%;
  right: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  transform: translateY(-50%);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  pointer-events: none;
`;

/** Typed to confirm deleting your account (owner's words). Case and surrounding spaces don't matter. */
const CONFIRM_PHRASE = "I acknowledge";

/** On hover or focus of each alerts heading: who these emails go to. */
const ALERTS_TIP = "Emails to admins, not members, when one of these happens.";

/* An alerts heading you can hover or focus for the tooltip; it looks like the heading it is. */
const TitleHint = styled.span`
  border-radius: var(--radius-sm);
  cursor: default;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/** How long the support field says "Copied" before it goes back. */
const COPIED_MS = 3500;

type Errors = Partial<Record<"name" | "replyTo" | "footer", string>>;

/* Alerts go to people already on the Admins page, so the choices are their emails; nothing else can be typed. */
const ADMIN_OPTIONS = ADMINS.map((a) => ({
  value: a.email,
  label: a.email,
  hint: a.name,
}));

function validate(s: Settings): Errors {
  const e: Errors = {};
  if (!s.name.trim()) e.name = "Enter your name.";
  else if (!splitName(s.name)) e.name = "Enter your first and last name.";
  if (!isEmail(s.replyTo)) e.replyTo = "Enter an email address like name@example.org.";
  const footer = footerProblem(s.footer);
  if (footer) e.footer = footer;
  return e;
}

/** Plain sentences about what now happens, so a rare visitor knows what the change means. */
function describeChanges(
  before: Settings,
  after: Settings,
  photoChanged: boolean,
): { title: string; description?: string } {
  const lines: { name: string; text: string }[] = [];
  if (photoChanged) lines.push({ name: "Community Photos", text: "Community Photos saved." });
  if (before.name.trim() !== after.name.trim()) {
    lines.push({
      name: "Your name",
      text: `Your name is now ${after.name.trim().split(/\s+/).join(" ")}.`,
    });
  }
  if (before.replyTo !== after.replyTo)
    lines.push({
      name: "Reply-to address",
      text: `Replies to member emails now go to ${after.replyTo}.`,
    });
  if (JSON.stringify(before.footer) !== JSON.stringify(after.footer))
    lines.push({
      name: "Email footer",
      text: "Every email from SDC now ends with the new footer, including ones waiting to send.",
    });
  for (const a of ALERTS) {
    const now = after.alerts[a.key];
    if (before.alerts[a.key].join() === now.join()) continue;
    lines.push({
      name: `${a.label} alert`,
      text: now.length ? `We'll email ${list(now)} when ${a.when}.` : `No one will be emailed when ${a.when}.`,
    });
  }
  if (lines.length === 1) return { title: lines[0].text };
  return {
    title: `${lines.length} settings saved`,
    description: lines.map((l) => l.name).join(", ") + ".",
  };
}

function list(items: string[]) {
  if (items.length <= 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function SettingsScreen({ onlyAdmin }: { onlyAdmin: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = React.useState<Settings>(SEED);
  // Edits live here only. Leave the page without saving and they are gone; nothing is stored.
  const [draft, setDraft] = React.useState<Settings>(SEED);
  const [errors, setErrors] = React.useState<Errors>({});
  // The Copy button shows a check and "Copied" for a few seconds, then goes back.
  const [copied, setCopied] = React.useState(false);
  // Deleting your account asks you to type the phrase first, so it can't happen by a stray click.
  const [confirmText, setConfirmText] = React.useState("");
  const confirmed = confirmText.trim().toLowerCase() === CONFIRM_PHRASE.toLowerCase();
  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);
  // Only says "Copied" once it really is; a blocked clipboard says how to get it instead.
  const copySupport = () =>
    Promise.resolve(navigator.clipboard?.writeText(SUPPORT_EMAIL) ?? Promise.reject())
      .then(() => setCopied(true))
      .catch(() => toast({ title: "Couldn’t copy. Select the address and copy it yourself." }));

  // Community Photos, the same component as /admin/settings. Starts with no photo.
  const [savedPhoto, setSavedPhoto] = React.useState({ url: null as string | null, alt: "" });
  const [photo, setPhoto] = React.useState<PhotoDraft>({ url: null, fileName: null, alt: "", uploading: false });
  const photoChanged = photo.url !== savedPhoto.url || photo.alt !== savedPhoto.alt;

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft) || photoChanged;
  // Your name is yours; a reply-to, the footer, an alert or the photo changes things for every admin.
  const sharedChanged =
    photoChanged ||
    draft.replyTo !== saved.replyTo ||
    JSON.stringify(draft.footer) !== JSON.stringify(saved.footer) ||
    JSON.stringify(draft.alerts) !== JSON.stringify(saved.alerts);

  const saveLabel = sharedChanged ? "Save for all admins" : "Save";

  const save = () => {
    if (photo.uploading) return;
    const found = validate(draft);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      // The toast can be far from the problem: take them to the first field that needs fixing.
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
        first?.scrollIntoView({ block: "center" });
        first?.focus();
      });
      return;
    }
    toast(describeChanges(saved, draft, photoChanged));
    setSaved(draft);
    setSavedPhoto({ url: photo.url, alt: photo.alt });
  };

  return (
    <ListPage>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Column>
          <ListPageHeader title="Settings" />
          <Sections>
            {ALERT_GROUPS.map((g, i) => {
              // The first alerts section keeps the "alerts" anchor, which the notifications panel's settings link opens.
              const id = i === 0 ? "alerts" : `alerts-${g.toLowerCase()}`;
              return (
                <Section key={g} aria-labelledby={id}>
                  <SectionTitle id={id}>
                    <Tooltip content={ALERTS_TIP} side="right" delayDuration={600}>
                      <TitleHint tabIndex={0}>{ALERT_GROUP_TITLES[g]}</TitleHint>
                    </Tooltip>
                  </SectionTitle>
                  {ALERTS.filter((a) => a.group === g).map((a) => (
                    <Row key={a.key} id={settingTargetId(`alert-${a.key}`)}>
                      <RowLabel>{a.label}</RowLabel>
                      <Cell>
                        <Field label={`Admins to email when ${a.when}`}>
                          {(props) => (
                            <TagCombobox
                              {...props}
                              options={ADMIN_OPTIONS}
                              value={draft.alerts[a.key]}
                              onValueChange={(next) =>
                                setDraft((d) => ({
                                  ...d,
                                  alerts: { ...d.alerts, [a.key]: next },
                                }))
                              }
                              placeholder="Add an admin"
                            />
                          )}
                        </Field>
                      </Cell>
                    </Row>
                  ))}
                </Section>
              );
            })}

            <Section aria-labelledby="sending">
              <SectionTitle id="sending">Email sending</SectionTitle>
              <HintedRow
                id={settingTargetId("reply-to")}
                label="Reply-to address"
                hint="When a member replies to an email from SDC, the reply comes here."
              >
                <Field label="Reply-to address" error={errors.replyTo}>
                  {(props) => (
                    <Input
                      {...props}
                      type="email"
                      value={draft.replyTo}
                      onChange={(e) => {
                        setDraft((d) => ({ ...d, replyTo: e.target.value }));
                        setErrors((x) => ({ ...x, replyTo: undefined }));
                      }}
                    />
                  )}
                </Field>
              </HintedRow>
              <HintedRow id={settingTargetId("footer")} label="Email footer" hint="Ends every email members get from SDC, including ones waiting to send.">
                <Field label="Email footer" error={errors.footer}>
                  {(props) => (
                    <FooterEditor
                      {...props}
                      aria-label="Email footer"
                      initial={SEED.footer}
                      onChange={(footer) => {
                        setDraft((d) => ({ ...d, footer }));
                        setErrors((x) => ({ ...x, footer: undefined }));
                      }}
                    />
                  )}
                </Field>
              </HintedRow>
            </Section>

            <CommunityPhotos draft={photo} onChange={(next) => setPhoto((p) => ({ ...p, ...next }))} />

            <Section aria-labelledby="account">
              <SectionTitle id="account">Account</SectionTitle>
              <Row id={settingTargetId("name")}>
                <RowLabel>Your name</RowLabel>
                <Cell>
                  <Field label="Your name" error={errors.name}>
                    {(props) => (
                      <Input
                        {...props}
                        autoComplete="name"
                        value={draft.name}
                        onChange={(e) => {
                          setDraft((d) => ({ ...d, name: e.target.value }));
                          setErrors((x) => ({ ...x, name: undefined }));
                        }}
                      />
                    )}
                  </Field>
                </Cell>
              </Row>
              <Row id={settingTargetId("email")}>
                <RowLabel>Your email</RowLabel>
                <ReadOnlyValue>{LOGIN_EMAIL}</ReadOnlyValue>
              </Row>
              <Row id={settingTargetId("theme")}>
                <RowLabel>Theme</RowLabel>
                <Cell>
                  <Field label="Theme">{(props) => <ThemeChoice {...props} />}</Field>
                </Cell>
              </Row>
              <Row id={settingTargetId("support")}>
                <RowLabel>Support</RowLabel>
                <Cell>
                  <Field label="Support email, press Enter to copy it">
                    {(props) => (
                      <CopyField>
                        <Input
                          {...props}
                          type="email"
                          value={SUPPORT_EMAIL}
                          readOnly
                          onClick={copySupport}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              copySupport();
                            }
                          }}
                        />
                        <CopyStatus aria-live="polite">
                          <Icon icon={copied ? Check : Copy} size={16} />
                          {copied && "Copied"}
                        </CopyStatus>
                      </CopyField>
                    )}
                  </Field>
                </Cell>
              </Row>
              <ButtonRow id={settingTargetId("delete-account")}>
                <RowLabel>Delete account</RowLabel>
                <EndAligned>
                  <AlertDialog onOpenChange={(open) => !open && setConfirmText("")}>
                    {onlyAdmin ? (
                      // The reason is the existing rule from docs/decisions/admins.md (decision 2).
                      <DisabledReason reason="You're the only admin. Add another admin before you leave.">
                        <Button type="button" $variant="danger" disabled>
                          Delete
                        </Button>
                      </DisabledReason>
                    ) : (
                      <AlertDialogTrigger asChild>
                        <Button type="button" $variant="danger">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                    )}
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You won&rsquo;t be able to log in anymore. Another admin can invite you back.
                      </AlertDialogDescription>
                      <Field label={`Type “${CONFIRM_PHRASE}” to confirm`}>
                        {(props) => (
                          <Input
                            {...props}
                            autoComplete="off"
                            placeholder={CONFIRM_PHRASE}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                          />
                        )}
                      </Field>
                      <AlertDialogActions>
                        <AlertDialogCancel asChild>
                          <Button type="button" $variant="secondary">
                            Cancel
                          </Button>
                        </AlertDialogCancel>
                        {confirmed ? (
                          <AlertDialogAction asChild>
                            <Button type="button" $variant="danger" onClick={() => router.push("/design/goodbye")}>
                              Delete account
                            </Button>
                          </AlertDialogAction>
                        ) : (
                          <DisabledReason reason={`Type “${CONFIRM_PHRASE}” to confirm.`}>
                            <Button type="button" $variant="danger" disabled>
                              Delete account
                            </Button>
                          </DisabledReason>
                        )}
                      </AlertDialogActions>
                    </AlertDialogContent>
                  </AlertDialog>
                </EndAligned>
              </ButtonRow>
            </Section>
          </Sections>
        </Column>
      </form>
      {/* Wherever they are on the page, unsaved changes and Save stay in view until saved (owner). */}
      <Toast persistent open={dirty && !photo.uploading} onOpenChange={() => {}}>
        <ToastTitle>You have unsaved changes</ToastTitle>
        <ToastAction altText={saveLabel} onClick={save}>
          {saveLabel}
        </ToastAction>
      </Toast>
    </ListPage>
  );
}

/** Toasts come from the design shell's provider. */
export function SettingsPage({ onlyAdmin = false }: { onlyAdmin?: boolean }) {
  return <SettingsScreen onlyAdmin={onlyAdmin} />;
}
