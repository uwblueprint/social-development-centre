"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Copy } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
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
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { ADMINS, ALERTS, ALERT_GROUPS, ALERT_GROUP_TITLES, SEED, isEmail, splitName, type Settings } from "./data";
import { HintedRow } from "./HintedRow";
import { Cell, Column, Row, RowLabel, Section, SectionTitle, Sections } from "./parts";

const SUPPORT_EMAIL = "bsf-support@example.com";

/* For rows whose control is shorter than a field (a button): centre it on the label, which is as tall as a field. */
const ButtonRow = styled(Row)`
  align-items: center;
`;

const HelpValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text);
`;

/* Last on the page: the button alone, its right edge on the fields' right edge. */
const DeleteRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: var(--space-3) 0;
`;

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
  if (!s.footer.trim()) e.footer = "Write the sign-off members see at the end of every email.";
  return e;
}

/** Plain sentences about what now happens, so a rare visitor knows what the change means. */
function describeChanges(before: Settings, after: Settings): { title: string; description?: string } {
  const lines: { name: string; text: string }[] = [];
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
  if (before.footer !== after.footer)
    lines.push({
      name: "Email footer",
      text: "Every email from SDC will now end with the new footer.",
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

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  // Your name and the footer are yours; a reply-to or an alert changes things for every admin.
  const sharedChanged =
    draft.replyTo !== saved.replyTo || JSON.stringify(draft.alerts) !== JSON.stringify(saved.alerts);

  const save = () => {
    const found = validate(draft);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    toast(describeChanges(saved, draft));
    setSaved(draft);
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
          <ListPageHeader
            title="Settings"
            actions={
              dirty ? <Button type="submit">{sharedChanged ? "Save for all admins" : "Save"}</Button> : undefined
            }
          />
          <Sections>
            <Section aria-labelledby="sending">
              <SectionTitle id="sending">Email sending</SectionTitle>
              <HintedRow
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
              <HintedRow
                label="Email footer"
                field="textarea"
                hint="Ends every email members get from SDC. The unsubscribe link is added below it for you."
              >
                <Field label="Email footer" error={errors.footer}>
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={5}
                      value={draft.footer}
                      onChange={(e) => {
                        setDraft((d) => ({ ...d, footer: e.target.value }));
                        setErrors((x) => ({ ...x, footer: undefined }));
                      }}
                    />
                  )}
                </Field>
              </HintedRow>
            </Section>

            {ALERT_GROUPS.map((g, i) => {
              // The first alerts section keeps the "alerts" anchor, which the notifications panel links to.
              const id = i === 0 ? "alerts" : `alerts-${g.toLowerCase()}`;
              return (
                <Section key={g} aria-labelledby={id}>
                  <SectionTitle id={id}>{ALERT_GROUP_TITLES[g]}</SectionTitle>
                  {ALERTS.filter((a) => a.group === g).map((a) => (
                    <Row key={a.key}>
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
                              placeholder="Off"
                            />
                          )}
                        </Field>
                      </Cell>
                    </Row>
                  ))}
                </Section>
              );
            })}

            <Section aria-labelledby="account">
              <SectionTitle id="account">Account</SectionTitle>
              <Row>
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
              <ButtonRow>
                <RowLabel>Support</RowLabel>
                <HelpValue>
                  {SUPPORT_EMAIL}
                  <Button
                    type="button"
                    $variant="outline"
                    $size="sm"
                    onClick={() => {
                      void navigator.clipboard?.writeText(SUPPORT_EMAIL);
                      toast({ title: `Copied ${SUPPORT_EMAIL}` });
                    }}
                  >
                    <Icon icon={Copy} />
                    Copy
                  </Button>
                </HelpValue>
              </ButtonRow>
              <DeleteRow>
                <AlertDialog>
                  {onlyAdmin ? (
                    // The reason is the existing rule from docs/decisions/admins.md (decision 2).
                    <DisabledReason reason="You're the only admin. Add another admin before you leave.">
                      <Button type="button" $variant="danger" disabled>
                        Delete account
                      </Button>
                    </DisabledReason>
                  ) : (
                    <AlertDialogTrigger asChild>
                      <Button type="button" $variant="danger">
                        Delete account
                      </Button>
                    </AlertDialogTrigger>
                  )}
                  <AlertDialogContent>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You won&rsquo;t be able to log in anymore. Another admin can invite you back.
                    </AlertDialogDescription>
                    <AlertDialogActions>
                      <AlertDialogCancel asChild>
                        <Button type="button" $variant="secondary">
                          Cancel
                        </Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button type="button" $variant="danger" onClick={() => router.push("/design/goodbye")}>
                          Delete account
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogActions>
                  </AlertDialogContent>
                </AlertDialog>
              </DeleteRow>
            </Section>
          </Sections>
        </Column>
      </form>
    </ListPage>
  );
}

/** Toasts come from the design shell's provider. */
export function SettingsPage({ onlyAdmin = false }: { onlyAdmin?: boolean }) {
  return <SettingsScreen onlyAdmin={onlyAdmin} />;
}
