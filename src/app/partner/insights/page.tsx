import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/admin/_components/PlaceholderPage";

export const metadata: Metadata = { title: "Insights" };

/** Blank for now (owner): how the organization's opportunities perform will live here. */
export default function Page() {
  return <PlaceholderPage title="Insights" />;
}
