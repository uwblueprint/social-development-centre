import type { ReactNode } from "react";
import { styled } from "next-yak";

/* Member-facing pages have no navigation: one centered column. */
const Screen = styled.main`
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  margin: 0 auto;
  padding: var(--space-7) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  align-items: flex-start;
`;

export default function MemberDesignLayout({ children }: { children: ReactNode }) {
  return <Screen>{children}</Screen>;
}
