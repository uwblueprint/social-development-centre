"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { withChannel } from "../checkout";
import { PLANS } from "../plans";

/*
 * NOT PayPal: a plain grey stand-in for PayPal's own hosted checkout, which SDC doesn't design or host.
 * It only shows the two ways back: paying (PayPal returns them to the thank-you page) and cancelling
 * (back to the join form, details kept). Deliberately unbranded.
 */

const Screen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  min-height: 100vh;
  padding: var(--space-8) var(--space-4);
  background: var(--color-surface);
`;

const Banner = styled.p`
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-align: center;
  max-width: 400px;
`;

const Box = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 400px;
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  & h1 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

const Lines = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2) var(--space-3);
  margin: 0;
  font-size: var(--text-sm);

  & dt {
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    text-align: right;
    color: var(--color-text);
  }
`;

const Buttons = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

export function PayPalStandIn({ planId, via, referralCode }: { planId?: string; via?: string; referralCode?: string }) {
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const [paying, setPaying] = React.useState(false);

  function pay() {
    setPaying(true);
    // PayPal takes a moment, then sends them to SDC's return URL.
    setTimeout(() => window.location.assign(withChannel("/design/membership/welcome", { plan: plan.id, via, ref: referralCode })), 900);
  }

  return (
    <Screen data-design-public="">
      <Banner>Design stand-in for PayPal&rsquo;s own checkout page. The real one is hosted by PayPal.</Banner>
      <Box>
        <h1>Pay Social Development Centre</h1>
        <Lines>
          <dt>{plan.name} membership, 1 year</dt>
          <dd>${plan.price}.00 CAD</dd>
        </Lines>
        <Buttons>
          <Button type="button" $size="lg" onClick={pay} disabled={paying}>
            <Icon icon={Lock} />
            {paying ? "Paying…" : `Pay $${plan.price}.00`}
          </Button>
          <Button
            type="button"
            $variant="ghost"
            disabled={paying}
            onClick={() => window.location.assign(withChannel("/design/membership", { paypal: "cancelled", via, ref: referralCode }))}
          >
            Cancel and return to SDC
          </Button>
        </Buttons>
      </Box>
    </Screen>
  );
}
