"use client";

import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Table, type TableColumn } from "@/components/ui/Table";
import { TruncatedEmail, TruncatedText } from "@/components/ui/TruncatedText";
import { EXCLUSION_REASON, type Member } from "../model";
import { useEmails } from "../store";
import { ONE_OFF, memberName } from "./copy";
import { LoadErrorPage, LoadingPage } from "./parts";

/**
 * STAND-IN for the Member Directory, which is out of scope. In the real product "Email this member" sits on a
 * member's profile and opens a draft addressed to that one person (`/one-off/new?member=<id>`).
 */
export function FromMember() {
  const api = useEmails();
  const router = useRouter();
  const load = api.usePageLoad();
  if (load.status === "loading")
    return <LoadingPage title="Email this member" />;
  if (load.status === "error")
    return <LoadErrorPage title="Email this member" onRetry={load.retry} />;

  const members = api.state.members;
  const sample = [
    ...members.filter((m) => m.status === "active").slice(0, 6),
    ...members.filter((m) => m.status !== "active").slice(0, 2),
  ];
  const columns: TableColumn<Member>[] = [
    {
      key: "name",
      header: "Name",
      width: "220px",
      render: (m) => <TruncatedText tooltip>{memberName(m)}</TruncatedText>,
    },
    {
      key: "email",
      header: "Email",
      width: "260px",
      render: (m) => <TruncatedEmail email={m.email} />,
    },
    {
      key: "status",
      header: "Status",
      width: "180px",
      render: (m) =>
        m.status === "active" ? (
          <Badge $variant="success">Active</Badge>
        ) : (
          <Badge $variant="danger">{EXCLUSION_REASON[m.status]}</Badge>
        ),
    },
    {
      key: "action",
      header: "Actions",
      align: "right",
      width: "200px",
      render: (m) => (
        <Button
          type="button"
          $variant="secondary"
          $size="sm"
          aria-label={`Email ${memberName(m)}`}
          onClick={() => router.push(`${ONE_OFF}/new?member=${m.id}`)}
        >
          <Icon icon={Mail} size={16} />
          Email this member
        </Button>
      ),
    },
  ];

  return (
    <ListPage>
      <ListPageHeader title="Email this member" />
      <Table
        aria-label="Members"
        columns={columns}
        rows={sample}
        getRowId={(m) => m.id}
      />
    </ListPage>
  );
}
