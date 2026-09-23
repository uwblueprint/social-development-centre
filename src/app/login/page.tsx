import { styled } from "next-yak";
import { signIn } from "./actions";

const Main = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
`;

const Form = styled.form`
  display: grid;
  gap: 0.5rem;
  width: 16rem;
`;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <Main>
      <Form action={signIn}>
        <input type="email" name="email" placeholder="Email" required />
        <button type="submit">Send sign-in link</button>
        {sent && <p>Check your email for a sign-in link.</p>}
        {error && <p>{error}</p>}
      </Form>
    </Main>
  );
}
