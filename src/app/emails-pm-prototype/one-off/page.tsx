import type { Metadata } from "next";
import { OneOffList } from "@/features/emails/oneoff/OneOffList";

export const metadata: Metadata = { title: "One-off emails" };

export default function Page() {
  return <OneOffList />;
}
