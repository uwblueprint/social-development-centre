import { styled } from "next-yak";
import { SignInForm } from "./SignInForm";

const Main = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-4);
`;

const Column = styled.div`
  width: 100%;
  max-width: 360px;
`;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // `error` comes from a sign-in link that failed; its detail is logged by /auth/confirm, never shown.
  const { error } = await searchParams;

  return (
    <Main>
      <Column>
        <SignInForm linkFailed={Boolean(error)} />
      </Column>
    </Main>
  );
}
