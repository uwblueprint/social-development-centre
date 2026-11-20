"use client";

import type { ReactElement } from "react";
import { DisabledReason } from "@/components/ui/DisabledReason";

/** While offline (`reason` set) the kit Button is disabled with its reason; online it renders untouched. */
export function OfflineGate({ reason, children }: { reason: string | null; children: ReactElement }) {
  return reason ? <DisabledReason reason={reason}>{children}</DisabledReason> : children;
}
