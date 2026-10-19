"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Check, Clock, Copy, TriangleAlert } from "lucide-react";
import { ListPage } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import type { TableColumn } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { EmailPreview } from "../editor";
import {
  EXCLUSION_REASON,
  NOT_SENT_LABEL,
  type Member,
  type OneOffEmail,
} from "../model";
import { useEmails } from "../store";
import {
  ONE_OFF,
  copy,
  formatDateTime,
  memberName,
  members as membersWord,
  toWhom,
} from "./copy";
import { plainSubject } from "../editor/richtext";
import { PagedTable } from "./PagedTable";
import { Quiet, Stack, VisuallyHidden } from "./parts";
import { Fold, MemberCell } from "./RecipientsSheet";
import { UndoNotice, sendsOf } from "./UndoNotice";

interface RecipientRow {
  id: string;
  member: Member | undefined;
  status: "sent" | "not-sent" | "sending";
  reason?: string;
}

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
`;

const Heading = styled.div`
  flex: 1 1 240px;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 720px;
  min-width: 0;
`;

export function SentDetail({ oneOff }: { oneOff: OneOffEmail }) {
  const api = useEmails();
  const router = useRouter();
  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const subject = plainSubject(oneOff.content.subject.trim()) || copy.noSubject;

  const sends = sendsOf(api.state.sends, oneOff.id);
  const rows: RecipientRow[] = (oneOff.recipientIds ?? []).map((id) => {
    const send = sends.find((s) => s.memberId === id);
    const member = api.member(id);
    if (!send) return { id, member, status: "sending" };
    if (send.status === "sent") return { id, member, status: "sent" };
    if (send.status === "not-sent")
      return {
        id,
        member,
        status: "not-sent",
        reason: send.notSentReason
          ? NOT_SENT_LABEL[send.notSentReason]
          : undefined,
      };
    return { id, member, status: "sending" };
  });
  const excluded = (oneOff.excludedIds ?? [])
    .map((id) => api.member(id))
    .filter((m): m is Member => !!m);
  const opened = rows.find((r) => r.id === openId)?.member;

  const duplicate = () => {
    const d = api.duplicateOneOff(oneOff.id);
    toast({ title: "Copied to a new draft" });
    router.push(`${ONE_OFF}/${d.id}`);
  };

  const columns: TableColumn<RecipientRow>[] = [
    {
      key: "who",
      header: "Member",
      width: "280px",
      render: (r) =>
        r.member ? <MemberCell m={r.member} /> : <Quiet>Member removed</Quiet>,
    },
    {
      key: "status",
      header: "Status",
      width: "260px",
      render: (r) =>
        r.status === "sent" ? (
          <Badge $variant="success">
            <Icon icon={Check} size={12} />
            Sent
          </Badge>
        ) : r.status === "sending" ? (
          <Badge $variant="info">
            <Icon icon={Clock} size={12} />
            Sending
          </Badge>
        ) : (
          <>
            <Badge $variant="warning">
              <Icon icon={TriangleAlert} size={12} />
              Not sent
            </Badge>{" "}
            <Quiet>{r.reason ?? ""}</Quiet>
          </>
        ),
    },
  ];

  return (
    <ListPage>
      <Bar>
        <Heading>
          <Title>{subject}</Title>
          <Quiet>
            {formatDateTime(oneOff.sentAt) || "Sending now"} ·{" "}
            {toWhom(oneOff.audience)} · {membersWord(rows.length)}
          </Quiet>
        </Heading>
        <Button type="button" $variant="secondary" onClick={duplicate}>
          <Icon icon={Copy} size={16} />
          Duplicate
        </Button>
      </Bar>
      <Column>
        <UndoNotice oneOff={oneOff} />
        <Stack>
          <PagedTable
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            ariaLabel="Recipients"
            filterLabel="Filter by name or email"
            searchText={(r) =>
              r.member ? `${memberName(r.member)} ${r.member.email}` : ""
            }
            onRowClick={(r) => r.member && setOpenId(r.id)}
            empty={<Quiet>No recipients</Quiet>}
          />
          {excluded.length > 0 && (
            <Fold label={`Not included (${excluded.length})`}>
              <PagedTable
                rows={excluded}
                getRowId={(m) => m.id}
                ariaLabel="Not included"
                searchText={(m) => `${memberName(m)} ${m.email}`}
                columns={[
                  {
                    key: "who",
                    header: "Member",
                    width: "280px",
                    render: (m) => <MemberCell m={m} />,
                  },
                  {
                    key: "why",
                    header: "Reason",
                    width: "140px",
                    render: (m) => (
                      <Quiet>
                        {m.status === "active"
                          ? "Excluded"
                          : EXCLUSION_REASON[m.status]}
                      </Quiet>
                    ),
                  },
                ]}
              />
            </Fold>
          )}
        </Stack>
      </Column>

      <Sheet open={openId !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent size="wide" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>
              {opened ? (
                memberName(opened)
              ) : (
                <VisuallyHidden>Email</VisuallyHidden>
              )}
            </SheetTitle>
          </SheetHeader>
          <SheetBody>
            {opened && (
              <EmailPreview content={oneOff.content} member={opened} />
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </ListPage>
  );
}
