"use client";

import { styled } from "next-yak";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { copy } from "../../copy";

/** An eventbrite.ca / .com event page, typed with or without https://. */
export const isEventbriteLink = (value?: string) =>
  /^(https?:\/\/)?([a-z0-9-]+\.)*eventbrite\.[a-z.]+\/e\//i.test((value ?? "").trim());

/* A calm note, not an alert: the link is recognized and we can fill in the rest. */
const Offer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-eventbrite-border);
  border-radius: var(--radius-md);
  background: var(--color-eventbrite-subtle);
`;

const OfferText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const OfferTitle = styled.span`
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const OfferError = styled.span`
  color: var(--color-danger);
`;

/* Eventbrite's mark (their orange disc with a lowercase "e"), so the link is recognized at a glance. */
function EventbriteMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" style={{ flex: "none" }}>
      <circle cx="14" cy="14" r="14" fill="var(--color-eventbrite)" />
      <path
        d="M9.2 14.6h9.3c.1-3.1-1.8-5.4-4.6-5.4-2.9 0-4.9 2.1-4.9 5 0 3 2 4.9 5 4.9 1.9 0 3.4-.8 4.3-2.3l-2-1c-.5.8-1.2 1.2-2.3 1.2-1.5 0-2.6-.9-2.8-2.4Zm.1-1.9c.3-1.3 1.3-2.1 2.6-2.1 1.4 0 2.3.8 2.5 2.1H9.3Z"
        fill="var(--color-bg)"
      />
    </svg>
  );
}

/** Offers to fill an event's details from its Eventbrite page; shows the last failure, if any. */
export function EventbriteOffer({ error, busy, onFill }: { error?: string; busy: boolean; onFill: () => void }) {
  return (
    <Offer role="status">
      <EventbriteMark />
      <OfferText>
        <OfferTitle>{copy.form.eventbrite.found}</OfferTitle>
        <span>{copy.form.eventbrite.hint}</span>
        {error && <OfferError role="alert">{error}</OfferError>}
      </OfferText>
      <Button type="button" $size="sm" onClick={onFill} aria-busy={busy || undefined}>
        <Icon icon={Sparkles} size={16} />
        {copy.form.eventbrite.fill}
      </Button>
    </Offer>
  );
}
