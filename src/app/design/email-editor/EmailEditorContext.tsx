"use client";

import * as React from "react";
import type { EmailMoment } from "./variables";

export interface EmailEditorContextValue {
  moment: EmailMoment;
  /** Overrides of the default fallbacks, by variable id. */
  fallbacks: Record<string, string>;
  /** Saves a fallback for every email not yet sent. */
  onFallbackChange?: (id: string, value: string) => void;
}

const EmailEditorContext = React.createContext<EmailEditorContextValue>({ moment: "one_off", fallbacks: {} });

export const EmailEditorProvider = EmailEditorContext.Provider;

export function useEmailEditorContext() {
  return React.useContext(EmailEditorContext);
}
