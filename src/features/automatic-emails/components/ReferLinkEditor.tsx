"use client";

import { useActionState, useState, type SyntheticEvent } from "react";
import { styled } from "next-yak";
import { CircleAlert, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverActions, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { FormError } from "@/features/auth/AuthScreen";
import { fieldError, type ActionState } from "@/lib/forms";
import { normalizeReferLinkText, referLinkTextError } from "../footer";
import { saveReferLinkText } from "../footerActions";
import { useReferLink } from "./EmailFooterContext";

/*
 * The refer link as it reads in the footer: underlined footer text, like Unsubscribe beside it. It's the
 * popover's trigger (a real button underneath), so it takes focus and opens with Enter or Space. The
 * pencil appears on hover and focus to say it can be edited, without changing how the footer reads.
 */
const Trigger = styled(PopoverTrigger)`
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  text-decoration: underline;
  cursor: pointer;
  border-radius: var(--radius-sm);

  & svg {
    opacity: 0;
    transition: opacity var(--duration) var(--ease);
  }
  &:hover,
  &[data-state="open"] {
    color: var(--color-text);
  }
  &:hover svg,
  &:focus-visible svg,
  &[data-state="open"] svg {
    opacity: 1;
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  /* Body-sized text, whatever the small footer text around the trigger. */
  font-size: var(--text-sm);
  color: var(--color-text);
`;

/**
 * The refer link in an email footer. Clicking it opens a small popover to change its words; the link
 * itself can't be removed. Saving changes every member email's footer, for every admin.
 */
export function ReferLinkEditor() {
  const { text } = useReferLink();
  const [open, setOpen] = useState(false);

  // Stops the footer's own hover, focus and double-click hint ("where to edit this footer") firing here.
  const stop = (e: SyntheticEvent) => e.stopPropagation();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger
        aria-label={`Refer link: ${text}. Edit its text`}
        onPointerMove={stop}
        onFocus={stop}
        onDoubleClick={stop}
      >
        {text}
        <Icon icon={Pencil} size={12} />
      </Trigger>
      <PopoverContent side="top" align="start">
        {/* Mounted only while open, so each opening starts from the saved text with no old error. */}
        <EditForm onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

const idle: ActionState<{ text: string }> = { status: "idle" };

function EditForm({ onDone }: { onDone: () => void }) {
  const { text, setText } = useReferLink();
  const { toast } = useToast();
  const [draft, setDraft] = useState(text);
  const [clientError, setClientError] = useState<string>();

  const [state, formAction] = useActionState(async (_prev: ActionState<{ text: string }>, formData: FormData) => {
    const value = normalizeReferLinkText(String(formData.get("text") ?? ""));
    // Unchanged: nothing to save, so nothing is written and every email stays as it is.
    if (value === text) {
      onDone();
      return idle;
    }
    const invalid = referLinkTextError(value);
    if (invalid) {
      setClientError(invalid);
      return idle;
    }
    const result = await saveReferLinkText(value);
    if (result.status === "success" && result.data) {
      setText(result.data.text);
      toast({ title: `Every member email now says “${result.data.text}” in the footer.` });
      onDone();
    }
    return result;
  }, idle);

  const error = clientError ?? fieldError(state, "text");
  const formError = state.status === "error" && !state.fieldErrors ? state.message : undefined;

  return (
    <Form action={formAction} noValidate>
      <Field
        label="Refer link text"
        hint="Shown in every member email. You can change the words, not remove the link."
        error={error}
      >
        {(props) => (
          <Input
            {...props}
            name="text"
            autoComplete="off"
            // The popover opens to edit this one thing, so typing can start straight away.
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setClientError(undefined);
            }}
          />
        )}
      </Field>
      {formError && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {formError}
        </FormError>
      )}
      <PopoverActions>
        <Button type="button" $variant="secondary" $size="sm" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton $size="sm">Save for all emails</SubmitButton>
      </PopoverActions>
    </Form>
  );
}
