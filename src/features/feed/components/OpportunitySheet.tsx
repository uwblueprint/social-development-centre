"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Building, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { Tag, TagList } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { TOPIC_LABEL } from "@/features/opportunities/catalog";
import { ImageMatte } from "@/features/opportunities/components/ImageMatte";
import { KindBadge } from "@/features/opportunities/components/opportunityColumns";
import type { Opportunity } from "@/features/opportunities/types";
import { feedCopy } from "../copy";
import { factsFor } from "../details";
import { CtaButton } from "./CtaButton";

const Photo = styled(ImageMatte)`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
`;

const Title = styled(SheetTitle)`
  overflow-wrap: anywhere;
`;

const Byline = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Summary = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3) var(--space-4);
  margin: 0;
`;

const FactLabel = styled.dt`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);

  & > svg {
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const FactValue = styled.dd`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;
`;

const Note = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Footer = styled(SheetFooter)`
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
`;

/** The full details of one opportunity, from any card or row. The button is the same one the card has. */
export function OpportunitySheet({ opportunity: o, open, onOpenChange }: { opportunity?: Opportunity; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();

  async function share() {
    if (!o) return;
    try {
      if (navigator.share) await navigator.share({ title: o.title, url: o.link });
      else {
        await navigator.clipboard.writeText(o.link);
        toast({ title: feedCopy.cta.shareDone });
      }
    } catch (error) {
      // Closing the share sheet is not an error.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ title: feedCopy.cta.shareFailed });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {o && (
          <>
            <SheetHeader>
              <KindBadge kind={o.kind} />
              <Title>{o.title}</Title>
              <SheetDescription>
                <Byline>
                  <Icon icon={Building} size={16} />
                  {feedCopy.sheet.hostedBy(o.organization.name)}
                </Byline>
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              {o.imageUrl && <Photo src={o.imageUrl} />}
              <Summary>{o.summary}</Summary>
              <Facts>
                {factsFor(o).map((fact) => (
                  <React.Fragment key={fact.label + fact.value}>
                    <FactLabel>
                      <Icon icon={fact.icon} size={16} />
                      {fact.label}
                    </FactLabel>
                    <FactValue>{fact.value}</FactValue>
                  </React.Fragment>
                ))}
              </Facts>
              {o.topics.length > 0 && (
                <TagList>
                  {o.topics.map((t) => (
                    <Tag key={t}>{TOPIC_LABEL[t]}</Tag>
                  ))}
                </TagList>
              )}
              <Note>{feedCopy.sheet.opensElsewhere(o.organization.name)}</Note>
            </SheetBody>
            <Footer>
              <Button type="button" $variant="outline" onClick={share}>
                <Icon icon={Share2} size={16} />
                {feedCopy.cta.share}
              </Button>
              <CtaButton opportunity={o} size="lg" />
            </Footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
