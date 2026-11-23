import type { Metadata } from "next";
import { SignInFlow } from "./SignInFlow";
import { isStateId } from "./states";

export const metadata: Metadata = { title: "Sign in to SDC" };

/** The whole sign-in flow on demo data. `?state=` opens any screen directly; see /prototypes/sign-in/states. */
export default async function SignInPrototype({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { state } = await searchParams;
  return <SignInFlow initial={isStateId(state) ? state : "sign-in"} />;
}
