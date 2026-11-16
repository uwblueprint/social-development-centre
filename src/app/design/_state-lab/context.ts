import * as React from "react";

export interface LabState {
  id: string;
  label: string;
}

export interface PageStates {
  data: readonly LabState[];
  actions: readonly LabState[];
}

export interface LabContext {
  active: ReadonlySet<string>;
  register: (key: symbol, states: PageStates) => () => void;
}

/** The states every screen gets, in panel order. */
export const GENERAL = {
  connection: [{ id: "offline", label: "Offline" }],
  data: [
    { id: "loading", label: "Loading" },
    { id: "empty", label: "Empty" },
    { id: "load-failed", label: "Couldn't load" },
    { id: "long-text", label: "Long text" },
  ],
  access: [
    { id: "not-found", label: "Page not found" },
    { id: "no-permission", label: "No permission" },
  ],
} satisfies Record<string, readonly LabState[]>;

export const Context = React.createContext<LabContext | null>(null);
