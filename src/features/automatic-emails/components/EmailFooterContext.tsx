"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { EmailFooter } from "@/features/email-editor";
import { EMAIL_FOOTER, REFER_LINK } from "../footer";
import { ReferLinkEditor } from "./ReferLinkEditor";

type ReferLink = { text: string; setText: (text: string) => void; editable: boolean };

const ReferLinkContext = createContext<ReferLink>({
  text: REFER_LINK.defaultText,
  setText: () => {},
  editable: false,
});

/**
 * The admin portal's layout reads the refer link's text once and provides it here. Every email footer
 * the portal draws shows it, and clicking it there edits it. A save updates every footer on the page at
 * once and revalidates the layout for the next page.
 */
export function EmailFooterProvider({ referLinkText, children }: { referLinkText: string; children: ReactNode }) {
  const [text, setText] = useState(referLinkText);
  // A fresh value from the server (another admin's save, after navigating) replaces ours.
  const [fromServer, setFromServer] = useState(referLinkText);
  if (fromServer !== referLinkText) {
    setFromServer(referLinkText);
    setText(referLinkText);
  }
  const value = useMemo(() => ({ text, setText, editable: true }), [text]);
  return <ReferLinkContext.Provider value={value}>{children}</ReferLinkContext.Provider>;
}

/** The refer link's current text. Outside the provider: the default, not editable. */
export function useReferLink() {
  return useContext(ReferLinkContext);
}

/** The footer every email ends with; its refer link opens the editor when the portal provides one. */
export function useEmailFooter(): EmailFooter {
  const { text, editable } = useReferLink();
  return useMemo(
    () => ({ ...EMAIL_FOOTER, referLink: editable ? <ReferLinkEditor /> : <u>{text}</u> }),
    [text, editable],
  );
}
