import type { Metadata } from "next";
import "@fontsource/coming-soon/400.css";
import "@fontsource-variable/nunito/wght.css";
import { IntakeForm } from "@/features/intake/components/IntakeForm";
import { intakeForms } from "@/features/intake/copy";

export const metadata: Metadata = { title: `${intakeForms["ride-for-refuage"].title} · SDC` };

export default function RideForRefugeIntakePage() {
  return <IntakeForm source="ride-for-refuage" />;
}
