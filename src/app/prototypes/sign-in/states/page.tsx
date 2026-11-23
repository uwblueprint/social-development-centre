import type { Metadata } from "next";
import Link from "next/link";
import { styled } from "next-yak";
import { stateGroups } from "../states";

export const metadata: Metadata = { title: "Sign-in screens" };

const Page = styled.main`
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-4);
`;

const Title = styled.h1`
  margin: 0 0 var(--space-5);
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const Group = styled.section`
  margin-bottom: var(--space-6);

  h2 {
    margin: 0 0 var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-muted);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    border-top: 1px solid var(--color-border);
  }
  li:last-child {
    border-bottom: 1px solid var(--color-border);
  }
  a {
    display: block;
    padding: var(--space-2) var(--space-3);
    color: var(--color-text);
    text-decoration: none;
  }
  a:hover {
    background: var(--color-bg-hover);
  }
  a:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export default function SignInStates() {
  return (
    <Page>
      <Title>Sign-in screens</Title>
      {stateGroups.map((group) => (
        <Group key={group.title}>
          <h2>{group.title}</h2>
          <ul>
            {group.states.map((state) => (
              <li key={state.id}>
                <Link href={`/prototypes/sign-in?state=${state.id}`}>
                  {state.label}
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      ))}
    </Page>
  );
}
