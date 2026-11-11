"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { TagInput } from "@/components/ui/TagInput";
import { Textarea } from "@/components/ui/Textarea";
import { ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { TODAY, addMonths, fullName, methodLabel, type Member, type MembershipKind, type PaymentMethod, type TagColor } from "./data";
import { OptionToggle, PillToggle } from "./PillToggle";
import { TagPicker } from "./TagPicker";

/* ---------- shared layout ---------- */

/* 16px under the popup title. It collapses with the title's own 4px margin rather than adding to it. */
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* Keeps a dialog the same size while its toggle switches: hidden fields keep their space. */
const Reserve = styled.div<{ $shown: boolean }>`
  visibility: ${({ $shown }) => ($shown ? "visible" : "hidden")};
`;

/* Destructive action on the left, Cancel and Save on the right. */
const SplitActions = styled(DialogActions)`
  & > :first-child {
    margin-right: auto;
  }
`;

const methodOptions = (Object.keys(methodLabel) as PaymentMethod[]).map((k) => ({ value: k, label: methodLabel[k] }));

const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

function Actions({ submit }: { submit: string }) {
  return (
    <DialogActions>
      <DialogClose asChild>
        <Button type="button" $variant="secondary">
          Cancel
        </Button>
      </DialogClose>
      <Button type="submit">{submit}</Button>
    </DialogActions>
  );
}

interface DialogBase {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ---------- notes ---------- */

/** One running note per member, edited in place. Saving it empty clears it. */
export function NoteDialog({ open, onOpenChange, initial, onSave }: DialogBase & { initial?: string; onSave: (text: string) => void }) {
  const [text, setText] = React.useState(initial ?? "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{initial ? "Edit note" : "Add note"}</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(text.trim());
          }}
        >
          <Field label="Note">
            {(props) => (
              <Textarea
                {...props}
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}
          </Field>
          <Actions submit={initial ? "Save note" : "Add note"} />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- membership ---------- */

const kindToggle: [Exclude<MembershipKind, "gifted">, string][] = [
  ["paid", "Paid"],
  ["complimentary", "Complimentary"],
  ["sponsored", "Sponsored"],
];

export function ChangeMembershipDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: DialogBase & { member: Member; onSave: (next: { kind: MembershipKind; amount?: number; endsAt: string }) => void }) {
  const [kind, setKind] = React.useState<MembershipKind>(member.kind === "gifted" ? "paid" : member.kind);
  const [amount, setAmount] = React.useState(member.amount ? String(member.amount) : "");
  const [method, setMethod] = React.useState<PaymentMethod>("etransfer");
  const [endsAt, setEndsAt] = React.useState(member.endsAt);
  const [error, setError] = React.useState<string>();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Change membership</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (kind === "paid" && !(Number(amount) > 0)) return setError("Enter the yearly amount, for example 25.");
            onSave({ kind, amount: kind === "paid" ? Number(amount) : undefined, endsAt });
          }}
        >
          <PillToggle type="single" value={kind} onValueChange={(v) => v && setKind(v as MembershipKind)} aria-label="Membership type">
            {kindToggle.map(([value, label]) => (
              <ToggleGroupItem key={value} value={value}>
                {label}
              </ToggleGroupItem>
            ))}
          </PillToggle>
          <Field label="Ends">{(props) => <DatePicker {...props} value={endsAt} onValueChange={setEndsAt} />}</Field>
          {kind === "paid" && (
            <Row>
              <Field label="Amount" error={error}>
                {(props) => <Input {...props} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}
              </Field>
              <Field label="Paid by">
                {(props) => <Select {...props} options={methodOptions} value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} />}
              </Field>
            </Row>
          )}
          <Actions submit="Save changes" />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- payments ---------- */

