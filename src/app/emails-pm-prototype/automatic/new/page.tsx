import type { Metadata } from "next";
import { NewAutomatic } from "@/features/emails/automatic/NewAutomatic";

export const metadata: Metadata = { title: "New automatic email" };

export default function Page() {
  return <NewAutomatic />;
}
