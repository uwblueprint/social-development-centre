"use client";

import { useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { SearchField } from "@/components/ui/SearchField";
import { FormError } from "@/features/auth/AuthScreen";
import { chooseTier } from "./actions";
import { formatPrice, type OfferedTier } from "./types";

/** Search only helps once the list is long enough to scroll past. */
const SEARCH_FROM = 8;

const Screen = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: var(--space-6) var(--space-4) 0;
`;

const Column = styled.div`
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--space-4);
`;

const Heading = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

const Intro = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/* Rows are separated by 1px lines, like every list in the kit; the page scrolls, not the list. */
const Options = styled(RadioGroup)`
  gap: 0;
  border-top: 1px solid var(--color-border);

  & > label {
    border-bottom: 1px solid var(--color-border);
    border-radius: 0;
    padding-block: var(--space-3);
  }
`;

const OptionLabel = styled.span`
  display: flex;
  flex: 1;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
`;

const OptionName = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const OptionPrice = styled.span`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
`;

/* Stays at the bottom of the screen, so the choice and its button are never scrolled away. */
const ConfirmBar = styled.div`
  position: sticky;
  bottom: 0;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
`;

const Choice = styled.span`
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

const Message = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/**
 * Choose one tier, once. A member who already has a tier never reaches this page (the route sends them
 * home), so after confirming there is nothing to change: it just says what they chose.
 */
export function TierPicker({ tiers }: { tiers: OfferedTier[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const [chosen, setChosen] = useState<OfferedTier>();
  const [pending, startTransition] = useTransition();

  const selected = tiers.find((t) => t.id === selectedId);
  const needle = query.trim().toLowerCase();
  const visible = needle ? tiers.filter((t) => t.name.toLowerCase().includes(needle)) : tiers;

  function confirm() {
    if (!selected || pending) {
      setError("Please select a tier.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await chooseTier(selected.id);
      if (result.status === "success") setChosen(selected);
      else setError(result.message ?? "Something went wrong. Try again.");
    });
  }

  if (chosen) {
    return (
      <Screen>
        <Column>
          <Heading role="status">
            You’re on {chosen.name}, {formatPrice(chosen.priceCad)}.
          </Heading>
          <Intro>Thank you. Your tier is saved.</Intro>
        </Column>
      </Screen>
    );
  }

  return (
    <Screen>
      <Column>
        <Heading>Choose your tier</Heading>
        <Intro>Pick one. All prices are in Canadian dollars.</Intro>

        {tiers.length === 0 ? (
          <Message>There are no tiers to choose from yet. Check back soon.</Message>
        ) : (
          <>
            {tiers.length > SEARCH_FROM && (
              <SearchField
                aria-label="Search tiers"
                placeholder="Search tiers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onSearch={setQuery}
              />
            )}
            {visible.length === 0 ? (
              <Message role="status">No tiers match “{query.trim()}”.</Message>
            ) : (
              <Options
                aria-label="Tiers"
                value={selectedId}
                onValueChange={(id) => {
                  setSelectedId(id);
                  setError(undefined);
                }}
              >
                {visible.map((tier) => (
                  <RadioGroupOption
                    key={tier.id}
                    value={tier.id}
                    label={
                      <OptionLabel>
                        <OptionName>{tier.name}</OptionName>
                        <OptionPrice>{formatPrice(tier.priceCad)}</OptionPrice>
                      </OptionLabel>
                    }
                  />
                ))}
              </Options>
            )}
          </>
        )}

        {error && (
          <FormError role="alert">
            <Icon icon={CircleAlert} size={16} />
            {error}
          </FormError>
        )}

        {tiers.length > 0 && (
          <ConfirmBar>
            <Choice>{selected ? `${selected.name}, ${formatPrice(selected.priceCad)}` : "No tier chosen yet"}</Choice>
            <Button type="button" onClick={confirm} aria-busy={pending || undefined}>
              {pending ? "Saving…" : "Confirm tier"}
            </Button>
          </ConfirmBar>
        )}
      </Column>
    </Screen>
  );
}