export interface PaymentDraft {
  amount: number;
  date: string;
  method: PaymentMethod;
  note: string;
  forId?: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  member,
  people,
  initial,
  onSave,
  onDelete,
}: DialogBase & {
  member: Member;
  people: Member[];
  initial?: PaymentDraft;
  onSave: (draft: PaymentDraft) => void;
  onDelete?: () => void;
}) {
  const editing = Boolean(initial);
  const [amount, setAmount] = React.useState(initial ? String(initial.amount) : member.amount ? String(member.amount) : "");
  const [date, setDate] = React.useState(initial?.date ?? TODAY);
  const [method, setMethod] = React.useState<PaymentMethod>(initial?.method ?? "etransfer");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [forWhom, setForWhom] = React.useState<"own" | "other">("own");
  const [forId, setForId] = React.useState("");
  const [errors, setErrors] = React.useState<{ amount?: string; date?: string; forId?: string }>({});
  const others = people.filter((p) => p.id !== member.id).map((p) => ({ value: p.id, label: fullName(p) }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{editing ? "Edit payment" : "Record payment"}</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const next: typeof errors = {};
            if (!(Number(amount) > 0)) next.amount = "Enter an amount, for example 25.";
            if (!date || date > TODAY) next.date = "Choose today or an earlier date.";
            if (!editing && forWhom === "other" && !forId) next.forId = "Choose who this payment is for.";
            setErrors(next);
            if (Object.keys(next).length) return;
            onSave({ amount: Number(amount), date, method, note: note.trim(), forId: forWhom === "other" ? forId : undefined });
          }}
        >
          <Row>
            <Field label="Amount" error={errors.amount}>
              {(props) => <Input {...props} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}
            </Field>
            <Field label="Date" error={errors.date}>
              {(props) => <DatePicker {...props} value={date} max={TODAY} onValueChange={setDate} />}
            </Field>
          </Row>
          <Stack>
            <Label id="payment-method">Method</Label>
            <OptionToggle type="single" value={method} onValueChange={(v) => v && setMethod(v as PaymentMethod)} aria-labelledby="payment-method">
              {methodOptions.map((o) => (
                <ToggleGroupItem key={o.value} value={o.value}>
                  {o.label}
                </ToggleGroupItem>
              ))}
            </OptionToggle>
          </Stack>
          {!editing && (
            <Stack>
              <Label id="pays-for">This pays for</Label>
              <OptionToggle type="single" value={forWhom} onValueChange={(v) => v && setForWhom(v as "own" | "other")} aria-labelledby="pays-for">
                <ToggleGroupItem value="own">Their own membership</ToggleGroupItem>
                <ToggleGroupItem value="other">Someone else&apos;s</ToggleGroupItem>
              </OptionToggle>
            </Stack>
          )}
          {!editing && forWhom === "other" && (
            <Field label="Who it's for" error={errors.forId}>
              {(props) => <Select {...props} options={others} value={forId} onValueChange={setForId} placeholder="Choose a person" />}
            </Field>
          )}
          <Field label="Note">{(props) => <Input {...props} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
          {editing ? (
            <SplitActions>
              <Button type="button" $variant="ghost" onClick={onDelete}>
                Delete payment
              </Button>
              <DialogClose asChild>
                <Button type="button" $variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </SplitActions>
          ) : (
            <Actions submit="Record payment" />
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- people ---------- */

export interface PersonDraft {
  firstName: string;
  lastName: string;
  email: string;
}

export function EditDetailsDialog({
  open,
  onOpenChange,
  member,
  emailTaken,
  onSave,
}: DialogBase & { member: Member; emailTaken: (email: string) => boolean; onSave: (draft: PersonDraft) => void }) {
  const [d, setD] = React.useState<PersonDraft>({ firstName: member.firstName, lastName: member.lastName, email: member.email });
  const [errors, setErrors] = React.useState<{ firstName?: string; email?: string }>({});
  const set = (k: keyof PersonDraft) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit details</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const next: typeof errors = {};
            if (!d.firstName.trim()) next.firstName = "Enter a first name.";
            if (!validEmail(d.email)) next.email = "Enter an email like name@example.com.";
            else if (emailTaken(d.email)) next.email = "Someone else in the directory uses this email.";
            setErrors(next);
            if (!Object.keys(next).length) onSave({ ...d, firstName: d.firstName.trim(), lastName: d.lastName.trim(), email: d.email.trim() });
          }}
        >
          <Row>
            <Field label="First name" error={errors.firstName}>{(props) => <Input {...props} value={d.firstName} onChange={set("firstName")} />}</Field>
            <Field label="Last name">{(props) => <Input {...props} value={d.lastName} onChange={set("lastName")} />}</Field>
          </Row>
          <Field label="Email" error={errors.email}>{(props) => <Input {...props} type="email" value={d.email} onChange={set("email")} />}</Field>
          <Actions submit="Save changes" />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export interface NewMemberDraft extends PersonDraft {
  kind: MembershipKind;
  amount?: number;
  method: PaymentMethod;
  joinedAt: string;
  joinEmails: boolean;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  emailTaken,
  onSave,
  title = "Add member",
  submit = "Add member",
}: DialogBase & { emailTaken: (email: string) => boolean; onSave: (draft: NewMemberDraft) => void; title?: string; submit?: string }) {
  const gift = title !== "Add member";
  const [d, setD] = React.useState({ firstName: "", lastName: "", email: "", amount: "25" });
  const [kind, setKind] = React.useState<MembershipKind>("paid");
  const [method, setMethod] = React.useState<PaymentMethod>("etransfer");
  const [joinedAt, setJoinedAt] = React.useState(TODAY);
  const [joinEmails, setJoinEmails] = React.useState(true);
  const [errors, setErrors] = React.useState<{ firstName?: string; email?: string; amount?: string }>({});
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value });
  const paid = gift || kind === "paid";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const next: typeof errors = {};
            if (!d.firstName.trim()) next.firstName = "Enter a first name.";
            if (!validEmail(d.email)) next.email = "Enter an email like name@example.com.";
            else if (emailTaken(d.email)) next.email = "This person is already in the directory.";
            if (paid && !(Number(d.amount) > 0)) next.amount = "Enter an amount, for example 25.";
            setErrors(next);
            if (Object.keys(next).length) return;
            onSave({
              firstName: d.firstName.trim(),
              lastName: d.lastName.trim(),
              email: d.email.trim(),
              kind: gift ? "gifted" : kind,
              amount: paid ? Number(d.amount) : undefined,
              method,
              joinedAt,
              joinEmails,
            });
          }}
        >
          <Row>
            <Field label="First name" error={errors.firstName}>{(props) => <Input {...props} value={d.firstName} onChange={set("firstName")} />}</Field>
            <Field label="Last name">{(props) => <Input {...props} value={d.lastName} onChange={set("lastName")} />}</Field>
          </Row>
          <Field label="Email" error={errors.email}>{(props) => <Input {...props} type="email" value={d.email} onChange={set("email")} />}</Field>
          {!gift && (
            <PillToggle type="single" value={kind} onValueChange={(v) => v && setKind(v as MembershipKind)} aria-label="Membership type">
              {kindToggle.map(([value, label]) => (
                <ToggleGroupItem key={value} value={value}>
                  {label}
                </ToggleGroupItem>
              ))}
            </PillToggle>
          )}
          <Reserve $shown={paid} inert={!paid}>
            <Row>
              <Field label="Amount" error={errors.amount}>
                {(props) => <Input {...props} inputMode="decimal" value={d.amount} onChange={set("amount")} />}
              </Field>
              <Field label="Paid by">
                {(props) => <Select {...props} options={methodOptions} value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} />}
              </Field>
            </Row>
          </Reserve>
          {!gift && (
            <Field label="Join date">
              {(props) => <DatePicker {...props} value={joinedAt} max={TODAY} onValueChange={setJoinedAt} />}
            </Field>
          )}
          <Checkbox label="Send join emails" checked={joinEmails} onCheckedChange={(v) => setJoinEmails(v === true)} />
          <Actions submit={submit} />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** Ends 12 months after the join date. */
