import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { styled } from "next-yak";
import { StateLabProvider } from "./_state-lab/StateLabProvider";

/*
 * Designers' screens sit next to a blank block where the sidebar will go, at the sidebar's width, so
 * every screen is designed for the space it will really have. When the real sidebar is ready, swap the
 * placeholder here for it. Phones get the full width, as they will with the real sidebar.
 */
const Frame = styled.div`
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const NavPlaceholder = styled.div`
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);

  @media (max-width: 767px) {
    display: none;
  }
`;

const Screen = styled.main`
  min-width: 0;
`;

/** Demo-data screens for review, not the product: available in `pnpm dev` only. */
export default function DesignLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <StateLabProvider>
      <Frame>
        <NavPlaceholder aria-hidden="true" />
        <Screen>{children}</Screen>
      </Frame>
    </StateLabProvider>
  );
}
