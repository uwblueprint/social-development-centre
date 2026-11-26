import type { Metadata } from "next";
import { PayPalStandIn } from "./PayPalStandIn";

export const metadata: Metadata = { title: "Checkout (PayPal stand-in)" };

/** Stand-in for PayPal's hosted checkout, so the round trip can be clicked through in the design. */
export default async function PayPalDesign({ searchParams }: PageProps<"/design/membership/paypal">) {
  const { plan, via, ref } = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return <PayPalStandIn planId={one(plan)} via={one(via)} referralCode={one(ref)} />;
}
