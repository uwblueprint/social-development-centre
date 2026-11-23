import { JoinStep } from "../JoinStep";

export default async function JoinThankYou({ searchParams }: PageProps<"/design/join/thank-you">) {
  const { source } = await searchParams;
  return <JoinStep title="Thank you!" source={source} />;
}
