"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Mail } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { useEmails } from "../store";
import type { EmailContent, Member, Moment } from "../model";
import { plainText, sanitizeHtml } from "./richtext";

const Footer = styled.div`
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
`;

const Underlined = styled.span`
  text-decoration: underline;
`;

/** The automatically attached footer: greyed out, not editable. Used under the editor and in previews. */
export function EmailFooter({}: { showNote?: boolean }) {
  const { state } = useEmails();
  const { footer, mailingAddress } = state.settings;
  const parts = footer.split(/\{\{unsubscribe\}\}(.*?)\{\{\/unsubscribe\}\}/);
  return (
    <Footer role="group" aria-label="Email footer">
      <span>
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <Underlined key={i}>{p}</Underlined>
          ) : (
            <React.Fragment key={i}>{p}</React.Fragment>
          ),
        )}
        {" · "}
        {mailingAddress}
      </span>
    </Footer>
  );
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Inbox = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  align-items: start;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
`;

const InboxText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
`;

const Sender = styled.span`
  font-weight: var(--weight-medium);
`;

const Clip = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Muted = styled(Clip)`
  color: var(--color-text-muted);
`;

const Message = styled.div`
  max-width: 40rem;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-md);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;

  p {
    margin: 0 0 var(--space-3);
  }
  ul,
  ol {
    margin: 0 0 var(--space-3);
    padding-left: var(--space-5);
  }
  a {
    color: var(--color-text);
    text-decoration: underline;
  }
  [role="group"] {
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border);
  }
`;

const Subject = styled.p`
  && {
    margin: 0 0 var(--space-3);
    font-weight: var(--weight-medium);
  }
`;

const Empty = styled.span`
  color: var(--color-text-muted);
`;

/** Inbox-style card + rendered message for one member, fallbacks applied, footer greyed. */
export function EmailPreview({
  content,
  member,
  moment,
  inbox = true,
}: {
  content: EmailContent;
  member: Member;
  moment?: Moment;
  inbox?: boolean;
}) {
  const { renderFor, state } = useEmails();
  const out = renderFor(content, member, { moment });
  const html = sanitizeHtml(out.bodyHtml);
  const first = plainText(out.bodyHtml);
  return (
    <Card>
      {inbox ? (
        <Inbox>
          <Icon icon={Mail} size={20} />
          <InboxText>
            <Sender>{state.settings.senderName}</Sender>
            <Clip>{out.subject || "(No subject)"}</Clip>
            <Muted>{first || "(No message)"}</Muted>
          </InboxText>
        </Inbox>
      ) : null}
      <Message>
        {!inbox && <Subject>{out.subject || "(No subject)"}</Subject>}
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <Empty>(No message)</Empty>
        )}
        <EmailFooter showNote={false} />
      </Message>
    </Card>
  );
}
