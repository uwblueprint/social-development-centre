import type { Metadata } from "next";
import { Welcome } from "./Welcome";

export const metadata: Metadata = { title: "Welcome to SDC" };

/** Where PayPal sends them after paying (the real return URL also carries PayPal's order id). */
export default async function WelcomeDesign({ searchParams }: PageProps<"/design/membership/welcome">) {
  const { plan } = await searchParams;
  return <Welcome planId={typeof plan === "string" ? plan : undefined} />;
}
