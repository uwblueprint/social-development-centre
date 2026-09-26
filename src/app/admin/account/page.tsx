import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/PlaceholderPage";

export const metadata: Metadata = { title: "My account" };

export default function Page() {
  return (
    <PlaceholderPage
      title="My account"
      description="Your personal details and sign-in settings."
    />
  );
}
