import { JoinStep } from "@/features/join/JoinStep";

/** The end of the join steps; reaching it counts a join for the signup link the visit started from. */
export default async function JoinThankYou({ searchParams }: PageProps<"/join/thank-you">) {
  const { source, visit } = await searchParams;
  return <JoinStep title="Thank you!" source={source} visit={visit} record="join" />;
}
