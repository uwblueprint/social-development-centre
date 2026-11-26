"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Plus } from "lucide-react";
import { ListPage, ListPageHeader, ListPageToolbar } from "@/components/patterns/ListPage";
import { PageLoading } from "@/components/patterns/PageLoading";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { useToast } from "@/components/ui/Toast";
import type { AutomaticEmail, AutomaticState } from "../model";
import { useEmails } from "../store";
import { ActionMenu } from "./ActionMenu";
import { Hidden, LoadError } from "./states";
import { AUTOMATIC_BASE, SEND_MODE_LABEL, listSummary, validateForPublish } from "./summary";
import { useAutomaticActions, type ActionKind } from "./useAutomaticActions";

const TABS: { value: AutomaticState; label: string; empty: string }[] = [
  { value: "published", label: "Live", empty: "Nothing is live." },
  { value: "draft", label: "Drafts", empty: "No drafts." },
  { value: "trash", label: "Trash", empty: "Trash is empty." },
];

export function AutomaticList() {
  const api = useEmails();
  const load = api.usePageLoad();
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { run, dialogs } = useAutomaticActions();

  const tabParam = params.get("tab");
  const tab: AutomaticState = tabParam === "draft" || tabParam === "trash" ? tabParam : "published";

  const all = api.state.automatic;
  const counts = React.useMemo(
    () => ({
      published: all.filter((e) => e.state === "published").length,
      draft: all.filter((e) => e.state === "draft").length,
      trash: all.filter((e) => e.state === "trash").length,
    }),
    [all],
  );

  const act = React.useCallback(
    (kind: ActionKind, email: AutomaticEmail) => {
      // A draft that can't be published yet opens its page so the problems show on the cards.
      if (kind === "publish" && validateForPublish(email).length > 0) {
        toast({
          title: `“${email.name.trim() || "Untitled email"}” isn't ready.`,
          actionLabel: "Open",
          onAction: () => router.push(`${AUTOMATIC_BASE}/${email.id}?check=1`),
        });
        return;
      }
      void run(kind, email);
    },
    [router, run, toast],
  );

  const setTab = (next: string) => router.replace(next === "published" ? AUTOMATIC_BASE : `${AUTOMATIC_BASE}?tab=${next}`);

  const newButton = (
    <Button type="button" onClick={() => router.push(`${AUTOMATIC_BASE}/new`)}>
      <Icon icon={Plus} size={16} />
      New automatic email
    </Button>
  );

  const columns: TableColumn<AutomaticEmail>[] = [
    { key: "name", header: "Name", width: "200px", render: (e) => <TruncatedText tooltip>{e.name.trim() || "Untitled email"}</TruncatedText> },
    { key: "summary", header: "When it sends", width: "320px", render: (e) => <TruncatedText tooltip>{listSummary(e)}</TruncatedText> },
    { key: "mode", header: "Send mode", width: "120px", render: (e) => (e.sendMode ? SEND_MODE_LABEL[e.sendMode] : "") },
    { key: "actions", header: <Hidden>Actions</Hidden>, width: "56px", align: "right", render: (e) => <ActionMenu email={e} run={act} /> },
  ];

  if (load.status === "loading") return <PageLoading title="Automatic emails" />;
  if (load.status === "error")
    return (
      <ListPage>
        <ListPageHeader title="Automatic emails" />
        <LoadError retry={load.retry} />
      </ListPage>
    );

  return (
    <ListPage>
      <ListPageHeader title="Automatic emails" actions={newButton} />
      {all.length === 0 ? (
        <EmptyState icon={Mail} title="No automatic emails." action={newButton} />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <ListPageToolbar
            tabs={
              <TabsList aria-label="Automatic emails">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                    <TabsCount>({counts[t.value]})</TabsCount>
                  </TabsTrigger>
                ))}
              </TabsList>
            }
          />
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              <Table
                columns={columns}
                rows={all.filter((e) => e.state === t.value)}
                getRowId={(e) => e.id}
                onRowClick={(e) => router.push(`${AUTOMATIC_BASE}/${e.id}`)}
                empty={<EmptyState icon={Mail} title={t.empty} action={t.value === "trash" ? undefined : newButton} />}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
      {dialogs}
    </ListPage>
  );
}
