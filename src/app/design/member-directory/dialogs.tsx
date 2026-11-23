"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button, CancelButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { BellOff, CreditCard, MailX, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { TODAY, fullName, methodLabel, type Member, type PaymentMethod } from "./data";
import { useStateLab } from "../_state-lab/useStateLab";
import {
  BusyButton,
  DIALOG_NOT_APPLICABLE,
  LONG_EMAIL,
  LONG_NAME,
  LONG_NOTE,
  Lock,
  NO_CONFLICT,
  NO_ITEMS,
  SubmitActions,
  SubmitNote,
  useSubmit,
  useWhenOn,
} from "./DialogStates";
import { InlineAlert } from "./SheetStates";

/* ---------- shared layout ---------- */

/* The kit title already sets 16px to the body. */
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

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* Plain radio buttons, flush with the other fields: a circle and its label, no row padding or hover box. */
const Radios = styled(RadioGroup)`
  gap: var(--space-2);
`;

const RadioRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);

  & > label {
    margin-bottom: 0;
  }
`;

function PlainRadio({ value, label }: { value: string; label: string }) {
  const id = React.useId();
  return (
    <RadioRow>
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id}>{label}</Label>
    </RadioRow>
  );
}

/* Keeps a dialog the same size while its toggle switches: hidden fields keep their space. */
const methodOptions = (Object.keys(methodLabel) as PaymentMethod[]).map((k) => ({ value: k, label: methodLabel[k] }));

const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

interface DialogBase {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ---------- notes ---------- */

/** One running note per member, edited in place. Saving it empty clears it. */
export function NoteDialog({ open, onOpenChange, initial, onSave }: DialogBase & { initial?: string; onSave: (text: string) => void }) {
  const [text, setText] = React.useState(initial ?? "");
  const [serverError, setServerError] = React.useState<string>();
  const lab = useStateLab({ notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS] });
  const sub = useSubmit(lab, {
    message: "Someone else edited this note while you were typing. Their version is “Called on 12 March and confirmed the new address.”",
    useTheirs: () => setText("Called on 12 March and confirmed the new address."),
  });
  useWhenOn(lab.longText, () => setText(LONG_NOTE));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{initial ? "Edit note" : "Add note"}</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (sub.busy) return;
            if (lab.validationError) return setServerError("We couldn't accept this note. Shorten it and try again.");
            setServerError(undefined);
            sub.run(() => onSave(text.trim()));
          }}
        >
          <Lock disabled={sub.busy}>
            <Field label="Note" error={serverError}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={10}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              )}
            </Field>
          </Lock>
          <SubmitNote submit={sub} />
          <SubmitActions submit={initial ? "Save note" : "Add note"} icon={initial ? Pencil : Plus} state={sub} />
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
  const [amount, setAmount] = React.useState(initial ? String(initial.amount) : member.payments[0] ? String(member.payments[0].amount) : "");
  const [date, setDate] = React.useState(initial?.date ?? TODAY);
  const [method, setMethod] = React.useState<PaymentMethod>(initial?.method ?? "etransfer");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [forWhom, setForWhom] = React.useState<"own" | "other">("own");
  const [forId, setForId] = React.useState("");
  const [errors, setErrors] = React.useState<{ amount?: string; date?: string; forId?: string }>({});
  const lab = useStateLab({ notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS, ...(editing ? [] : NO_CONFLICT)] });
  const sub = useSubmit(
    lab,
    editing
      ? {
          message: "Another admin changed this payment's amount to 30 while you were editing",
          useTheirs: () => {
            setAmount("30");
            setErrors({});
          },
        }
      : undefined,
  );
  useWhenOn(lab.longText, () => setNote(LONG_NOTE));
  const others = people.filter((p) => p.id !== member.id).map((p) => ({ value: p.id, label: fullName(p) }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{editing ? "Edit payment" : "Record payment"}</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (sub.busy) return;
            const next: typeof errors = {};
            if (!(Number(amount) > 0)) next.amount = "Enter an amount, for example 25";
            if (!date || date > TODAY) next.date = "Choose today or an earlier date";
            if (!editing && forWhom === "other" && !forId) next.forId = "Choose who this payment is for";
            if (!Object.keys(next).length && lab.validationError) next.amount = "We couldn't accept this amount. Check it and try again.";
            setErrors(next);
            if (Object.keys(next).length) return;
            sub.run(() => onSave({ amount: Number(amount), date, method, note: note.trim(), forId: forWhom === "other" ? forId : undefined }));
          }}
        >
          <Lock disabled={sub.busy}>
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
            <Radios value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} aria-labelledby="payment-method">
              {methodOptions.map((o) => (
                <PlainRadio key={o.value} value={o.value} label={o.label} />
              ))}
            </Radios>
          </Stack>
          {!editing && (
            <Stack>
              <Label id="pays-for">This pays for</Label>
              <Radios value={forWhom} onValueChange={(v) => setForWhom(v as "own" | "other")} aria-labelledby="pays-for">
                <PlainRadio value="own" label="Their own membership" />
                <PlainRadio value="other" label="Someone else's (gifted membership)" />
              </Radios>
            </Stack>
          )}
          {!editing && forWhom === "other" && (
            <Field label="Who it's for" error={errors.forId}>
              {(props) => <Select {...props} options={others} value={forId} onValueChange={setForId} placeholder="Choose a person" />}
            </Field>
          )}
          <Field label="Note">{(props) => <Input {...props} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
          </Lock>
          <SubmitNote submit={sub} />
          {editing ? (
            <SubmitActions
              submit="Save changes"
              icon={Pencil}
              state={sub}
              beforeSubmit={
                <Button type="button" $variant="danger-secondary" onClick={sub.busy ? undefined : onDelete}>
                  <Icon icon={Trash2} size={16} />
                  Delete payment
                </Button>
              }
            />
          ) : (
            <SubmitActions submit="Record payment" icon={Plus} state={sub} />
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
  const lab = useStateLab({
    notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS],
    actions: [{ id: "duplicate-email", label: "Email already in use", description: "The server says someone else has this email." }],
  });
  const sub = useSubmit(lab, {
    message: "Another admin changed this person's email to updated.contact@example.org while you were editing",
    useTheirs: () => {
      setD((cur) => ({ ...cur, email: "updated.contact@example.org" }));
      setErrors({});
    },
  });
  useWhenOn(lab.longText, () => setD({ firstName: LONG_NAME, lastName: LONG_NAME, email: LONG_EMAIL }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit person</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (sub.busy) return;
            const next: typeof errors = {};
            if (!d.firstName.trim()) next.firstName = "Enter a first name";
            if (!validEmail(d.email)) next.email = "Enter an email like name@example.com";
            else if (emailTaken(d.email) || lab.is("duplicate-email")) next.email = "Someone else already uses this email";
            else if (lab.validationError) next.email = "We couldn't accept this email. Check it and try again.";
            setErrors(next);
            if (!Object.keys(next).length)
              sub.run(() => onSave({ ...d, firstName: d.firstName.trim(), lastName: d.lastName.trim(), email: d.email.trim() }));
          }}
        >
          <Lock disabled={sub.busy}>
            <Row>
              <Field label="First name" error={errors.firstName}>{(props) => <Input {...props} value={d.firstName} onChange={set("firstName")} />}</Field>
              <Field label="Last name">{(props) => <Input {...props} value={d.lastName} onChange={set("lastName")} />}</Field>
            </Row>
            <Field label="Email" error={errors.email}>{(props) => <Input {...props} type="email" value={d.email} onChange={set("email")} />}</Field>
          </Lock>
          <SubmitNote submit={sub} />
          <SubmitActions submit="Save changes" icon={Pencil} state={sub} />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export interface NewMemberDraft extends PersonDraft {
  /** A first payment to record, if there is one. */
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
  title = "Add person",
  submit = "Add person",
}: DialogBase & { emailTaken: (email: string) => boolean; onSave: (draft: NewMemberDraft) => void; title?: string; submit?: string }) {
  const gift = title !== "Add person";
  const [d, setD] = React.useState({ firstName: "", lastName: "", email: "", amount: gift ? "25" : "" });
  const [method, setMethod] = React.useState<PaymentMethod>("etransfer");
  const [joinedAt, setJoinedAt] = React.useState(TODAY);
  const [joinEmails, setJoinEmails] = React.useState(true);
  const [errors, setErrors] = React.useState<{ firstName?: string; email?: string; amount?: string }>({});
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value });
  const paid = gift || d.amount.trim() !== "";
  const lab = useStateLab({
    notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS, ...NO_CONFLICT],
    actions: [{ id: "duplicate-email", label: "Email already in use", description: "The server says this person is already in the directory." }],
  });
  const sub = useSubmit(lab);
  useWhenOn(lab.longText, () => setD((cur) => ({ ...cur, firstName: LONG_NAME, lastName: LONG_NAME, email: LONG_EMAIL })));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (sub.busy) return;
            const next: typeof errors = {};
            if (!d.firstName.trim()) next.firstName = "Enter a first name";
            if (!validEmail(d.email)) next.email = "Enter an email like name@example.com";
            else if (emailTaken(d.email) || lab.is("duplicate-email")) next.email = "This person is already added";
            else if (lab.validationError) next.email = "We couldn't accept this email. Check it and try again.";
            if (paid && !(Number(d.amount) > 0)) next.amount = gift ? "Enter an amount, for example 25" : "Enter an amount, for example 25, or leave it blank";
            setErrors(next);
            if (Object.keys(next).length) return;
            sub.run(() =>
              onSave({
              firstName: d.firstName.trim(),
              lastName: d.lastName.trim(),
              email: d.email.trim(),
              amount: paid ? Number(d.amount) : undefined,
              method,
              joinedAt,
              joinEmails,
              }),
            );
          }}
        >
          <Lock disabled={sub.busy}>
          <Row>
            <Field label="First name" error={errors.firstName}>{(props) => <Input {...props} value={d.firstName} onChange={set("firstName")} />}</Field>
            <Field label="Last name">{(props) => <Input {...props} value={d.lastName} onChange={set("lastName")} />}</Field>
          </Row>
          <Field label="Email" error={errors.email}>{(props) => <Input {...props} type="email" value={d.email} onChange={set("email")} />}</Field>
          <Row>
              <Field label={gift ? "Amount" : "First payment"} hint={gift ? undefined : "Optional"} error={errors.amount}>
                {(props) => <Input {...props} inputMode="decimal" value={d.amount} onChange={set("amount")} />}
              </Field>
              <Field label="Paid by">
                {(props) => <Select {...props} options={methodOptions} value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} />}
              </Field>
          </Row>
          {!gift && (
            <Field label="Join date">
              {(props) => <DatePicker {...props} value={joinedAt} max={TODAY} onValueChange={setJoinedAt} />}
            </Field>
          )}
          <Checkbox label="Send join emails" checked={joinEmails} onCheckedChange={(v) => setJoinEmails(v === true)} />
          </Lock>
          <SubmitNote submit={sub} />
          <SubmitActions submit={submit} icon={Plus} state={sub} />
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- confirmations ---------- */

const WrapTitle = styled(AlertDialogTitle)`
  overflow-wrap: anywhere;
