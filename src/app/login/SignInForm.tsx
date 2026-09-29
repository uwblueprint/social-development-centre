"use client";

import { useActionState } from "react";
import { styled } from "next-yak";
import { CircleAlert, MailCheck } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SDC_CONTACT_EMAIL } from "@/lib/contact";
import { signIn, type SignInResult } from "./actions";

const copy = {
  emailLabel: "Email address",
  submit: "Send sign-in link",
  invalidEmail: "Enter an email address like name@example.org.",
  sent: "If this email has access, we'll send a sign-in link. Check your inbox.",
  temporary: "We couldn't send a sign-in link. Try again in a minute.",
  notPermitted: "We couldn't sign you in with this email.",
  contact: "Contact SDC for help.",
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
`;

const Message = styled.p<{ $tone: "danger" | "success" }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ $tone }) => ($tone === "danger" ? "var(--color-danger)" : "var(--color-success)")};
  }
`;

const ContactLink = styled.a`
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

function NotPermitted() {
  return (
    <Message $tone="danger" role="alert">
      <Icon icon={CircleAlert} size={16} />
      <span>
        {copy.notPermitted} <ContactLink href={`mailto:${SDC_CONTACT_EMAIL}`}>{copy.contact}</ContactLink>
      </span>
    </Message>
  );
}

/** `linkFailed`: the person arrived from a sign-in link that didn't work (expired, used, or refused). */
export function SignInForm({ linkFailed }: { linkFailed: boolean }) {
  const [state, action] = useActionState<SignInResult, FormData>(signIn, { status: "idle", email: "" });

  return (
    <Form action={action} noValidate>
      <Field
        id="email"
        label={copy.emailLabel}
        error={state.status === "invalid-email" ? copy.invalidEmail : undefined}
      >
        {(props) => (
          <Input
            {...props}
            // Remount after each submit so the field shows what was sent, even after an error.
            key={state.status + state.email}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@example.org"
            defaultValue={state.email}
            autoFocus={state.status === "invalid-email"}
          />
        )}
      </Field>
      <SubmitButton>{copy.submit}</SubmitButton>
      {state.status === "sent" && (
        <Message $tone="success" role="status">
          <Icon icon={MailCheck} size={16} />
          <span>{copy.sent}</span>
        </Message>
      )}
      {state.status === "temporary" && (
        <Message $tone="danger" role="alert">
          <Icon icon={CircleAlert} size={16} />
          <span>{copy.temporary}</span>
        </Message>
      )}
      {(state.status === "not-permitted" || (state.status === "idle" && linkFailed)) && <NotPermitted />}
    </Form>
  );
}
