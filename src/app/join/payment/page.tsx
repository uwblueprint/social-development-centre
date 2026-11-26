import { JoinStep } from "@/features/join/JoinStep";

export default async function JoinPayment({ searchParams }: PageProps<"/join/payment">) {
  const { source, visit } = await searchParams;
  return <JoinStep title="Pay us" next="/join/thank-you" source={source} visit={visit} />;
}
