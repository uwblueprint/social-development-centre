import type { Metadata } from "next";
import { styled } from "next-yak";

export const metadata: Metadata = { title: "Goodbye" };

/* Shown right after someone leaves the admin portal, so they are signed out: no sidebar, no navigation. */
const Screen = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-6);
  text-align: center;
`;

const Message = styled.h1`
  margin: 0;
  max-width: 20ch;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

export default function GoodbyePage() {
  return (
    <Screen>
      <Message>Thank you for all the awesome work!</Message>
    </Screen>
  );
}
