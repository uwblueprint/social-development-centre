"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { SentEmail } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { formatDate } from "../_lib/format";

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-2);
`;

const TriggerRow = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  text-align: left;
`;

const MetaLine = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const Subject = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
`;

const Meta = styled.span`
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

/*
 * `sandbox=""` gives this frame the strictest sandbox (no scripts, forms or
 * same-origin access), which is what keeps an arbitrary sent email safe to
 * render — but it also means this window can't read the frame's own
 * `scrollHeight` to size it exactly. A generous fixed height with its own
 * scrollbar is the practical stand-in for "auto" height under that constraint.
 */
const Frame = styled.iframe`
  display: block;
  width: 100%;
  height: 360px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
`;

const EmptyLine = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

export function MemberEmailsTab({
  emails,
  loading,
  error,
}: {
  emails: SentEmail[] | null;
  loading: boolean;
  error: boolean;
}) {
  const [open, setOpen] = React.useState<string[]>([]);

  if (loading) return <EmptyLine>{copy.emailsTab.loading}</EmptyLine>;
  if (error) return <EmptyLine>{copy.emailsTab.loadError}</EmptyLine>;
  if (!emails || emails.length === 0) return <EmptyLine>{copy.emailsTab.empty}</EmptyLine>;

  const allIds = emails.map((email) => email.id);
  const allOpen = open.length === allIds.length;

  return (
    <div>
      <Toolbar>
        <Button type="button" $variant="ghost" $size="sm" onClick={() => setOpen(allOpen ? [] : allIds)}>
          {allOpen ? copy.emailsTab.collapseAll : copy.emailsTab.expandAll}
        </Button>
      </Toolbar>
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        {emails.map((email) => (
          <AccordionItem key={email.id} value={email.id}>
            <AccordionTrigger>
              <TriggerRow>
                <Subject title={email.subject}>{email.subject}</Subject>
                <MetaLine>
                  <Meta>
                    {copy.emailsTab.kindLabel(email.kind)} · {formatDate(email.sentAt)}
                  </Meta>
                  {email.status === "bounced" && <Badge $variant="danger">{copy.emailsTab.bouncedBadge}</Badge>}
                </MetaLine>
              </TriggerRow>
            </AccordionTrigger>
            <AccordionContent>
              <div>
                <Frame title={copy.emailsTab.previewTitle(email.subject)} srcDoc={email.html} sandbox="" />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
