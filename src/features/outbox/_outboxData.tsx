"use client";

import * as React from "react";
import type { Member, Template, TemplateKey } from "./_data";

/**
 * The members and automatic emails the screen shows. OutboxPage provides what the server loaded; components
 * read them with `useOutboxData()`.
 */
export interface OutboxData {
  members: Member[];
  templates: Record<TemplateKey, Template>;
}

const OutboxDataContext = React.createContext<OutboxData>({ members: [], templates: {} });

export const OutboxDataProvider = OutboxDataContext.Provider;
export const useOutboxData = () => React.useContext(OutboxDataContext);
