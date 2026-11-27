"use client";

import * as React from "react";
import { defaultFooterDoc, type FooterDoc } from "@/features/email-footer/doc";
import type { Member, Template, TemplateKey } from "./_data";

/**
 * The members and automatic emails the screen shows. OutboxPage provides what the server loaded; components
 * read them with `useOutboxData()`.
 */
export interface OutboxData {
  members: Member[];
  templates: Record<TemplateKey, Template>;
  /** The footer saved in Settings. */
  footer: FooterDoc;
}

const OutboxDataContext = React.createContext<OutboxData>({ members: [], templates: {}, footer: defaultFooterDoc() });

export const OutboxDataProvider = OutboxDataContext.Provider;
export const useOutboxData = () => React.useContext(OutboxDataContext);
