"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Compass, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { TagList } from "@/components/ui/Tag";
import { TOPIC_LABEL } from "@/features/opportunities/catalog";
import type { Opportunity } from "@/features/opportunities/types";
import { feedCopy } from "../copy";
import { buildForYou, matchedTopics } from "../matching";
import { NavButtonLink } from "./ButtonLink";
import { FeedCard } from "./FeedCard";
import { FeedHeader, FeedLead, FeedPage, FeedTitle } from "./FeedPage";
import { useMember } from "./MemberProvider";
import { Rail } from "./Rail";

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

const Everything = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
`;

const EverythingText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const EverythingTitle = styled.h2`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const EverythingBody = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/**
 * Picked from the interests chosen at onboarding: the single best match first (the shortest path to a click),
 * what's closing soon, then a row per topic. A listing appears once on the page. Editing interests re-sorts it instantly.
 */
export function ForYouView({ items }: { items: Opportunity[] }) {
  const { member, interests, now, editInterests } = useMember();
  const t = feedCopy.forYou;
  const plan = React.useMemo(() => buildForYou(items, interests, now), [items, interests, now]);
  const firstName = member.name.split(/\s+/)[0];

  const noneOpen = items.length === 0;
  const noInterests = interests.length === 0;

  return (
    <FeedPage>
      <FeedHeader>
        <Intro>
          <div>
            <FeedTitle>{t.title}</FeedTitle>
            <FeedLead>{noInterests ? t.greeting(firstName) : `${t.greeting(firstName)}. ${t.basedOn(interests.map((i) => TOPIC_LABEL[i]).join(", "))}`}</FeedLead>
          </div>
          {!noInterests && (
            <TagList>
              <Button type="button" $variant="outline" $size="sm" onClick={editInterests}>
                <Icon icon={Pencil} size={14} />
                {t.editInterests}
              </Button>
            </TagList>
          )}
        </Intro>
      </FeedHeader>

      {noneOpen ? (
        <EmptyState icon={Sparkles} title={t.empty.none.title} description={t.empty.none.body} />
      ) : noInterests ? (
        <EmptyState
          icon={Sparkles}
          title={t.empty.noInterests.title}
          description={t.empty.noInterests.body}
          action={<Button type="button" onClick={editInterests}>{t.empty.noInterests.action}</Button>}
        />
      ) : (
        <>
          {plan.hero ? (
            <FeedCard opportunity={plan.hero} feature because={matchedTopics(plan.hero, interests)[0]} />
          ) : (
            <EmptyState
              icon={Sparkles}
              title={t.empty.noMatches.title}
              description={t.empty.noMatches.body}
              action={
                <NavButtonLink href="/member/explore">{t.empty.noMatches.action}</NavButtonLink>
              }
            />
          )}

          {plan.closingSoon.length > 0 && (
            <Rail title={t.closingSoon} lead={t.closingSoonBody} seeAll={{ href: "/member/explore?when=week&sort=soonest", label: t.seeAllLabel(t.closingSoon) }}>
              {plan.closingSoon.map((o, i) => (
                <FeedCard key={o.id} opportunity={o} because={matchedTopics(o, interests)[0]} index={i} />
              ))}
            </Rail>
          )}

          {plan.rails.map((rail) => (
            <Rail key={rail.topic} title={rail.label} lead={t.becauseRailBody} seeAll={{ href: `/member/explore?topic=${rail.topic}`, label: t.seeAllLabel(rail.label) }}>
              {rail.items.map((o, i) => (
                <FeedCard key={o.id} opportunity={o} because={rail.topic} index={i} />
              ))}
            </Rail>
          ))}

          <Everything>
            <EverythingText>
              <EverythingTitle>{t.seeEverything}</EverythingTitle>
              <EverythingBody>{t.seeEverythingBody}</EverythingBody>
            </EverythingText>
            <NavButtonLink href="/member/explore" $variant="outline">
              <Icon icon={Compass} size={16} />
              {feedCopy.nav.explore}
            </NavButtonLink>
          </Everything>
        </>
      )}
    </FeedPage>
  );
}
