"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Building, CalendarDays, ExternalLink, MapPin, Pencil, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { copy } from "../../copy";
import { formatWhen, formatWhenLine, formatWhere } from "../../format";
import type { Opportunity } from "../../types";
import { KindBadge } from "../opportunityColumns";
import { Section } from "./FormParts";
import type { Step } from "./formValues";

const t = copy.form.review;

const Preview = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
`;

/* The email shows the image in its own shape, full width, or centred if it's tall. */
const Photo = styled.img`
  display: block;
  max-width: 100%;
  max-height: calc(var(--space-8) * 6);
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
`;

const PreviewTitle = styled.h3`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;
`;

const Text = styled.p<{ $muted?: boolean }>`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: ${({ $muted }) => ($muted ? "var(--color-text-muted)" : "var(--color-text)")};
  overflow-wrap: anywhere;
`;

const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const Facts = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Fact = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text);

  & > svg {
    color: var(--color-text-muted);
  }
`;

const EmailActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
`;

/* The email's own buttons, drawn like the kit's primary and secondary buttons. */
const EmailButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  text-decoration: none;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/* No link yet: the same button, not clickable. */
const EmailButtonStatic = styled.span`
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const ShareButton = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const EditLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
`;

/**
 * Step 3: a read-only preview of the listing as members get it by email (title and type, description,
 * when, where and who hosts it, then Register and Send to a friend; topics aren't shown in the email), with Edit links back to steps 1 and 2. Publish lives in the form's action bar.
 */
export function ReviewStep({ preview, headingId, onEdit }: { preview: Opportunity; headingId: string; onEdit: (step: Step) => void }) {
  // A saved image that no longer loads isn't shown at all.
  const [brokenImage, setBrokenImage] = React.useState<string>();
  const when = formatWhen(preview);
  const where = formatWhere(preview);
  const cta = preview.kind === "other" && preview.details.callToAction ? preview.details.callToAction : t.cta[preview.kind];
  return (
    <Section title={copy.form.steps.review} headingId={headingId}>
      {/* The listing as it sits in a member's email: what it is, when and where, who runs it, then the actions. */}
      <Preview role="group" aria-label={t.previewLabel}>
        {preview.imageUrl && brokenImage !== preview.imageUrl && (
          <Photo src={preview.imageUrl} alt="" onError={() => setBrokenImage(preview.imageUrl)} />
        )}
        <TitleRow>
          <PreviewTitle>{preview.title || t.noTitle}</PreviewTitle>
          <KindBadge kind={preview.kind} />
        </TitleRow>
        <Text $muted={!preview.summary}>{preview.summary || t.noSummary}</Text>
        <Facts>
          {when && (
            <Fact>
              <Icon icon={CalendarDays} size={16} />
              {formatWhenLine(preview) ?? when}
            </Fact>
          )}
          {where && (
            <Fact>
              <Icon icon={MapPin} size={16} />
              {where}
            </Fact>
          )}
          <Fact>
            <Icon icon={Building} size={16} />
            {t.hostedBy(preview.organization.name)}
          </Fact>
        </Facts>
        <EmailActions>
          {preview.link ? (
            <EmailButton href={preview.link} target="_blank" rel="noopener noreferrer">
              {cta}
              <Icon icon={ExternalLink} size={14} />
            </EmailButton>
          ) : (
            <EmailButtonStatic>{cta}</EmailButtonStatic>
          )}
          {/* In the email this forwards the listing; here it only shows that it's there. */}
          <ShareButton aria-hidden="true">
            <Icon icon={Send} size={14} />
            {t.share}
          </ShareButton>
        </EmailActions>
      </Preview>
      <EditLinks>
        <Button type="button" $variant="secondary" $size="sm" onClick={() => onEdit(1)}>
          <Icon icon={Pencil} size={16} />
          {t.editType}
        </Button>
        <Button type="button" $variant="secondary" $size="sm" onClick={() => onEdit(2)}>
          <Icon icon={Pencil} size={16} />
          {t.editDetails}
        </Button>
      </EditLinks>
    </Section>
  );
}