export const defaultEnd = (joinedAt: string) => addMonths(joinedAt, 12);

/* ---------- tags ---------- */

/** Tags a set of people. With `pasteEmails`, the admin pastes the emails instead (e.g. 15 event sign-ups). */
export function TagPeopleDialog({
  open,
  onOpenChange,
  count,
  pasteEmails,
  allTags,
  tagColors,
  findByEmail,
  onSave,
}: DialogBase & {
  count?: number;
  pasteEmails?: boolean;
  allTags: string[];
  tagColors: Record<string, TagColor>;
  findByEmail: (email: string) => Member | undefined;
  onSave: (tags: string[], people?: Member[]) => void;
}) {
  const [tags, setTags] = React.useState<string[]>([]);
  const [emails, setEmails] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<{ tag?: string; emails?: string }>({});
  const found = emails.map(findByEmail).filter((m): m is Member => Boolean(m));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{pasteEmails ? "Tag people by email" : `Tag ${count === 1 ? "1 person" : `${count} people`}`}</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const next: typeof errors = {};
            if (!tags.length) next.tag = "Choose a tag or type a new one.";
            if (pasteEmails && !found.length) next.emails = "None of these emails are in the directory. Check them and try again.";
            setErrors(next);
            if (!Object.keys(next).length) onSave(tags, pasteEmails ? found : undefined);
          }}
        >
          {pasteEmails && (
            <Field
              label="Emails"
              hint={emails.length ? `${found.length} of ${emails.length} found in the directory` : undefined}
              error={errors.emails}
            >
              {(props) => (
                <TagInput
                  {...props}
                  value={emails}
                  onValueChange={setEmails}
                  validate={(e) => (!validEmail(e) ? "Not an email address" : findByEmail(e) ? undefined : "Not in the directory")}
                  copy={{ tagsLabel: "Emails entered" }}
                />
              )}
            </Field>
          )}
          <Field label="Tags" error={errors.tag}>
            {(props) => (
              <TagPicker
                label="Tags"
                value={tags}
                options={allTags}
                colors={tagColors}
                onValueChange={(next) => {
                  setTags(next);
                  if (next.length) setErrors((e) => ({ ...e, tag: undefined }));
                }}
                placeholder="Select or create a tag"
                createLabel={(q) => `Create “${q}”`}
                aria-describedby={props["aria-describedby"]}
                aria-invalid={props["aria-invalid"]}
              />
            )}
          </Field>
          <Actions submit={tags.length > 1 ? "Add tags" : "Add tag"} />
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
