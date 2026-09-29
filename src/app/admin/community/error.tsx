"use client";

import { RouteError } from "@/components/patterns/RouteError";
import { communityCopy } from "./_copy";

/** Shown when this section fails to load. Never shows the raw error; Next logs it (with its digest) on the server. */
export default function SectionError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const c = communityCopy.loadError;
  return <RouteError title={c.title} body={c.body} escalation={c.escalation} retryLabel={c.retry} onRetry={retry} />;
}
