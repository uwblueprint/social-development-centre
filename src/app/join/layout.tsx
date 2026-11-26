import type { Metadata } from "next";
import { styled } from "next-yak";

export const metadata: Metadata = { title: "Join · SDC" };

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

/** The join steps a signup link opens. Open to anyone with the link: no sign-in. */
export default function JoinLayout({ children }: LayoutProps<"/join">) {
  return <Screen>{children}</Screen>;
}
