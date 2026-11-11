import type { Metadata } from "next";
import { SettingsPage } from "./SettingsPage";

export const metadata: Metadata = { title: "Settings" };

/** Preview the only-admin state with ?state=only-admin. */
export default async function SettingsDesign({ searchParams }: PageProps<"/design/settings">) {
  const { state } = await searchParams;
  return <SettingsPage onlyAdmin={state === "only-admin"} />;
}
