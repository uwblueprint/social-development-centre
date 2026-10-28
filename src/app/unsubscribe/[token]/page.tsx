import type { Metadata } from "next";
import { openLink } from "@/features/links/open";
import { Unsubscribe } from "@/features/links/Unsubscribe";
import { parseLinkToken } from "@/features/links/urls";

export const metadata: Metadata = { title: "Unsubscribe · SDC" };

/** An email's unsubscribe link. No sign-in: the token says who it is and which email it came from. */
export default async function UnsubscribePage({ params }: PageProps<"/unsubscribe/[token]">) {
  const token = parseLinkToken((await params).token);
  const link = token ? await openLink(token, "unsubscribe") : null;
  return <Unsubscribe token={token ?? ""} firstName={link ? link.firstName : undefined} />;
}
