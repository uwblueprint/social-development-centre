import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import { Icon } from "@/components/ui/Icon";
import { FormError } from "@/features/auth/AuthScreen";
import type { ActionState } from "@/lib/forms";

/** Layout for the admin pages that manage people (Admins, Paying members) until the admin portal's shell lands. */

export const PeoplePage = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-4);
`;

export const PageTitle = styled.h1`
  margin: 0 0 var(--space-2);
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
`;

export const Muted = styled.p`
  margin: 0;
  color: var(--color-text-muted);
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
`;

export const AddForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  max-width: 400px;
`;

export const Success = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-success);
`;

/** A form's result: the success line (always rendered, so screen readers announce it) or the error. */
export function FormMessage({ state }: { state: ActionState<unknown> }) {
  return (
    <>
      <Success role="status">{state.status === "success" && state.message}</Success>
      {state.status === "error" && state.message && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {state.message}
        </FormError>
      )}
    </>
  );
}
