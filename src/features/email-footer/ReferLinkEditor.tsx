"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverActions, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Tag } from "@/components/ui/Tag";
import { normalizeReferText, referTextError } from "./doc";

/**
 * The refer link's words in the footer editor, and saving new ones. Settings provides it; the editor's refer
 * tag reads it, so the tag shows the words before and after a save. Without it the tag isn't editable.
 */
export interface ReferLink {
  text: string;
  /** Saves new words for every email; resolves to an error message, or undefined once saved. */
  save: (text: string) => Promise<string | undefined>;
}

export const ReferLinkContext = React.createContext<ReferLink | null>(null);

/* The tag is the popover's trigger (a real button underneath), so it takes focus and opens with Enter or
   Space. The pencil appears on hover and focus to say it can be edited. (Design: #95.) */
const Trigger = styled(PopoverTrigger)`
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  cursor: pointer;
  border-radius: var(--radius-sm);

  & svg {
    opacity: 0;
    transition: opacity var(--duration) var(--ease);
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
  font-size: var(--text-sm);
  color: var(--color-text);
`;

/**
 * The refer link in the footer editor. Clicking it opens a small popover to change its words; the link itself
 * can't be removed. Saving changes every member email's footer, for every admin.
 */
export function ReferLinkTag({ link }: { link: ReferLink }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger aria-label={`Refer link: ${link.text}. Edit its text`}>
        <Tag>{link.text}</Tag>
        <Icon icon={Pencil} size={12} />
      </Trigger>
      <PopoverContent side="top" align="start">
        {/* Mounted only while open, so each opening starts from the saved words with no old error. */}
        <EditForm link={link} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function EditForm({ link, onDone }: { link: ReferLink; onDone: () => void }) {
  const [draft, setDraft] = React.useState(link.text);
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const value = normalizeReferText(draft);
    // Unchanged: nothing to save, so nothing is written and every email stays as it is.
    if (value === link.text) return onDone();
    const invalid = referTextError(value);
    if (invalid) return setError(invalid);
    startTransition(async () => {
      const failed = await link.save(value);
      if (failed) setError(failed);
      else onDone();
    });
  };

  return (
    <Form onSubmit={submit} noValidate>
      <Field label="Refer link text" hint="Shown in every member email. You can change the words, not remove the link." error={error}>
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
              setError(undefined);
            }}
          />
        )}
      </Field>
      <PopoverActions>
        <Button type="button" $variant="secondary" $size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" $size="sm" aria-busy={pending || undefined}>
          Save for all emails
        </Button>
      </PopoverActions>
    </Form>
  );
}
