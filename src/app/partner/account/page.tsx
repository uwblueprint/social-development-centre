import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/admin/_components/PlaceholderPage";
import { partnerCopy as copy } from "../_copy";

export const metadata: Metadata = { title: copy.account.title };

export default function Page() {
  return <PlaceholderPage title={copy.account.title} description={copy.account.description} />;
}
