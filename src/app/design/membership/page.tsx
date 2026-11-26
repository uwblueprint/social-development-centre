import type { Metadata } from "next";
import { JoinPage } from "./JoinPage";
import { channelFrom } from "./plans";

export const metadata: Metadata = { title: "Join SDC" };

/**
 * Try each entry channel with `?via=referral&ref=<code>`, `?via=event` or `?via=social`.
 * `?paypal=cancelled` is where PayPal's Cancel sends them: the form, with their details kept.
 */
export default async function MembershipDesign({ searchParams }: PageProps<"/design/membership">) {
  const { via, ref, paypal } = await searchParams;
  return (
    <JoinPage
      channel={channelFrom(via)}
      referralCode={typeof ref === "string" ? ref : undefined}
      cancelled={paypal === "cancelled"}
    />
  );
}
