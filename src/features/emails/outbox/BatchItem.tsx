"use client";

import { useEffect, useState } from "react";
import { styled } from "next-yak";
import {
  Ban,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Lock,
  MoreHorizontal,
  Pencil,
  Send as SendIcon,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Accordion,
} from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { useEmails } from "../store";
import type { Send } from "../model";
import { Notice } from "./Notice";
import { SendPanel } from "./SendPanel";
import type { Guard } from "./SendPanel";
import { useSendActions } from "./actions";
import {
  ApproveAllDialog,
  DontSendDialog,
  SendNowDialog,
} from "./Confirmations";
import {
  approveButtonLabel,
  batchKeyOf,
  batchStatus,
  fullName,
  isDue,
  lockedByOther,
  notSentText,
  plural,
  sendStatus,
  tagsLine,
  undoLeft,
} from "./helpers";
import type { Batch, StatusKind } from "./helpers";

const ICON: Record<StatusKind, LucideIcon> = {
  review: CircleAlert,
  couldnt: TriangleAlert,
  scheduled: CalendarClock,
};

/* A row is a fixed grid: [chevron + name | count | status] then the actions, so columns align on every row. */
const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0 var(--space-2);
  font-size: var(--text-sm);

  /* The kit's trailing plus is replaced by a leading chevron. */
  & h3 > button > svg {
    display: none;
  }
  & h3 > button[data-state] {
    padding: var(--space-2) 0;
    font-size: var(--text-sm);
  }
  & button[data-state="open"] svg[data-chevron] {
    transform: rotate(90deg);
  }
`;

const Summary = styled.span<{ $recipient?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  width: 100%;
  min-width: 0;

  @media (min-width: 720px) {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      ${({ $recipient }) => ($recipient ? "minmax(0, 1fr) 144px" : "96px 144px")};
  }
`;

const Name = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-weight: var(--weight-regular);
  overflow-wrap: anywhere;
`;

const Cell = styled.span`
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
`;

const Side = styled.div<{ $width: string }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-1);
  min-width: ${({ $width }) => $width};
`;

const Nested = styled.div`
  & > div {
    padding-left: var(--space-4);
  }
`;

const Tags = styled.span`
  flex: 1 1 120px;
  min-width: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
`;

const Small = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  white-space: nowrap;
`;

const Quiet = styled.ul`
  margin: 0;
  padding: var(--space-2) 0 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
`;

const Bar = styled.div`
  height: var(--space-4);
  margin: var(--space-2) 0;
  border-radius: var(--radius-sm);
  background: var(--color-bg-hover);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

export type OpenSend = (id: string | null, edit?: "one" | "batch") => void;

