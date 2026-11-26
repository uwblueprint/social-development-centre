import { JoinStep } from "@/features/join/JoinStep";

export default async function JoinDetails({ searchParams }: PageProps<"/join/details">) {
  const { source, visit } = await searchParams;
  return <JoinStep title="Add your details" next="/join/payment" source={source} visit={visit} />;
}
