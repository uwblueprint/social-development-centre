import { JoinStep } from "@/features/join/JoinStep";

/**
 * Where every signup link lands (`/join?source=<slug>`); opening it counts a click for that link. Each
 * load starts a new visit id, so a reload counts another click (docs/backend/signup-links.md).
 */
export default async function JoinWelcome({ searchParams }: PageProps<"/join">) {
  const { source } = await searchParams;
  return <JoinStep title="Welcome" next="/join/details" source={source} visit={crypto.randomUUID()} record="click" />;
}
