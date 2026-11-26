"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useEmails } from "../store";
import type { OneOffEmail, Send } from "../model";
import { BASE, copy, members } from "./copy";
import { Row } from "./parts";

/** The sends of one one-off email. */
export function sendsOf(sends: Send[], oneOffId: string): Send[] {
  return sends.filter(
    (s) => s.source.kind === "one-off" && s.source.oneOffId === oneOffId,
  );
}

/** The 1-minute window after Send: when it ends and a send to open in the Outbox. Null when it has passed. */
export function undoWindow(
  sends: Send[],
  oneOffId: string,
  now: Date,
): { msLeft: number; firstSendId: string } | null {
  let end = 0;
  let firstSendId = "";
  for (const s of sendsOf(sends, oneOffId)) {
    if (!s.undo || s.undo.action !== "one-off") continue;
    const t = new Date(s.undo.until).getTime();
    if (t > end) end = t;
    if (!firstSendId) firstSendId = s.id;
  }
  const msLeft = end - now.getTime();
  return msLeft > 0 && firstSendId ? { msLeft, firstSendId } : null;
}

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-success-border);
  border-radius: var(--radius-md);
  background: var(--color-success-subtle);
  font-size: var(--text-sm);
  min-width: 0;
`;

const Grow = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
`;

/**
 * Stands in for the toast's second action: the kit Toast takes one action, and the PRD wants Undo and
 * Update email. One line on the Sent tab and the sent page while the 1-minute window is open.
 */
export function UndoNotice({ oneOff }: { oneOff: OneOffEmail }) {
  const api = useEmails();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const win = undoWindow(api.state.sends, oneOff.id, api.now);
  if (!win) return null;
  const name = oneOff.content.subject.trim() || copy.noSubject;
  const count = oneOff.recipientIds?.length ?? 0;

  const undo = async () => {
    setBusy(true);
    setError(null);
    const r = await api.undoOneOff(oneOff.id);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast({ title: "Back in drafts" });
    router.push(`${BASE}/one-off/${oneOff.id}`);
  };

  return (
    <Line role="status">
      <Icon icon={MailCheck} size={16} />
      <Grow>
        Sending “{name}” to {members(count)} · {clock(win.msLeft)}
        {error && <span role="alert"> · {error}</span>}
      </Grow>
      <Row>
        <Button
          type="button"
          $variant="outline"
          $size="sm"
          disabled={busy}
          onClick={undo}
        >
          Undo
        </Button>
        <Button
          type="button"
          $variant="outline"
          $size="sm"
          onClick={() => router.push(`${BASE}/outbox?send=${win.firstSendId}`)}
        >
          Update email
        </Button>
      </Row>
    </Line>
  );
}
