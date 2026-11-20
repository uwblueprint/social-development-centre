"use client";

import { useActionState, useRef, useState } from "react";
import { CircleAlert, ReceiptText } from "lucide-react";
import { styled } from "next-yak";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Table, type TableColumn } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { FormError } from "@/features/auth/AuthScreen";
import { formatDate } from "@/lib/date";
import { fieldError, idleState, type ActionState } from "@/lib/forms";
import { assignPayment, cancelMemberSubscription } from "./actions";
import { adminCopy } from "./copy";
import { formatMoney, type MemberPaymentRow, type PaymentStatus, type UnmatchedPayment } from "./types";

/**
 * Admin → Payments: every member's payment status, and PayPal payments we couldn't link to anyone.
 * The data comes from PayPal's webhooks; nothing here talks to PayPal except Cancel.
 */
export function PaymentsPage({ members, unmatched }: { members: MemberPaymentRow[]; unmatched: UnmatchedPayment[] }) {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState<MemberPaymentRow | null>(null);
  const [assigning, setAssigning] = useState<UnmatchedPayment | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    if (opener.current?.isConnected) opener.current.focus();
    else document.querySelector<HTMLElement>("h1")?.focus();
  };

  const cancelButton = (m: MemberPaymentRow) =>
    // Nothing to cancel yet: "none" never started, "pending" is still on PayPal's approval page.
    m.status === "none" || m.status === "pending" ? null : (
      <Button
        type="button"
        $variant="outline"
        $size="sm"
        aria-label={adminCopy.cancelAccessible(m.name ?? m.email)}
        onClick={(event) => {
          opener.current = event.currentTarget;
          setCancelling(m);
        }}
      >
        {adminCopy.cancelButton}
      </Button>
    );

  const assignButton = (p: UnmatchedPayment) => (
    <Button
      type="button"
      $variant="outline"
      $size="sm"
      aria-label={adminCopy.assignAccessible(formatMoney(p.amountCents, p.currency), formatDate(p.paidAt))}
      onClick={(event) => {
        opener.current = event.currentTarget;
        setAssigning(p);
      }}
    >
      {adminCopy.assignButton}
    </Button>
  );

  const memberColumns: TableColumn<MemberPaymentRow>[] = [
    { key: "name", header: "Name", render: (m) => m.name ?? "No name" },
    { key: "email", header: "Email", render: (m) => m.email },
    { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} /> },
    {
      key: "last",
      header: "Last paid",
      render: lastPaid,
    },
    {
      key: "year",
      header: "Paid this year",
      render: (m) => (m.currency ? formatMoney(m.paidThisYearCents, m.currency) : "—"),
    },
    { key: "next", header: "Next payment", render: (m) => (m.nextBillingAt ? formatDate(m.nextBillingAt) : "—") },
    {
      key: "actions",
      header: <VisuallyHidden>Actions</VisuallyHidden>,
      width: "120px",
      render: (m) => <Actions>{cancelButton(m)}</Actions>,
    },
  ];

  const unmatchedColumns: TableColumn<UnmatchedPayment>[] = [
    { key: "date", header: "Date", render: (p) => formatDate(p.paidAt) },
    { key: "amount", header: "Amount", render: (p) => formatMoney(p.amountCents, p.currency) },
    { key: "payer", header: "Paid by", render: (p) => p.payerEmail ?? "Unknown" },
    { key: "ref", header: "PayPal ID", render: (p) => p.paypalTransactionId },
    {
      key: "actions",
      header: <VisuallyHidden>Actions</VisuallyHidden>,
      width: "120px",
      render: (p) => <Actions>{assignButton(p)}</Actions>,
    },
  ];

  return (
    <ListPage>
      <ListPageHeader title={adminCopy.pageTitle} />

      <Section aria-labelledby="payments-members">
        <SectionTitle id="payments-members">{adminCopy.membersHeading}</SectionTitle>
        <DesktopOnly>
          <Table
            columns={memberColumns}
            rows={members}
            getRowId={(m) => m.personId}
            aria-label={adminCopy.membersHeading}
            empty={<EmptyState icon={ReceiptText} title={adminCopy.noMembers} />}
          />
        </DesktopOnly>
        <MobileOnly aria-label={adminCopy.membersHeading}>
          {members.length === 0 && (
            <MobileRow>
              <EmptyState icon={ReceiptText} title={adminCopy.noMembers} />
            </MobileRow>
          )}
          {members.map((m) => (
            <MobileRow key={m.personId}>
              <MobileText>
                <span>{m.name ?? "No name"}</span>
                <MutedText>{m.email}</MutedText>
                <span>
                  <StatusBadge status={m.status} />
                </span>
                <MutedText>Last paid: {lastPaid(m)}</MutedText>
                {m.nextBillingAt && <MutedText>Next payment: {formatDate(m.nextBillingAt)}</MutedText>}
              </MobileText>
              {cancelButton(m)}
            </MobileRow>
          ))}
        </MobileOnly>
      </Section>

      <Section aria-labelledby="payments-unmatched">
        <SectionTitle id="payments-unmatched">{adminCopy.unmatchedHeading}</SectionTitle>
        <Muted>{adminCopy.unmatchedIntro}</Muted>
        <DesktopOnly>
          <Table
            columns={unmatchedColumns}
            rows={unmatched}
            getRowId={(p) => p.id}
            aria-label={adminCopy.unmatchedHeading}
            empty={<EmptyState icon={ReceiptText} title={adminCopy.noUnmatched} />}
          />
        </DesktopOnly>
        <MobileOnly aria-label={adminCopy.unmatchedHeading}>
          {unmatched.length === 0 && (
            <MobileRow>
              <EmptyState icon={ReceiptText} title={adminCopy.noUnmatched} />
            </MobileRow>
          )}
          {unmatched.map((p) => (
            <MobileRow key={p.id}>
              <MobileText>
                <span>
                  {formatMoney(p.amountCents, p.currency)} on {formatDate(p.paidAt)}
                </span>
                <MutedText>{p.payerEmail ?? "Unknown"}</MutedText>
                <MutedText>PayPal ID: {p.paypalTransactionId}</MutedText>
              </MobileText>
              {assignButton(p)}
            </MobileRow>
          ))}
        </MobileOnly>
      </Section>

      <AlertDialog open={cancelling !== null} onOpenChange={(open) => !open && setCancelling(null)}>
        <AlertDialogContent onCloseAutoFocus={restoreFocus}>
          {cancelling && (
            <CancelForm
              key={cancelling.personId}
              member={cancelling}
              onDone={() => {
                toast({ title: adminCopy.cancelDone(cancelling.name ?? cancelling.email) });
                setCancelling(null);
              }}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={assigning !== null} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent onCloseAutoFocus={restoreFocus}>
          {assigning && (
            <AssignForm
              key={assigning.id}
              payment={assigning}
              members={members}
              onDone={(message) => {
                toast({ title: message });
                setAssigning(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </ListPage>
  );
}

function lastPaid(m: MemberPaymentRow): string {
  return m.lastPaidAt && m.lastAmountCents !== null && m.currency
    ? `${formatMoney(m.lastAmountCents, m.currency)} on ${formatDate(m.lastPaidAt)}`
    : "Never";
}

/** Text on every badge, so the status never rides on color alone. */
function StatusBadge({ status }: { status: PaymentStatus }) {
  const variant = (
    {
      none: "neutral",
      pending: "info",
      active: "success",
      payment_problem: "warning",
      suspended: "danger",
      cancelled: "neutral",
    } as const
  )[status];
  return <Badge $variant={variant}>{adminCopy.status[status]}</Badge>;
}

/** Mounted only while the dialog is open, so a failed attempt's error is gone when it reopens. */
function CancelForm({ member, onDone }: { member: MemberPaymentRow; onDone: () => void }) {
  const [state, formAction] = useActionState(async () => {
    const result = await cancelMemberSubscription(member.personId);
    if (result.status === "success") onDone();
    return result;
  }, idleState);

  return (
    <form action={formAction}>
      <AlertDialogTitle>{adminCopy.cancelTitle(member.name ?? member.email)}</AlertDialogTitle>
      <AlertDialogDescription>{adminCopy.cancelDescription}</AlertDialogDescription>
      <ErrorMessage state={state} />
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button type="button" $variant="secondary">
            {adminCopy.cancelKeep}
          </Button>
        </AlertDialogCancel>
        <SubmitButton $variant="danger">{adminCopy.cancelConfirm}</SubmitButton>
      </AlertDialogActions>
    </form>
  );
}

function AssignForm({
  payment,
  members,
  onDone,
}: {
  payment: UnmatchedPayment;
  members: MemberPaymentRow[];
  onDone: (message: string) => void;
}) {
  const [state, formAction] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await assignPayment(payment.id, prev, formData);
    if (result.status === "success") onDone(result.message ?? adminCopy.assignDone);
    return result;
  }, idleState);

  const options = members.map((m) => ({ value: m.personId, label: m.name ? `${m.name} (${m.email})` : m.email }));

  return (
    <form action={formAction} noValidate>
      <DialogTitle>{adminCopy.assignTitle}</DialogTitle>
      <DialogDescription>
        {formatMoney(payment.amountCents, payment.currency)} on {formatDate(payment.paidAt)}
        {payment.payerEmail ? ` from ${payment.payerEmail}` : ""}
      </DialogDescription>
      <FormStack>
        <Field label={adminCopy.assignMemberLabel} required error={fieldError(state, "personId")}>
          {(props) => <Select {...props} name="personId" options={options} placeholder={adminCopy.assignMemberPlaceholder} />}
        </Field>
        <ErrorMessage state={state} />
      </FormStack>
      <DialogActions>
        <DialogClose asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton>{adminCopy.assignSubmit}</SubmitButton>
      </DialogActions>
    </form>
  );
}

function ErrorMessage({ state }: { state: ActionState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <FormError role="alert">
      <Icon icon={CircleAlert} size={16} />
      {state.message}
    </FormError>
  );
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

const Muted = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/* Phones get a list instead of the tables; desktop keeps the tables (as on Admins). */
const DesktopOnly = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileOnly = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileRow = styled.li`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
`;

const MobileText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  overflow-wrap: anywhere;
`;

const MutedText = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const FormStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;
