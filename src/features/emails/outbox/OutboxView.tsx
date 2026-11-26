"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { styled } from "next-yak";
import { Inbox } from "lucide-react";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { PageLoading } from "@/components/patterns/PageLoading";
import { RouteError } from "@/components/patterns/RouteError";
import { ADMINS } from "../model";
import { useEmails } from "../store";
import { Notice } from "./Notice";
import { BatchItem } from "./BatchItem";
import type { Guard } from "./SendPanel";
import {
  buildGroups,
  fullName,
  lockedByOther,
  plural,
  sourceInfo,
  undoLeft,
} from "./helpers";
import type { Batch } from "./helpers";
import { useSendActions } from "./actions";

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const H2 = styled.h2`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

export function OutboxView() {
  const api = useEmails();
  const load = api.usePageLoad();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sendParam = params.get("send");
  const actions = useSendActions();

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [openSendId, setOpenSendId] = useState<string | null>(null);
  const [autoEdit, setAutoEdit] = useState<{
    id: string;
    mode: "one" | "batch";
  } | null>(null);
  const [missing, setMissing] = useState(false);
  const guard = useRef<Guard | null>(null);
  const handled = useRef<string | null>(null);

  const groups = buildGroups(api, api.now);
  const batches = groups.flatMap((g) => g.batches);
  const hasAny = batches.length > 0;

  // Deep link from Automatic Emails: ?send=<id> opens that batch and that email.
  useEffect(() => {
    if (!sendParam || handled.current === sendParam || load.status !== "ready")
      return;
    handled.current = sendParam;
    const s = api.state.sends.find((x) => x.id === sendParam);
    const inBox = s && batches.find((b) => b.sends.some((x) => x.id === s.id));
    if (!s || !inBox) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the link once the data has loaded
      setMissing(true);
      return;
    }
    setOpenKeys([inBox.key]);
    setOpenSendId(s.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendParam, load.status]);

  const withGuard = (next: () => void) =>
    guard.current ? guard.current(next) : next();
  const registerGuard = (g: Guard | null) => {
    guard.current = g;
  };

  const openSend = (id: string | null, edit?: "one" | "batch") =>
    withGuard(() => {
      setAutoEdit(id && edit ? { id, mode: edit } : null);
      setOpenSendId(id);
      if (id && sendParam) router.replace(pathname);
    });

  const editAll = (b: Batch) => {
    const first = b.sends
      .filter((s) => !lockedByOther(s, api.now))
      .sort((x, y) =>
        fullName(api.member(x.memberId)).localeCompare(
          fullName(api.member(y.memberId)),
        ),
      )[0];
    if (!first) return;
    withGuard(() => {
      setOpenKeys((k) => (k.includes(b.key) ? k : [...k, b.key]));
      setAutoEdit({ id: first.id, mode: "batch" });
      setOpenSendId(first.id);
    });
  };

  const changeSection = (sectionKeys: string[], next: string[]) => {
    const apply = () => {
      setOpenKeys((cur) => [
        ...cur.filter((k) => !sectionKeys.includes(k)),
        ...next,
      ]);
      // A one-off batch with one email shows that email straight away.
      for (const k of next.filter((x) => !openKeys.includes(x))) {
        const b = batches.find((x) => x.key === k);
        if (b && b.oneOff && b.sends.length === 1) setOpenSendId(b.sends[0].id);
      }
    };
    const closing = sectionKeys.filter(
      (k) => openKeys.includes(k) && !next.includes(k),
    );
    const holdsOpen = closing.some((k) =>
      batches.find((b) => b.key === k)?.sends.some((s) => s.id === openSendId),
    );
    if (holdsOpen) {
      withGuard(() => {
        setOpenSendId(null);
        apply();
      });
    } else apply();
  };

  // An edit in progress keeps its email paused with no time limit, so the Outbox says so.
  const editingSend = api.state.sends.find((s) => s.lock?.by === ADMINS.me);
  const editingBatch =
    editingSend &&
    batches.find((b) => b.sends.some((x) => x.id === editingSend.id));
  const showEditing =
    !!editingSend &&
    !!editingBatch &&
    !(openSendId === editingSend.id && openKeys.includes(editingBatch.key));

  const removed = api.state.sends.filter(
    (s) =>
      s.status === "not-sent" &&
      s.undo?.action === "dont-send" &&
      undoLeft(s, api.now) > 0,
  );
  const removedBy = new Map<string, typeof removed>();
  for (const s of removed)
    removedBy.set(sourceInfo(api, s).name, [
      ...(removedBy.get(sourceInfo(api, s).name) ?? []),
      s,
    ]);

  if (load.status === "loading") return <PageLoading title="Outbox" />;
  if (load.status === "error") {
    return (
      <RouteError
        title="We couldn’t load the Outbox."
        body="Your data is safe; this is a loading problem."
        escalation={{ text: "If it keeps happening, tell an SDC admin." }}
        retryLabel="Try again"
        onRetry={load.retry}
      />
    );
  }

  return (
    <ListPage>
      <ListPageHeader title="Outbox" />

      {(showEditing ||
        api.lab.offline ||
        api.lab.providerDown ||
        missing ||
        actions.error ||
        removedBy.size > 0) && (
        <Stack>
          {showEditing && editingSend && editingBatch && (
            <Notice
              tone="warning"
              actions={
                <Button
                  type="button"
                  $variant="secondary"
                  $size="sm"
                  onClick={() =>
                    withGuard(() => {
                      setOpenKeys((k) =>
                        k.includes(editingBatch.key)
                          ? k
                          : [...k, editingBatch.key],
                      );
                      setAutoEdit(null);
                      setOpenSendId(editingSend.id);
                    })
                  }
                >
                  Open
                </Button>
              }
            >
              You have an edit in progress. This email won’t send until you
              update or discard it.
            </Notice>
          )}
          {api.lab.offline && <Notice tone="warning">Offline</Notice>}
          {api.lab.providerDown && (
            <Notice tone="warning">Email provider isn’t responding</Notice>
          )}
          {missing && (
            <Notice
              actions={
                <Button
                  type="button"
                  $variant="secondary"
                  $size="sm"
                  onClick={() => {
                    setMissing(false);
                    router.replace(pathname);
                  }}
                >
                  Dismiss
                </Button>
              }
            >
              No longer in the Outbox
            </Notice>
          )}
          {actions.error && <Notice tone="danger">{actions.error}</Notice>}
          {[...removedBy.entries()].map(([name, sends]) => (
            <Notice
              key={name}
              actions={
                <Button
                  type="button"
                  $variant="secondary"
                  $size="sm"
                  onClick={() => void actions.undo(sends, name)}
                >
                  Undo
                </Button>
              }
            >
              Removed “{name}” for {plural(sends.length, "member")}
            </Notice>
          ))}
        </Stack>
      )}

      {!hasAny ? (
        <EmptyState
          icon={Inbox}
          title="Nothing is going out in the next 30 days"
        />
      ) : (
        groups.map((g) => {
          const keys = g.batches.map((b) => b.key);
          return (
            <Section key={g.id} aria-labelledby={`outbox-${g.id}`}>
              <H2 id={`outbox-${g.id}`}>
                {g.title} · {g.batches.length}
              </H2>
              <Accordion
                type="multiple"
                value={openKeys.filter((k) => keys.includes(k))}
                onValueChange={(v: string[]) => changeSection(keys, v)}
              >
                {g.batches.map((b) => (
                  <BatchItem
                    key={b.key}
                    batch={b}
                    showDay={!!g.waiting}
                    openSendId={openSendId}
                    autoEdit={autoEdit}
                    onOpenSend={openSend}
                    onEditAll={editAll}
                    registerGuard={registerGuard}
                  />
                ))}
              </Accordion>
            </Section>
          );
        })
      )}
    </ListPage>
  );
}
