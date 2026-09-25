import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/PlaceholderPage";

export const metadata: Metadata = { title: "Opportunities" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Opportunities"
      description="Create and manage SDC's own listings, and view or edit partner listings when needed. Filter by publisher, type and status. Fields, tags and publishing rules live here."
    />
  );
}
