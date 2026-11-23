import { JoinStep } from "../JoinStep";

export default async function JoinDetails({ searchParams }: PageProps<"/design/join/details">) {
  const { source } = await searchParams;
  return <JoinStep title="Add your details" next="/design/join/payment" source={source} />;
}
