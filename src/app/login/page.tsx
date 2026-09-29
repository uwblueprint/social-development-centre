import { styled } from "next-yak";
import { SignInForm } from "./SignInForm";

/** New, needs approval: the owner's UX spec (retired), "Account and sign-out". */
const goodbyeCopy = {
  signedOut: (name?: string) => (name ? `You're signed out. See you soon, ${name}.` : "You're signed out. See you soon."),
};

const Main = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-4);
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 360px;
`;

/* A quiet goodbye above the form: muted body text, no banner. */
const Goodbye = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

type LoginSearchParams = { error?: string; signedOut?: string; name?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  // `error` comes from a sign-in link that failed; its detail is logged by /auth/confirm, never shown.
  // `signedOut` (with an optional first `name`) comes from the sign-out action.
  const { error, signedOut, name } = await searchParams;
  const goodbye = signedOut ? goodbyeCopy.signedOut(name?.trim().slice(0, 40) || undefined) : null;

  return (
    <Main>
      <Column>
        {goodbye && <Goodbye role="status">{goodbye}</Goodbye>}
        <SignInForm linkFailed={Boolean(error)} />
      </Column>
    </Main>
  );
}
