"use client";

import * as React from "react";
import { MEMBERS, TEMPLATES, type Member, type Template, type TemplateKey } from "./_data";

/**
 * The members and automatic emails the screen shows. OutboxPage provides them (the State lab's Long text
 * swaps in longer ones); components read them with `useOutboxData()` instead of importing the seed.
 */
export interface OutboxData {
  members: Member[];
  templates: Record<TemplateKey, Template>;
}

export const SEED_DATA: OutboxData = { members: MEMBERS, templates: TEMPLATES };

const OutboxDataContext = React.createContext<OutboxData>(SEED_DATA);

export const OutboxDataProvider = OutboxDataContext.Provider;
export const useOutboxData = () => React.useContext(OutboxDataContext);
