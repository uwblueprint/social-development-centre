import Image from "next/image";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";

const Page = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-6) var(--space-4) calc(var(--space-8) + var(--space-7));
  background: var(--color-surface);
`;

/** Matches supabase/templates/sign-in.html: one white card with the logo, a heading, text and one button. */
const Sheet = styled.article`
  width: 100%;
  max-width: 576px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
`;

const Envelope = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-1) var(--space-3);
  margin: 0;
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);

  dt {
    color: var(--color-text-subtle);
  }
  dd {
    margin: 0;
    color: var(--color-text);
    overflow-wrap: anywhere;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-6);

  @media (max-width: 480px) {
    padding: var(--space-6) var(--space-4);
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-display);
  font-weight: var(--weight-medium);
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);
`;

const Paragraph = styled.p`
  margin: 0;
  line-height: var(--leading-prose);
  color: var(--color-text);
`;

const Small = styled.p`
  margin: 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  align-self: stretch;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

export function EmailPreview({
  to,
  subject,
  title,
  body,
  action,
  onAction,
  footer,
}: {
  to: string;
  subject: string;
  title: string;
  body: string[];
  action?: string;
  onAction?: () => void;
  footer?: string;
}) {
  return (
    <Page>
      <Sheet aria-label={`Email: ${subject}`}>
        <Envelope>
          <dt>From</dt>
          <dd>SDC</dd>
          <dt>To</dt>
          <dd>{to}</dd>
          <dt>Subject</dt>
          <dd>{subject}</dd>
        </Envelope>
        <Body>
          <Image
            src="/brand/sdc-logo.png"
            alt="Social Development Centre Waterloo Region"
            width={92}
            height={72}
          />
          <Title>{title}</Title>
          {body.map((paragraph) => (
            <Paragraph key={paragraph}>{paragraph}</Paragraph>
          ))}
          {action && (
            <Button type="button" $size="lg" onClick={onAction}>
              {action}
            </Button>
          )}
          {footer && <Small>{footer}</Small>}
        </Body>
      </Sheet>
    </Page>
  );
}
