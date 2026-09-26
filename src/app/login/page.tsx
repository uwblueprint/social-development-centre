import { styled } from "next-yak";
import { signIn } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
        <Input type="email" name="email" placeholder="Email" aria-label="Email" required />
        <Button type="submit">Send sign-in link</Button>
        {sent && <p>Check your email for a sign-in link.</p>}
        {error && <p>{error}</p>}
      </Form>
    </Main>
  );
}
