import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/PlaceholderPage";

export const metadata: Metadata = { title: "Partners" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Partners"
      description="Add organizations, manage their profiles and contacts, invite partner users and control their access. Partner rules live here."
    />
  );
}
