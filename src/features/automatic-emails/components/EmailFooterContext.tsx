"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { EmailFooter } from "@/features/email-editor";
import { EMAIL_FOOTER, REFER_LINK } from "../footer";

const ReferLinkText = createContext<string>(REFER_LINK.defaultText);

/**
 * The admin portal's layout reads the refer link's text once and provides it here, so every email
 * footer (the editor, the Outbox and the preview) shows what Settings saved. Saving revalidates the
 * layout, so they update without a reload.
 */
export function EmailFooterProvider({ referLinkText, children }: { referLinkText: string; children: ReactNode }) {
  return <ReferLinkText.Provider value={referLinkText}>{children}</ReferLinkText.Provider>;
}

/** The footer every email ends with. Outside the provider, the refer link shows its default text. */
export function useEmailFooter(): EmailFooter {
  const referLinkText = useContext(ReferLinkText);
  return useMemo(() => ({ ...EMAIL_FOOTER, referLinkText }), [referLinkText]);
}
