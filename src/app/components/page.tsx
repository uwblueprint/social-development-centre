import type { Metadata } from "next";
import type { ReactNode } from "react";
import { styled } from "next-yak";
import { ButtonDemos, SwitchDemos } from "./demos/BasicsDemos";

export const metadata: Metadata = {
  title: "Components · Social Development Centre",
};

const sections: { id: string; title: string; description: string; demo: ReactNode }[] = [
  { id: "buttons", title: "Buttons", description: "Primary, secondary, ghost and danger actions in three sizes.", demo: <ButtonDemos /> },
  { id: "switch", title: "Switch", description: "Binary on/off settings that apply immediately.", demo: <SwitchDemos /> },
];

const Shell = styled.div`
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);

  @media (max-width: 800px) {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-6);
    padding: var(--space-6) var(--space-4);
  }
`;

const Nav = styled.nav`
  position: sticky;
  top: var(--space-6);
  align-self: start;
  display: grid;
  gap: var(--space-1);

  @media (max-width: 800px) {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
`;

const NavLink = styled.a`
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: color var(--duration) var(--ease), background-color var(--duration) var(--ease);

  &:hover {
    color: var(--color-text);
    background: var(--color-surface);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const Header = styled.header`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-7);
`;

const Title = styled.h1`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  line-height: 1;
`;

const Lede = styled.p`
  margin: 0;
  max-width: 56ch;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
`;

const Section = styled.section`
  display: grid;
  gap: var(--space-5);
  padding: var(--space-7) 0;
  border-top: 1px solid var(--color-border);
  scroll-margin-top: var(--space-6);
`;

const SectionHead = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  line-height: 1.1;
`;

const SectionDescription = styled.p`
  margin: 0;
  color: var(--color-text-muted);
`;

const Preview = styled.div`
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  @media (max-width: 800px) {
    padding: var(--space-4);
  }
`;

export default function ComponentsPage() {
  return (
    <Shell>
      <Nav aria-label="Components">
        {sections.map((s) => (
          <NavLink key={s.id} href={`#${s.id}`}>
            {s.title}
          </NavLink>
        ))}
      </Nav>
      <main>
        <Header>
          <Title>Components</Title>
          <Lede>
            Every building block in the Social Development Centre UI kit, in
            every state. Built on Radix primitives for keyboard and screen
            reader support.
          </Lede>
        </Header>
        {sections.map((s) => (
          <Section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
            <SectionHead>
              <SectionTitle id={`${s.id}-title`}>{s.title}</SectionTitle>
              <SectionDescription>{s.description}</SectionDescription>
            </SectionHead>
            <Preview>{s.demo}</Preview>
          </Section>
        ))}
      </main>
    </Shell>
  );
}
