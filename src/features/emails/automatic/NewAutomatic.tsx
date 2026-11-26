"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/patterns/PageLoading";
import { useEmails } from "../store";
import { LoadError, Page } from "./states";
import { AUTOMATIC_BASE } from "./summary";

/** "New automatic email" creates a draft straight away (it autosaves from then on) and opens it. */
export function NewAutomatic() {
  const api = useEmails();
  const router = useRouter();
  const load = api.usePageLoad();
  const created = React.useRef(false);
  const apiRef = React.useRef(api);
  React.useEffect(() => {
    apiRef.current = api;
  });

  React.useEffect(() => {
    if (load.status !== "ready" || created.current) return;
    created.current = true;
    const draft = apiRef.current.createAutomatic();
    router.replace(`${AUTOMATIC_BASE}/${draft.id}`);
  }, [load.status, router]);

  if (load.status === "error")
    return (
      <Page>
        <LoadError retry={load.retry} />
      </Page>
    );
  return <PageLoading narrow />;
}
