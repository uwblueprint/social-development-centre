import { JoinStep } from "./JoinStep";

export default async function JoinWelcome({ searchParams }: PageProps<"/design/join">) {
  const { source } = await searchParams;
  return <JoinStep title="Welcome" next="/design/join/details" source={source} />;
}
