"use client";

import { styled } from "next-yak";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Tag, TagList } from "@/components/ui/Tag";
import { KIND_LABEL, TOPIC_LABEL } from "../../catalog";
import { copy } from "../../copy";
import { formatWhen, formatWhere } from "../../format";
import type { Opportunity } from "../../types";
import { KindIcon } from "../KindIcon";
import { Section } from "./FormParts";
import type { Step } from "./formValues";

const t = copy.form.review;

const Intro = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Preview = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
`;

const Eyebrow = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-2);
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
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

const Cta = styled.a`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);
  overflow-wrap: anywhere;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const EditLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
`;

/**
 * Step 3: a read-only preview of the listing as members get it by email (title, summary, date and area,
 * topics and the button), with Edit links back to steps 1 and 2. Publish lives in the form's action bar.
 */
export function ReviewStep({ preview, headingId, onEdit }: { preview: Opportunity; headingId: string; onEdit: (step: Step) => void }) {
  const when = formatWhen(preview);
  const where = formatWhere(preview);
  const cta = preview.kind === "other" && preview.details.callToAction ? preview.details.callToAction : t.cta[preview.kind];
  return (
    <Section title={copy.form.steps.review} headingId={headingId}>
      <Intro>{t.intro}</Intro>
      <Preview role="group" aria-label={t.previewLabel}>
        <Eyebrow>
          <KindIcon kind={preview.kind} size={14} />
          {KIND_LABEL[preview.kind]}
          <span aria-hidden="true">·</span>
          {t.postedBy(preview.organization.name)}
        </Eyebrow>
        <PreviewTitle>{preview.title || t.noTitle}</PreviewTitle>
        <Text>{[when, where].filter(Boolean).join(" · ")}</Text>
        <Text $muted={!preview.summary}>{preview.summary || t.noSummary}</Text>
        {preview.topics.length > 0 ? (
          <TagList>
            {preview.topics.map((topic) => (
              <Tag key={topic}>{TOPIC_LABEL[topic]}</Tag>
            ))}
          </TagList>
        ) : (
          <Text $muted>{t.noTopics}</Text>
        )}
        {preview.link ? (
          <Cta href={/^https?:\/\//i.test(preview.link) ? preview.link : `https://${preview.link}`} target="_blank" rel="noopener noreferrer">
            {cta}
            <Icon icon={ExternalLink} size={14} />
          </Cta>
        ) : (
          <Text $muted>{cta}</Text>
        )}
      </Preview>
      <EditLinks>
        <Button type="button" $variant="link" onClick={() => onEdit(1)}>
          {t.editType}
        </Button>
        <Button type="button" $variant="link" onClick={() => onEdit(2)}>
          {t.editDetails}
        </Button>
      </EditLinks>
    </Section>
  );
}
