"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { saveEmailFooter } from "./actions";
import { footerProblem, referText, withReferText, type FooterDoc } from "./doc";
import { LazyFooterEditor as FooterEditor } from "./LazyFooterEditor";
import { ReferLinkContext, type ReferLink } from "./ReferLinkEditor";

/**
 * The email footer on the admin Settings page: the editor, and Save once it has changed. It saves on its own,
 * apart from the page's other settings, because it changes every email for every admin.
 *
 * The refer link's words are kept here, not in the editor: the refer tag's popover saves them straight away
 * (for every email), and the footer's own Save always sends them with the rest.
 */
export function FooterSettings({ initial }: { initial: FooterDoc }) {
  const { toast } = useToast();
  const [saved, setSaved] = React.useState(initial);
  const [draft, setDraft] = React.useState(initial);
  const [referWords, setReferWords] = React.useState(() => referText(initial));
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();
  const footer = withReferText(draft, referWords);
  const dirty = JSON.stringify(saved) !== JSON.stringify(footer);

  const save = () => {
    // A second click while saving does nothing (the button stays enabled: no disabled state without a reason).
    if (pending) return;
    const problem = footerProblem(footer);
    if (problem) return setError(problem);
    startTransition(async () => {
      const result = await saveEmailFooter(footer);
      if (!result.ok) return setError(result.message);
      setSaved(footer);
      toast({ title: "Every email from SDC now ends with the new footer, including ones waiting to send." });
    });
  };

  // Saving new words from the refer tag changes only the words: other unsaved edits stay a draft.
  const referLink: ReferLink = {
    text: referWords,
    save: async (words) => {
      const next = withReferText(saved, words);
      const result = await saveEmailFooter(next);
      if (!result.ok) return result.message;
      setSaved(next);
      setReferWords(words);
      toast({ title: `Every member email now says “${words}” in the footer.` });
      return undefined;
    },
  };

  return (
    // No wrapper: the settings Cell hides each Field's first child (its label) for sighted readers.
    <ReferLinkContext.Provider value={referLink}>
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
    </ReferLinkContext.Provider>
  );
}

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
`;
