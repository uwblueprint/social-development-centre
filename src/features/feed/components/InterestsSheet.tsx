"use client";

import * as React from "react";
import { styled } from "next-yak";
import { saveInterests } from "@/app/member/_data/actions";
import { Button } from "@/components/ui/Button";
import { ErrorIcon } from "@/components/ui/Field";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SelectableTag, TagList } from "@/components/ui/Tag";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TOPICS } from "@/features/opportunities/catalog";
import type { TopicId } from "@/features/opportunities/types";
import type { ActionState } from "@/lib/forms";
import { feedCopy } from "../copy";
import { useMember } from "./MemberProvider";

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Failure = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

const Form = styled.form`
  display: contents;
`;

/**
 * The topics chosen at onboarding, editable at any time. Saving reorders For you straight away. The form is a real
 * form backed by the `saveInterests` server action, so slow and failed saves behave like every other form.
 */
export function InterestsSheet({ open, onOpenChange, interests }: { open: boolean; onOpenChange: (open: boolean) => void; interests: TopicId[] }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {/* Remounted on each open, so the choices always start from what's saved. */}
        {open && <InterestsForm interests={interests} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function InterestsForm({ interests, onDone }: { interests: TopicId[]; onDone: () => void }) {
  const { saveInterests: apply } = useMember();
  const [chosen, setChosen] = React.useState<TopicId[]>(interests);
  const [state, action] = React.useActionState<ActionState<{ interests: TopicId[] }>, FormData>(saveInterests, { status: "idle" });

  // The action ran and succeeded: apply it on this device and close.
  const handled = React.useRef(state);
  React.useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state.status === "success" && state.data) {
      apply(state.data.interests);
      onDone();
    }
  }, [state, apply, onDone]);

  function toggle(id: TopicId) {
    setChosen((c) => (c.includes(id) ? c.filter((t) => t !== id) : [...c, id]));
  }

  // The tags aren't form controls, so each chosen topic is added as one `topic` value on submit.
  return (
    <Form
      action={(fd) => {
        chosen.forEach((t) => fd.append("topic", t));
        action(fd);
      }}
    >
      <SheetHeader>
        <SheetTitle>{feedCopy.interests.title}</SheetTitle>
        <SheetDescription>{feedCopy.interests.description}</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <Hint>{feedCopy.interests.hint}</Hint>
        <TagList>
          {TOPICS.map((t) => (
            <SelectableTag key={t.id} selected={chosen.includes(t.id)} onClick={() => toggle(t.id)}>
              {t.label}
            </SelectableTag>
          ))}
        </TagList>
        {state.status === "error" && state.message && (
          <Failure role="alert">
            <ErrorIcon />
            {state.message}
          </Failure>
        )}
      </SheetBody>
      <SheetFooter>
        <Button type="button" $variant="outline" onClick={onDone}>
          {feedCopy.interests.cancel}
        </Button>
        <SubmitButton type="submit">{feedCopy.interests.save}</SubmitButton>
      </SheetFooter>
    </Form>
  );
}
