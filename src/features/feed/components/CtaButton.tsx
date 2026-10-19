"use client";

import { keyframes, styled } from "next-yak";
import { Check, ExternalLink } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import type { Opportunity } from "@/features/opportunities/types";
import { feedCopy } from "../copy";
import { ctaLabel } from "../details";
import { ButtonLink } from "./ButtonLink";
import { useMember } from "./MemberProvider";

const pop = keyframes`
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
`;

/* The check fades in the moment the link opens; the button is otherwise the same size, so nothing shifts. */
const Mark = styled.span`
  display: inline-flex;
  animation: ${pop} var(--duration) var(--ease) both;
`;

const Label = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Arrow = styled.span`
  display: inline-flex;
  transition: transform var(--duration) var(--ease);
`;

/* The arrow nudges toward the corner on hover, a hint that this leaves the page. */
const Cta = styled(ButtonLink)`
  &:hover ${Arrow} {
    transform: translate(1px, -1px);
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/**
 * The action this whole feed exists for. It's a real link to the partner's own page (new tab), so it
 * works with no script and can be opened in a new window. Clicking keeps the opportunity in Your
 * opportunities (see MemberProvider): the button then reads "Opened" but stays a link, so it can be opened again.
 */
export function CtaButton({ opportunity, size = "md", block = false }: { opportunity: Opportunity; size?: "sm" | "md" | "lg"; block?: boolean }) {
  const { has, opened } = useMember();
  const isOpened = has(opportunity.id);
  const label = ctaLabel(opportunity);
  return (
    <Cta
      href={opportunity.link}
      target="_blank"
      rel="noopener noreferrer"
      $variant={isOpened ? "secondary" : "primary"}
      $size={size}
      $block={block}
      aria-label={isOpened ? feedCopy.card.openedLabel(label) : undefined}
      onClick={() => opened(opportunity)}
    >
      {isOpened ? (
        <>
          <Mark>
            <Icon icon={Check} size={16} />
          </Mark>
          <Label>{feedCopy.card.opened}</Label>
        </>
      ) : (
        <>
          <Label>{label}</Label>
          <Arrow>
            <Icon icon={ExternalLink} size={14} />
          </Arrow>
          <VisuallyHidden>{feedCopy.card.opensInNewTab}</VisuallyHidden>
        </>
      )}
    </Cta>
  );
}
