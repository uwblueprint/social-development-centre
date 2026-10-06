"use client";

import { useActionState } from "react";
import { CircleAlert, MailCheck } from "lucide-react";
import { styled } from "next-yak";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/features/auth/AuthLayout";
import { sharedCopy, sharedOpportunityCopy } from "@/features/auth/copy";
import type { NewsletterAction, NewsletterResult } from "@/features/auth/types";

const copy = sharedOpportunityCopy.newsletter;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * Dev only: a stand-in for the newsletter signup until the backend exists (docs/backend/auth.md).
 * jordan@example.org is "already subscribed". Throws in production.
 */
async function previewSubscribe(_prev: NewsletterResult, formData: FormData): Promise<NewsletterResult> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Newsletter signup is not implemented: see docs/backend/auth.md.");
  }
  await new Promise((resolve) => setTimeout(resolve, 600));
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) return { status: "invalid-email", email };
  if (email.toLowerCase() === "jordan@example.org") return { status: "already-subscribed", email };
  return { status: "subscribed", email };
}

const Box = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
`;

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

const Text = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
`;

const Done = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);

  & > svg {
    flex-shrink: 0;
    color: var(--color-brand-heading);
  }
`;

/**
 * "Get opportunities like this by email" under a shared opportunity, and in place of one that's gone
 * (member screens 8–10). Success replaces the box's contents in place; the post stays visible.
 */
export function NewsletterSignup({ opportunityId, action }: { opportunityId: string; action?: NewsletterAction }) {
  const [result, dispatch] = useActionState<NewsletterResult, FormData>(async (prev, formData) => {
    formData.set("opportunityId", opportunityId);
    return (action ?? previewSubscribe)(prev, formData);
  }, { status: "idle" });

  if (result.status === "subscribed" || result.status === "already-subscribed") {
    const done = result.status === "subscribed" ? copy.subscribed : copy.alreadySubscribed;
    return (
      <Box aria-labelledby="newsletter-title">
        <Done role="status">
          <Icon icon={MailCheck} size={20} />
          <Heading>
            <Title id="newsletter-title">{done.title}</Title>
            <Text>{done.description(result.email)}</Text>
          </Heading>
        </Done>
      </Box>
    );
  }

  return (
    <Box aria-labelledby="newsletter-title">
      <Heading>
        <Title id="newsletter-title">{copy.title}</Title>
        <Text>{copy.description}</Text>
      </Heading>
      <Form action={dispatch} noValidate>
        <Field
          id="newsletter-email"
          label={copy.emailLabel}
          error={result.status === "invalid-email" ? sharedCopy.invalidEmail : undefined}
        >
          {(props) => (
            <Input
              {...props}
              key={result.status}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@example.org"
              defaultValue={"email" in result ? result.email : undefined}
              autoFocus={result.status === "invalid-email"}
            />
          )}
        </Field>
        <SubmitButton>{copy.submit}</SubmitButton>
        {result.status === "temporary" && (
          <FormMessage role="alert">
            <Icon icon={CircleAlert} size={16} />
            <span>{copy.temporary}</span>
          </FormMessage>
        )}
      </Form>
    </Box>
  );
}
