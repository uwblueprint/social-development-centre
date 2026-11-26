"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useEmails } from "../store";
import { ComposeOneOff } from "./ComposeOneOff";
import { ONE_OFF, copy } from "./copy";
import { LoadErrorPage, LoadingPage } from "./parts";
import { SentDetail } from "./SentDetail";

/** /one-off/[id]: a draft opens for writing, a sent (or sending) email opens read-only. */
export function OneOffDetail({ id }: { id: string }) {
  const api = useEmails();
  const router = useRouter();
  const load = api.usePageLoad();
  if (load.status === "loading") return <LoadingPage title="One-off email" />;
  if (load.status === "error")
    return <LoadErrorPage title="One-off email" onRetry={load.retry} />;

  const oneOff = api.state.oneOffs.find((o) => o.id === id);
  if (!oneOff) {
    return (
      <ListPage>
        <ListPageHeader title="One-off email" />
        <EmptyState
          icon={FileQuestion}
          title={copy.notFoundTitle}
          action={
            <Button type="button" onClick={() => router.push(ONE_OFF)}>
              Back to one-off emails
            </Button>
          }
        />
      </ListPage>
    );
  }
  /* key: a draft that changes id (Duplicate) starts a fresh editor. */
  return oneOff.status === "draft" ? (
    <ComposeOneOff key={oneOff.id} oneOff={oneOff} />
  ) : (
    <SentDetail key={oneOff.id} oneOff={oneOff} />
  );
}

/** /one-off/new[?member=<id>]: makes a draft (with that member picked by hand) and opens it. */
export function NewOneOff() {
  const api = useEmails();
  const router = useRouter();
  const params = useSearchParams();
  const load = api.usePageLoad();
  const made = useRef(false);
  const member = params.get("member") ?? undefined;
  const ready = load.status === "ready";
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  });

  useEffect(() => {
    if (!ready || made.current) return;
    made.current = true;
    const draft = apiRef.current.createOneOff(member);
    router.replace(`${ONE_OFF}/${draft.id}`);
  }, [ready, member, router]);

  if (load.status === "error")
    return <LoadErrorPage title="New one-off email" onRetry={load.retry} />;
  return <LoadingPage title="New one-off email" />;
}
