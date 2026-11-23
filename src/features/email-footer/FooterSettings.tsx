"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { saveEmailFooter } from "./actions";
import { footerProblem, type FooterDoc } from "./doc";
import { LazyFooterEditor as FooterEditor } from "./LazyFooterEditor";

/**
 * The email footer on the admin Settings page: the editor, and Save once it has changed. It saves on its own,
 * apart from the page's other settings, because it changes every email for every admin.
 */
export function FooterSettings({ initial }: { initial: FooterDoc }) {
  const { toast } = useToast();
  const [saved, setSaved] = React.useState(initial);
  const [draft, setDraft] = React.useState(initial);
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const save = () => {
    // A second click while saving does nothing (the button stays enabled: no disabled state without a reason).
    if (pending) return;
    const problem = footerProblem(draft);
    if (problem) return setError(problem);
    startTransition(async () => {
      const result = await saveEmailFooter(draft);
      if (!result.ok) return setError(result.message);
      setSaved(draft);
      toast({ title: "Every email from SDC now ends with the new footer, including ones waiting to send." });
    });
  };

  return (
    // No wrapper: the settings Cell hides each Field's first child (its label) for sighted readers.
    <>
      <Field label="Email footer" error={error}>
        {(props) => (
          <FooterEditor
            {...props}
            aria-label="Email footer"
            initial={initial}
            onChange={(doc) => {
              setDraft(doc);
              setError(undefined);
            }}
          />
        )}
      </Field>
      {dirty && (
        <Actions>
          <Button type="button" onClick={save}>
            Save footer for all admins
          </Button>
        </Actions>
      )}
    </>
  );
}

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
`;
