import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/PlaceholderPage";

export const metadata: Metadata = { title: "Community" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Community"
      description="View subscribers and paying members, import people and manage membership access."
    />
  );
}
