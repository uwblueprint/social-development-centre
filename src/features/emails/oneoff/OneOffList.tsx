"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  FileText,
  Mail,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import {
  ListEmptyState,
  ListPage,
  ListPageHeader,
  ListPageToolbar,
} from "@/components/patterns/ListPage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import type { TableColumn } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { useEmails } from "../store";
import type { OneOffEmail } from "../model";
import { ONE_OFF, copy, formatDate, formatShort, toWhom } from "./copy";
import { plainSubject } from "../editor/richtext";
import { PagedTable } from "./PagedTable";
import { LoadErrorPage, LoadingPage, Stack, VisuallyHidden } from "./parts";
import { UndoNotice, undoWindow } from "./UndoNotice";

const subjectOf = (o: OneOffEmail) =>
  plainSubject(o.content.subject.trim()) || copy.noSubject;

function List() {
  const api = useEmails();
  const load = api.usePageLoad();
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [tab, setTab] = useState<"drafts" | "sent">(
    params.get("tab") === "sent" ? "sent" : "drafts",
  );
  const [deleting, setDeleting] = useState<OneOffEmail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (load.status === "loading") return <LoadingPage />;
  if (load.status === "error") return <LoadErrorPage onRetry={load.retry} />;

  const all = api.state.oneOffs;
  const drafts = all
    .filter((o) => o.status === "draft")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sent = all
    .filter((o) => o.status !== "draft")
    .sort((a, b) =>
      (b.sentAt ?? b.updatedAt).localeCompare(a.sentAt ?? a.updatedAt),
    );
  const inWindow = sent.filter((o) =>
    undoWindow(api.state.sends, o.id, api.now),
  );

  const open = (o: OneOffEmail) => router.push(`${ONE_OFF}/${o.id}`);
  const duplicate = (o: OneOffEmail) => {
    const copyOf = api.duplicateOneOff(o.id);
    toast({ title: "Copied to a new draft" });
    router.push(`${ONE_OFF}/${copyOf.id}`);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    const r = await api.deleteOneOff(deleting.id);
    if (!r.ok) return setDeleteError(r.error);
    toast({ title: "Draft deleted" });
    setDeleting(null);
  };

  const subjectCol: TableColumn<OneOffEmail> = {
    key: "subject",
    header: "Subject",
    width: "280px",
    render: (o) => <TruncatedText tooltip>{subjectOf(o)}</TruncatedText>,
  };
  const toCol: TableColumn<OneOffEmail> = {
    key: "to",
    header: "To",
    width: "140px",
    render: (o) => <TruncatedText>{toWhom(o.audience)}</TruncatedText>,
  };

  const rowMenu = (o: OneOffEmail, canDelete: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          $variant="ghost"
          $size="sm"
          aria-label={`More actions for ${subjectOf(o)}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Icon icon={MoreHorizontal} size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onSelect={() => duplicate(o)}>
          <Icon icon={Copy} size={16} />
          Duplicate
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem
            $variant="danger"
            onSelect={() => {
              setDeleteError(null);
              setDeleting(o);
            }}
          >
            <Icon icon={Trash2} size={16} />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const actionsHeader = <VisuallyHidden>Actions</VisuallyHidden>;

  const draftColumns: TableColumn<OneOffEmail>[] = [
    subjectCol,
    toCol,
    {
      key: "edited",
      header: "Edited",
      width: "150px",
      render: (o) => formatShort(o.updatedAt),
    },
    {
      key: "actions",
      header: actionsHeader,
      align: "right",
      width: "56px",
      render: (o) => rowMenu(o, true),
    },
  ];

  const sentColumns: TableColumn<OneOffEmail>[] = [
    subjectCol,
    toCol,
    {
      key: "date",
      header: "Sent",
      width: "130px",
      render: (o) =>
        o.status === "sending" ? (
          <Badge $variant="info">Sending</Badge>
        ) : (
          formatDate(o.sentAt ?? o.updatedAt)
        ),
    },
    {
      key: "count",
      header: "Recipients",
      width: "100px",
      render: (o) => o.recipientIds?.length ?? 0,
    },
    {
      key: "actions",
      header: actionsHeader,
      align: "right",
      width: "56px",
      render: (o) => rowMenu(o, false),
    },
  ];

  const newButton = (
    <Button type="button" onClick={() => router.push(`${ONE_OFF}/new`)}>
      <Icon icon={Plus} size={16} />
      {copy.newEmail}
    </Button>
  );

  return (
    <ListPage>
      <ListPageHeader title={copy.title} actions={newButton} />
      {inWindow.length > 0 && (
        <Stack>
          {inWindow.map((o) => (
            <UndoNotice key={o.id} oneOff={o} />
          ))}
        </Stack>
      )}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "drafts" | "sent")}>
        <ListPageToolbar
          tabs={
            <TabsList aria-label="Views">
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
          }
        />
        <TabsContent value="drafts">
          <PagedTable
            rows={drafts}
            columns={draftColumns}
            getRowId={(o) => o.id}
            ariaLabel="Drafts"
            searchText={(o) => o.content.subject}
            onRowClick={open}
            empty={
              <ListEmptyState
                items="drafts"
                empty={{
                  icon: FileText,
                  title: "No drafts",
                  action: newButton,
                }}
              />
            }
          />
        </TabsContent>
        <TabsContent value="sent">
          <PagedTable
            rows={sent}
            columns={sentColumns}
            getRowId={(o) => o.id}
            ariaLabel="Sent emails"
            searchText={(o) => o.content.subject}
            onRowClick={open}
            empty={
              <ListEmptyState
                items="sent emails"
                empty={{
                  icon: Mail,
                  title: "Nothing sent yet",
                  action: newButton,
                }}
              />
            }
          />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleting ? subjectOf(deleting) : ""}
            {deleteError ? ` ${deleteError}` : ""}
          </AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                $variant="danger"
                onClick={(e) => {
                  e.preventDefault();
                  void confirmDelete();
                }}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </ListPage>
  );
}

export function OneOffList() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <List />
    </Suspense>
  );
}
