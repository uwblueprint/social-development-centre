"use client";

import * as React from "react";
import { styled } from "next-yak";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CreatableCombobox, type CreatableComboboxValue } from "@/components/ui/CreatableCombobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TagInput } from "@/components/ui/TagInput";
import { Textarea } from "@/components/ui/Textarea";
import { normalizeEmail } from "@/lib/email";
import { addMember, addMembers, createTag, setMembershipEnd, type AddMembersSummary } from "../actions";
import type { TagSummary } from "../types";
import { plural } from "./dates";

/*
 * The directory's dialogs. Each one calls its server action and reports back through `onDone` with a
 * short message for a toast; errors stay in the dialog next to the field they're about.
 */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const FormMessage = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

interface DialogBase {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Actions({ submit }: { submit: string }) {
  return (
    <DialogActions>
      <DialogClose asChild>
        <Button type="button" $variant="secondary">
          Cancel
        </Button>
      </DialogClose>
      <SubmitButton>{submit}</SubmitButton>
    </DialogActions>
  );
}

const SOMETHING_WENT_WRONG = "Something went wrong. Try again.";

/* ---------- adding members ---------- */

export function AddMemberDialog({
  open,
  onOpenChange,
  today,
  onDone,
}: DialogBase & { today: string; onDone: (message: string) => void }) {
  const [errors, setErrors] = React.useState<{ firstName?: string; email?: string; form?: string }>({});
  const [values, setValues] = React.useState({ firstName: "", lastName: "", email: "", joinedAt: today });
  const [joinEmails, setJoinEmails] = React.useState(true);
  // A submitted form resets itself, and the checkbox would snap back to how it started. Remounting it on
  // each submit makes "how it started" the current choice.
  const [attempt, setAttempt] = React.useState(0);

  async function submit(formData: FormData) {
    const v = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? ""),
      joinedAt: values.joinedAt,
    };
    setValues(v);
    setAttempt((n) => n + 1);
    if (!v.firstName) return setErrors({ firstName: "Enter a first name." });
    const data = new FormData();
    data.set("fullName", `${v.firstName} ${v.lastName}`.trim());
    data.set("email", v.email);
    data.set("joinedAt", v.joinedAt);
    data.set("joinEmails", joinEmails ? "on" : "off");
    const result = await addMember({ status: "idle" }, data).catch(() => null);
    if (result?.status === "success") return onDone(result.message ?? "Member added");
    setErrors({ email: result?.fieldErrors?.email, form: result?.fieldErrors ? undefined : SOMETHING_WENT_WRONG });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Add member</DialogTitle>
        <Form action={submit} noValidate>
          <Row>
            <Field label="First name" error={errors.firstName}>
              {(props) => <Input {...props} name="firstName" autoComplete="off" defaultValue={values.firstName} />}
            </Field>
            <Field label="Last name">
              {(props) => <Input {...props} name="lastName" autoComplete="off" defaultValue={values.lastName} />}
            </Field>
          </Row>
          <Field label="Email" error={errors.email}>
            {(props) => <Input {...props} type="email" name="email" autoComplete="off" defaultValue={values.email} />}
          </Field>
          <Field label="Join date" hint="Change it only for someone who joined earlier. It can’t be changed later.">
            {(props) => (
              <DatePicker {...props} value={values.joinedAt} max={today} onValueChange={(joinedAt) => setValues((v) => ({ ...v, joinedAt }))} />
            )}
          </Field>
          <Checkbox
            key={attempt}
            label="Send join emails"
            checked={joinEmails}
            onCheckedChange={(v) => setJoinEmails(v === true)}
          />
          {errors.form && <FormMessage role="alert">{errors.form}</FormMessage>}
          <Actions submit="Add member" />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** Many at once, from a pasted list (e.g. the ~60 complimentary Ride for Refuge members). */
export function AddManyDialog({
  open,
  onOpenChange,
  today,
  onDone,
}: DialogBase & { today: string; onDone: (message: string) => void }) {
  const [joinedAt, setJoinedAt] = React.useState(today);
  const [joinEmails, setJoinEmails] = React.useState(true);
  // A submitted form resets itself, and the checkbox would snap back to how it started. Remounting it on
  // each submit makes "how it started" the current choice.
  const [attempt, setAttempt] = React.useState(0);
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [summary, setSummary] = React.useState<AddMembersSummary>();

  async function submit(formData: FormData) {
    formData.set("joinedAt", joinedAt);
    setAttempt((n) => n + 1);
    formData.set("joinEmails", joinEmails ? "on" : "off");
    const result = await addMembers({ status: "idle" }, formData).catch(() => null);
    const s = result?.data;
    if (s && s.alreadyMembers.length === 0 && s.notEmails.length === 0) return onDone(`Added ${plural(s.added, "member")}`);
    setError(result?.fieldErrors?.members ?? (s ? undefined : SOMETHING_WENT_WRONG));
    setSummary(s);
    // Keep only the lines that need another look.
    if (s) setText(s.notEmails.join("\n"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Add members from a list</DialogTitle>
        <DialogDescription>One person per line: a name and email, or just an email.</DialogDescription>
        <Form action={submit} noValidate>
          {summary && (
            <p role="status">
              Added {plural(summary.added, "member")}.
              {summary.alreadyMembers.length > 0 && ` Already members: ${summary.alreadyMembers.join(", ")}.`}
              {summary.notEmails.length > 0 && " The lines below have no email address we can read. Fix them and add again."}
            </p>
          )}
          <Field label="Members" error={error}>
            {(props) => <Textarea {...props} name="members" rows={8} value={text} onChange={(e) => setText(e.target.value)} />}
          </Field>
          <Field label="Join date" hint="The same for everyone on the list.">
            {(props) => <DatePicker {...props} value={joinedAt} max={today} onValueChange={setJoinedAt} />}
          </Field>
          <Checkbox
            key={attempt}
            label="Send join emails"
            checked={joinEmails}
            onCheckedChange={(v) => setJoinEmails(v === true)}
          />
          <Actions submit="Add members" />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- membership ---------- */

export function MembershipEndDialog({
  open,
  onOpenChange,
  personId,
  joinedDay,
  endsAt: initial,
  onDone,
}: DialogBase & { personId: string; joinedDay: string; endsAt: string; onDone: (message: string) => void }) {
  const [endsAt, setEndsAt] = React.useState(initial);
  const [error, setError] = React.useState<string>();
  async function submit() {
    const result = await setMembershipEnd(personId, endsAt).catch(() => null);
    if (result?.status === "success") return onDone("Membership end date saved");
    setError(result?.fieldErrors?.endsAt ?? SOMETHING_WENT_WRONG);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Change membership end</DialogTitle>
        <DialogDescription>For a renewal, move it 12 months on.</DialogDescription>
        <Form action={submit} noValidate>
          <Field label="Membership ends" error={error}>
            {(props) => <DatePicker {...props} value={endsAt} min={joinedDay} onValueChange={setEndsAt} />}
          </Field>
          <Actions submit="Save changes" />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- notes ---------- */

export function NoteDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: DialogBase & { initial?: string; onSave: (body: string) => Promise<boolean> }) {
  const [text, setText] = React.useState(initial ?? "");
  const [error, setError] = React.useState<string>();
  async function submit() {
    if (!text.trim()) return setError("Write a note before saving.");
    if (!(await onSave(text.trim()))) setError(SOMETHING_WENT_WRONG);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{initial ? "Edit note" : "Add note"}</DialogTitle>
        <DialogDescription>Birthdays, family news, what they care about.</DialogDescription>
        <Form action={submit} noValidate>
          <Field label="Note" error={error}>
            {(props) => <Textarea {...props} rows={4} value={text} onChange={(e) => setText(e.target.value)} />}
          </Field>
          <Actions submit={initial ? "Save note" : "Add note"} />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- tags ---------- */

/** A tag picked from the list, or a new one typed in (created here). Null if creating failed. */
export async function tagIdFor(choice: CreatableComboboxValue): Promise<string | null> {
  if (choice.kind === "existing") return choice.value;
  const result = await createTag(choice.label.trim()).catch(() => null);
  return result?.data?.tagId ?? null;
}

export function TagPicker({
  tags,
  exclude = [],
  onChoose,
  ...props
}: {
  tags: TagSummary[];
  exclude?: string[];
  onChoose: (choice: CreatableComboboxValue | undefined) => void;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
}) {
  return (
    <CreatableCombobox
      {...props}
      options={tags.filter((t) => !exclude.includes(t.id)).map((t) => ({ value: t.id, label: t.name }))}
      existingFieldName="tagId"
      createFieldName="newTag"
      placeholder="Select or create a tag"
      searchPlaceholder="Select or create a tag"
      onValueChange={onChoose}
    />
  );
}

/**
 * Tags a set of people: the selected rows, everyone in a filtered list, or (with `byEmail`) pasted
 * emails, e.g. 15 event sign-ups.
 */
export function TagPeopleDialog({
  open,
  onOpenChange,
  count,
  byEmail,
  tags,
  isMemberEmail,
  onSave,
}: DialogBase & {
  count?: number;
  byEmail?: boolean;
  tags: TagSummary[];
  isMemberEmail: (email: string) => boolean;
  /** Resolves to an error message, or nothing when it worked. */
  onSave: (tagId: string, emails: string[]) => Promise<string | void>;
}) {
  const [choice, setChoice] = React.useState<CreatableComboboxValue>();
  const [emails, setEmails] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<{ tag?: string; emails?: string; form?: string }>({});
  const found = emails.filter(isMemberEmail);

  async function submit() {
    const next: typeof errors = {};
    if (!choice) next.tag = "Choose a tag or type a new one.";
    if (byEmail && !found.length) next.emails = "None of these emails belong to a member. Check them and try again.";
    setErrors(next);
    if (!choice || Object.keys(next).length) return;
    const tagId = await tagIdFor(choice);
    const problem = tagId ? await onSave(tagId, found) : SOMETHING_WENT_WRONG;
    if (problem) setErrors({ form: problem });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{byEmail ? "Tag members by email" : `Tag ${plural(count ?? 0, "member")}`}</DialogTitle>
        <Form action={submit} noValidate>
          {byEmail && (
            <Field
              label="Emails"
              hint={
                emails.length
                  ? `${found.length} of ${emails.length} are members`
                  : "Paste a column from a spreadsheet, or type them one at a time."
              }
              error={errors.emails}
            >
              {(props) => (
                <TagInput
                  {...props}
                  value={emails}
                  onValueChange={setEmails}
                  validate={(e) => (!normalizeEmail(e) ? "Not an email address" : isMemberEmail(e) ? undefined : "Not a member")}
                  copy={{ tagsLabel: "Emails entered" }}
                />
              )}
            </Field>
          )}
          <Field label="Tag" error={errors.tag}>
            {(props) => <TagPicker {...props} tags={tags} onChoose={setChoice} />}
          </Field>
          {errors.form && <FormMessage role="alert">{errors.form}</FormMessage>}
          <Actions submit="Add tag" />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- confirmations ---------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  onConfirm,
}: DialogBase & { title: string; description: string; confirm: string; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" $variant="danger" onClick={onConfirm}>
              {confirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}
