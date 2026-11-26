"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { memberCopy } from "./copy";

const EVERY_MS = 3_000;
const GIVE_UP_AFTER = 20;

/**
 * Re-reads the page from the server every few seconds while we wait for PayPal to confirm a payment.
 * After about a minute it stops and says so; the webhook still updates the membership later.
 */
export function AutoRefresh() {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= GIVE_UP_AFTER) return;
    const timer = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, EVERY_MS);
    return () => clearTimeout(timer);
  }, [router, tries]);

  return <Status role="status">{tries >= GIVE_UP_AFTER ? memberCopy.thanksSlow : memberCopy.thanksConfirming}</Status>;
}

const Status = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  text-align: center;
`;