`;

const WrapDescription = styled(AlertDialogDescription)`
  overflow-wrap: anywhere;
`;

const Gap = styled.div`
  margin-top: var(--space-4);
`;

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  icon = Trash2,
  onConfirm,
}: DialogBase & {
  title: string;
  description: string;
  confirm: string;
  /** The icon of the button that asked for this; every Delete confirm carries Trash2. */
  icon?: LucideIcon;
  onConfirm: () => void;
}) {
  const lab = useStateLab({ notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS, ...NO_CONFLICT, "validationError"] });
  const sub = useSubmit(lab);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          // Focus the dialog itself, not a button: nothing looks pre-chosen and Enter can't delete by accident.
          // Tab reaches Cancel first; Escape closes.
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        <WrapTitle>{title}</WrapTitle>
        <WrapDescription>{lab.longText ? `${description} (${LONG_EMAIL})` : description}</WrapDescription>
        {sub.phase === "error" && (
          <Gap>
            <SubmitNote submit={sub} />
          </Gap>
        )}
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <CancelButton />
          </AlertDialogCancel>
          <BusyButton type="button" $variant="danger" icon={icon} busy={sub.busy} onClick={() => sub.run(onConfirm)}>
            {confirm}
          </BusyButton>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- deleting people ---------- */

/** Someone with a membership they pay for: recorded payments from them, and not cancelled. Deleting them stops those payments. */
export const isPaying = (m: Member) => !m.cancelledAt && m.payments.length > 0;

/* The words typed to delete anyone who pays. Compared without case or outer spaces. */
const ACK = "I understand";

const Consequences = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-3) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);

  & > li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
  }
  & > li > svg {
    flex: none;
    margin-top: calc((1lh - 16px) / 2);
  }
`;

