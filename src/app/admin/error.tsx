"use client";

import { OfflineState } from "@/app/_components/OfflineState";
import { RouteError } from "@/components/patterns/RouteError";
import { errorCopy } from "@/lib/errorCopy";

/** Shown when this section fails to load. Never shows the raw error; Next logs it (with its digest) on the server. */
export default function SectionError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // No connection: the goose, not a generic error (owner).
  if (typeof navigator !== "undefined" && !navigator.onLine) return <OfflineState page onRetry={retry} />;
  const c = errorCopy.admin.portal;
  return <RouteError title={c.title} body={c.body} escalation={c.escalation} retryLabel={c.retry} onRetry={retry} />;
}
