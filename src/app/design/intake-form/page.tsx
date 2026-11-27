import type { Metadata } from "next";
import { IntakeSurvey } from "./IntakeSurvey";

export const metadata: Metadata = { title: "Intake form · SDC" };

/** The intake form in the portal's look, with a default welcome message SDC admins can replace. Demo data only. */
export default function IntakeFormDesign() {
  return <IntakeSurvey />;
}
