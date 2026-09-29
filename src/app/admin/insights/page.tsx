import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/PlaceholderPage";

export const metadata: Metadata = { title: "Insights" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Insights"
      description="See how opportunities perform, starting with clicks on links in the automatically sent emails. Attendance and feedback will appear here when available."
    />
  );
}
