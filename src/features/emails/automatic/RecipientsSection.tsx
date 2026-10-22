"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, type TableColumn } from "@/components/ui/Table";
import { TruncatedText } from "@/components/ui/TruncatedText";
import type { Send } from "../model";
import { useEmails } from "../store";
import { recipientLine } from "./summary";

const PAGE = 25;

/** Everyone this email applied to, with a quiet reason. A member who was skipped is normal, so no red. */
export function RecipientsSection({ automaticId }: { automaticId: string }) {
  const api = useEmails();
  const [shown, setShown] = React.useState(PAGE);
  const sends = api.sendsFor(automaticId);
  const sorted = React.useMemo(() => [...sends].sort((a, b) => a.sendAt.localeCompare(b.sendAt)), [sends]);

  const columns: TableColumn<Send>[] = [
    {
      key: "member",
      header: "Member",
      width: "240px",
      render: (s) => {
        const m = api.member(s.memberId);
        const label = m ? [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email : "Removed member";
        return <TruncatedText tooltip>{label}</TruncatedText>;
      },
    },
    {
      key: "status",
      header: "Status",
      width: "170px",
      render: (s) => {
        const l = recipientLine(s);
        return <Badge $variant={l.variant}>{l.label}</Badge>;
      },
    },
    {
      key: "reason",
      header: "Reason",
      width: "260px",
      render: (s) => <TruncatedText tooltip>{recipientLine(s).reason}</TruncatedText>,
    },
  ];

  return (
    <>
      <Table columns={columns} rows={sorted.slice(0, shown)} getRowId={(s) => s.id} empty={<EmptyState icon={Users} title="No recipients yet" />} />
      {sorted.length > shown && (
        <div>
          <Button type="button" $variant="secondary" $size="sm" onClick={() => setShown((n) => n + PAGE)}>
            Show {Math.min(PAGE, sorted.length - shown)} more
          </Button>
        </div>
      )}
    </>
  );
}