const DeleteBody = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

/**
 * Deleting people says what else happens: their emails stop and nobody tells them. When anyone being deleted pays for a
 * membership, a warning names them, their payments stop for good (no Undo), and the delete needs "I understand" typed.
 */
export function DeletePeopleDialog({
  open,
  onOpenChange,
  people,
  onConfirm,
}: DialogBase & { people: Member[]; onConfirm: () => void }) {
  const lab = useStateLab({ notApplicable: [...DIALOG_NOT_APPLICABLE, ...NO_ITEMS, ...NO_CONFLICT] });
  const sub = useSubmit(lab);
  const [typed, setTyped] = React.useState("");
  const [missed, setMissed] = React.useState(false);
  const one = people.length === 1;
  const paying = people.filter(isPaying);
  const needsAck = paying.length > 0;
  const acked = typed.trim().toLowerCase() === ACK.toLowerCase();

  /* "Abdi Kalinowski, Abdi Sahota and 4 more": up to three names, enough to recognise the group. */
  const listOf = (list: Member[]) => {
    const shown = list.slice(0, 3).map(fullName);
    const rest = list.length - shown.length;
    if (rest > 0) return `${shown.join(", ")} and ${rest} more`;
    return shown.length > 1 ? `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}` : shown[0];
  };
  const whoPays = one
    ? `${fullName(people[0])} pays`
    : paying.length === people.length
      ? paying.length === 2
        ? "Both pay"
        : `All ${paying.length} pay`
      : `${listOf(paying)} ${paying.length === 1 ? "pays" : "pay"}`;
  const payingText = `${whoPays} for a membership. Their payments will be cancelled for good, so you won't receive any more from them.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          // The dialog itself takes focus, not a button, so nothing looks pre-chosen. Tab reaches the first control.
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        <WrapTitle>{one ? `Delete ${fullName(people[0])}?` : `Delete ${people.length} people?`}</WrapTitle>
        <WrapDescription>
          {one ? "Their payments, note and activity will be deleted too" : `${listOf(people)} will be deleted with their payments, notes and activity`}
        </WrapDescription>
        <Consequences>
          <li>
            <Icon icon={MailX} size={16} />
            <span>Emails to them stop, including automatic ones</span>
          </li>
          <li>
            <Icon icon={BellOff} size={16} />
            <span>They aren&apos;t notified, so tell them yourself if needed</span>
          </li>
        </Consequences>
        <DeleteBody
          onSubmit={(e) => {
            e.preventDefault();
            if (needsAck && !acked) {
              setMissed(true);
              return;
            }
            sub.run(onConfirm);
          }}
        >
          {needsAck && (
            <>
              <InlineAlert tone="danger" icon={CreditCard}>
                {payingText}
              </InlineAlert>
              <Field label={`To confirm, type "${ACK}"`} error={missed && !acked ? `Type "${ACK}" to delete` : undefined}>
                {(props) => (
                <Input
                  {...props}
                  value={typed}
                  placeholder={ACK}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => {
                    setTyped(e.target.value);
                    if (missed) setMissed(false);
                  }}
                />
                )}
              </Field>
            </>
          )}
          {sub.phase === "error" && <SubmitNote submit={sub} />}
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <CancelButton />
            </AlertDialogCancel>
            <BusyButton type="submit" $variant="danger" icon={Trash2} busy={sub.busy}>
              {one ? "Delete person" : `Delete ${people.length} people`}
            </BusyButton>
          </AlertDialogActions>
        </DeleteBody>
      </AlertDialogContent>
    </AlertDialog>
  );
}