/** One batch: a collapsed row (name, count, one status, one action) that expands to its recipients. */
export function BatchItem({
  batch,
  showDay,
  openSendId,
  autoEdit,
  onOpenSend,
  onEditAll,
  registerGuard,
}: {
  batch: Batch;
  showDay: boolean;
  openSendId: string | null;
  autoEdit: { id: string; mode: "one" | "batch" } | null;
  onOpenSend: OpenSend;
  onEditAll: (batch: Batch) => void;
  registerGuard: (g: Guard | null) => void;
}) {
  const api = useEmails();
  const actions = useSendActions();
  const [ask, setAsk] = useState<null | "approve" | "now" | "dont">(null);
  const status = batchStatus(batch, showDay);
  const sendable = batch.sends.filter((s) => !lockedByOther(s, api.now));
  const reviewable = batch.review.filter((s) => !lockedByOther(s, api.now));
  const undoable = batch.sends.filter(
    (s) =>
      s.undo &&
      undoLeft(s, api.now) > 0 &&
      (s.undo.action === "approve" || s.undo.action === "send-now"),
  );
  const seconds = undoable.length
    ? Math.max(...undoable.map((s) => undoLeft(s, api.now)))
    : 0;

  return (
    <AccordionItem value={batch.key}>
      <Row>
        <AccordionTrigger>
          <Summary>
            <Name>
              <Icon icon={ChevronRight} size={16} data-chevron="" />
              {batch.name}
            </Name>
            <Cell>{plural(batch.sends.length, "member")}</Cell>
            <span>
              {status.kind !== "scheduled" && (
                <Badge $variant={status.tone}>
                  <Icon icon={ICON[status.kind]} size={14} />
                  {status.text}
                </Badge>
              )}
            </span>
          </Summary>
        </AccordionTrigger>
        <Side $width="72px">
          {undoable.length > 0 ? (
            <Button
              type="button"
              $variant="secondary"
              $size="sm"
              disabled={actions.busy}
              onClick={() => void actions.undo(undoable, batch.name)}
            >
              Undo ({seconds}s)
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                $variant="ghost"
                $size="sm"
                aria-label={`More actions for ${batch.name}`}
              >
                <Icon icon={MoreHorizontal} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {reviewable.length > 0 && (
                <DropdownMenuItem
                  disabled={actions.busy || api.lab.offline}
                  onSelect={() => setAsk("approve")}
                >
                  <Icon icon={Check} size={16} />
                  Approve all
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={!sendable.length || actions.busy || api.lab.offline}
                onSelect={() => setAsk("now")}
              >
                <Icon icon={SendIcon} size={16} />
                Send now
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!sendable.length}
                onSelect={() => onEditAll(batch)}
              >
                <Icon icon={Pencil} size={16} />
                Edit for everyone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                $variant="danger"
                disabled={!sendable.length || actions.busy}
                onSelect={() => setAsk("dont")}
              >
                <Icon icon={Ban} size={16} />
                Don’t send
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Side>
      </Row>
      <AccordionContent>
        <Nested>
          <Recipients
            batch={batch}
            openSendId={openSendId}
            autoEdit={autoEdit}
            onOpenSend={onOpenSend}
            registerGuard={registerGuard}
          />
        </Nested>
      </AccordionContent>

      <ApproveAllDialog
        open={ask === "approve"}
        onOpenChange={(o) => !o && setAsk(null)}
        sends={reviewable}
        name={batch.name}
        onConfirm={() => actions.approve(reviewable, batch.name)}
      />
      <SendNowDialog
        open={ask === "now"}
        onOpenChange={(o) => !o && setAsk(null)}
        sends={sendable}
        name={batch.name}
        onConfirm={() => actions.sendNow(sendable, batch.name)}
      />
      <DontSendDialog
        open={ask === "dont"}
        onOpenChange={(o) => !o && setAsk(null)}
        sends={sendable}
        name={batch.name}
        onConfirm={() => actions.dontSend(sendable, batch.name)}
      />
    </AccordionItem>
  );
}

function Recipients({
  batch,
  openSendId,
  autoEdit,
  onOpenSend,
  registerGuard,
}: {
  batch: Batch;
  openSendId: string | null;
  autoEdit: { id: string; mode: "one" | "batch" } | null;
  onOpenSend: OpenSend;
  registerGuard: (g: Guard | null) => void;
}) {
  const api = useEmails();
  const actions = useSendActions();
  const load = api.usePageLoad();
  const [brief, setBrief] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBrief(false), 350);
    return () => clearTimeout(t);
  }, []);
  const [notSentOpen, setNotSentOpen] = useState(false);

  const plain = batch.key.replace(/^w\|/, "");
  const notSent: Send[] = api.state.sends.filter(
    (s) => s.status === "not-sent" && batchKeyOf(s) === plain,
  );
  const sorted = [...batch.sends].sort((a, b) =>
    fullName(api.member(a.memberId)).localeCompare(
      fullName(api.member(b.memberId)),
    ),
  );
  const members = batch.sends
    .map((s) => api.member(s.memberId))
    .filter((m): m is NonNullable<typeof m> => !!m);
  const mine = batch.sends.some((s) => s.id === openSendId) ? openSendId : null;

  if (load.status === "error") {
    return (
      <Notice
        tone="danger"
        actions={
          <Button
            type="button"
            $variant="secondary"
            $size="sm"
            onClick={load.retry}
          >
            Try again
          </Button>
        }
      >
        Couldn’t load recipients
      </Notice>
    );
  }
  if (load.status === "loading" || brief) {
    return (
      <Stack aria-busy="true" aria-label="Loading recipients">
        {Array.from(
          { length: Math.min(4, Math.max(1, batch.sends.length)) },
          (_, i) => (
            <Bar key={i} />
          ),
        )}
      </Stack>
    );
  }

  if (sorted.length === 1 && notSent.length === 0) {
    const only = sorted[0];
    return (
      <Stack>
        {actions.error && <Notice tone="danger">{actions.error}</Notice>}
        <SendPanel
          sendId={only.id}
          batchMembers={members}
          registerGuard={registerGuard}
          autoEdit={autoEdit?.id === only.id ? autoEdit.mode : undefined}
        />
      </Stack>
    );
  }

  return (
    <Stack>
      {actions.error && <Notice tone="danger">{actions.error}</Notice>}
      {batch.sends.length > 0 && (
        <Accordion
          type="single"
          collapsible
          value={mine ?? ""}
          onValueChange={(v) => onOpenSend(v || null)}
        >
          {sorted.map((s) => (
            <RecipientItem
              key={s.id}
              send={s}
              batchName={batch.name}
              hideStatus={batch.sends.length === 1}
              open={mine === s.id}
              onEdit={() => onOpenSend(s.id, "one")}
            >
              <SendPanel
                sendId={s.id}
                batchMembers={members}
                registerGuard={registerGuard}
                autoEdit={autoEdit?.id === s.id ? autoEdit.mode : undefined}
              />
            </RecipientItem>
          ))}
        </Accordion>
      )}
      {notSent.length > 0 && (
        <Collapsible open={notSentOpen} onOpenChange={setNotSentOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" $variant="ghost" $size="sm">
              <Icon icon={ChevronDown} size={16} />
              {notSent.length} not sent
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Quiet>
              {notSent.map((s) => (
                <li key={s.id}>
                  {fullName(api.member(s.memberId))}:{" "}
                  {notSentText(s).replace("Not sent: ", "")}
                  {s.undo?.action === "dont-send" && (
                    <>
                      {" "}
                      <Button
                        type="button"
                        $variant="ghost"
                        $size="sm"
                        onClick={() => void actions.undo([s], batch.name)}
                      >
                        Undo
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </Quiet>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Stack>
  );
}

/** A recipient: name, one line of tags, one status, a ⋯ menu. Expands to their email. */
function RecipientItem({
  send,
  batchName,
  hideStatus,
  open,
  onEdit,
  children,
}: {
  send: Send;
  batchName: string;
  hideStatus?: boolean;
  open: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const api = useEmails();
  const actions = useSendActions();
  const [askDont, setAskDont] = useState(false);
  const m = api.member(send.memberId);
  const holder = lockedByOther(send, api.now);
  const st = sendStatus(send, api.now);
  const inactive = !!m && m.status !== "active";
  const canAct = !holder && !inactive && !actions.busy;
  const needsReview = send.status === "waiting-review" && !send.couldntSend;
  const name = fullName(m);

  return (
    <AccordionItem value={send.id}>
      <Row>
        <AccordionTrigger>
          <Summary $recipient>
            <Name>
              <Icon icon={ChevronRight} size={16} data-chevron="" />
              {name}
              {send.editedContent && <Small>Edited</Small>}
            </Name>
            <Tags>
              <TruncatedText tooltip>{tagsLine(m) || " "}</TruncatedText>
            </Tags>
            <span>
              {holder ? (
                <Small>
                  <Icon icon={Lock} size={14} />
                  {holder}
                </Small>
              ) : st.kind === "scheduled" ||
                hideStatus ||
                (st.kind === "review" && !isDue(send, api.now)) ? null : (
                <Small>
                  <Icon icon={ICON[st.kind]} size={14} />
                  {st.text}
                </Small>
              )}
            </span>
          </Summary>
        </AccordionTrigger>
        <Side $width="40px">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                $variant="ghost"
                $size="sm"
                aria-label={`More actions for ${name}`}
              >
                <Icon icon={MoreHorizontal} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {needsReview && (
                <DropdownMenuItem
                  disabled={!canAct}
                  onSelect={() => void actions.approve([send], batchName)}
                >
                  <Icon icon={Check} size={16} />
                  {approveButtonLabel(send, api.now)}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={!canAct || api.lab.offline}
                onSelect={() => void actions.sendNow([send], batchName)}
              >
                <Icon icon={SendIcon} size={16} />
                Send now
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canAct} onSelect={onEdit}>
                <Icon icon={Pencil} size={16} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                $variant="danger"
                disabled={!canAct}
                onSelect={() => setAskDont(true)}
              >
                <Icon icon={Ban} size={16} />
                Don’t send
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Side>
      </Row>
      <AccordionContent>{open ? children : <span />}</AccordionContent>
      <DontSendDialog
        open={askDont}
        onOpenChange={setAskDont}
        sends={[send]}
        name={batchName}
        onConfirm={() => actions.dontSend([send], batchName)}
      />
    </AccordionItem>
  );
}
