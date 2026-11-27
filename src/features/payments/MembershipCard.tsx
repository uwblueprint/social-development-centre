"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/features/auth/AuthScreen";
import { formatDate } from "@/lib/date";
import { idleState, type ActionState } from "@/lib/forms";
import { cancelMyMembership, resumeMyMembership, startSubscription } from "./actions";
import { disabledReasons, memberCopy } from "./copy";
import type { MyMembership, PlanOption } from "./types";

/**
 * The members' area membership card: what their payment status is and the one or two things they can
 * do about it. PayPal does the paying; this only starts, cancels and resumes.
 */
export function MembershipCard({
  membership,
  plans,
  managePaymentsUrl,
}: {
  membership: MyMembership;
  plans: PlanOption[];
  managePaymentsUrl: string;
}) {
  const { status, nextBillingAt, cancelAt } = membership;
  const showWarning = status === "payment_problem" || status === "suspended";

  return (
    <Wide>
      <CardHeader>
        <CardTitle>{memberCopy.cardTitle}</CardTitle>
        <StatusLine>
          {showWarning && <Icon icon={CircleAlert} size={16} />}
          <span>
            {memberCopy.status[status]}
            {nextBillingAt && (status === "active" || status === "payment_problem") && (
              <> {memberCopy.nextPayment(formatDate(nextBillingAt))}</>
            )}
            {cancelAt && status === "cancelling" && <> {memberCopy.cancelsOn(formatDate(cancelAt))}</>}
          </span>
        </StatusLine>
      </CardHeader>
      <CardContent>
        <Actions>
          {/* "pending" never reaches here: a payment we haven't captured shows as "none" (queries.ts). */}
          {(status === "none" || status === "cancelled") && <PayButtons plans={plans} label={memberCopy.payButton} />}
          {status === "cancelling" && <PayButtons plans={plans} label={memberCopy.resubscribeButton} />}
          {showWarning && (
            <PayPalLink href={managePaymentsUrl} target="_blank" rel="noreferrer">
              {memberCopy.updatePaymentLink}
            </PayPalLink>
          )}
          {status === "suspended" && <ResumeForm />}
          {(status === "active" || status === "payment_problem" || status === "suspended") && <CancelMembership />}
        </Actions>
      </CardContent>
    </Wide>
  );
}

/** One Pay button per plan. Each submits its plan's key; the server sends the member on to PayPal. */
function PayButtons({ plans, label }: { plans: PlanOption[]; label: string }) {
  const [state, formAction] = useActionState(startSubscription, idleState);

  return (
    <>
      {plans.map((plan) => (
        <PlanForm key={plan.key} action={formAction}>
          <PlanText>
            <strong>{plan.name}</strong>
            {plan.priceLabel && <span>{plan.priceLabel}</span>}
          </PlanText>
          {plan.available ? (
            <SubmitButton name="plan" value={plan.key}>
              {label}
            </SubmitButton>
          ) : (
            <DisabledReason reason={disabledReasons.planNotSetUp}>
              <Button type="button" disabled>
                {label}
              </Button>
            </DisabledReason>
          )}
        </PlanForm>
      ))}
      <ErrorMessage state={state} />
      <SuccessMessage state={state} />
    </>
  );
}

function ResumeForm() {
  const [state, formAction] = useActionState(() => resumeMyMembership(), idleState);
  return (
    <form action={formAction}>
      <Hint>{memberCopy.resumeHint}</Hint>
      <SubmitButton>{memberCopy.resumeButton}</SubmitButton>
      <ErrorMessage state={state} />
    </form>
  );
}

function CancelMembership() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" $variant="danger-outline">
          {memberCopy.cancelButton}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <CancelForm />
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Mounted only while the dialog is open, so a failed attempt's error is gone when it reopens. */
function CancelForm() {
  const [state, formAction] = useActionState(() => cancelMyMembership(), idleState);
  return (
    <form action={formAction}>
      <AlertDialogTitle>{memberCopy.cancelTitle}</AlertDialogTitle>
      <AlertDialogDescription>{memberCopy.cancelDescription}</AlertDialogDescription>
      <ErrorMessage state={state} />
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button type="button" $variant="secondary">
            {memberCopy.cancelKeep}
          </Button>
        </AlertDialogCancel>
        <SubmitButton $variant="danger">{memberCopy.cancelConfirm}</SubmitButton>
      </AlertDialogActions>
    </form>
  );
}

/** Resubscribing (or a payment PayPal had already taken) updates the card in place; this says so. */
function SuccessMessage({ state }: { state: ActionState }) {
  if (state.status !== "success" || !state.message) return null;
  return <Hint role="status">{state.message}</Hint>;
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

/* The warning icon sits beside the first line, not inline with the text. */
const StatusLine = styled(CardDescription)`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);

  & > svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const Wide = styled(Card)`
  width: 100%;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  & > form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
`;

const PlanForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const PlanText = styled.p`
  display: flex;
  flex-direction: column;
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  & strong {
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const PayPalLink = styled.a`
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:hover {
    text-decoration-thickness: 2px;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;
