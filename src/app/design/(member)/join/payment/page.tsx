import { JoinStep } from "../JoinStep";

export default async function JoinPayment({ searchParams }: PageProps<"/design/join/payment">) {
  const { source } = await searchParams;
  return <JoinStep title="Pay us" next="/design/join/thank-you" source={source} />;
}
