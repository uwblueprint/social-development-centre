import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/patterns/PageLoading";
import { AutomaticList } from "@/features/emails/automatic/AutomaticList";

export const metadata: Metadata = { title: "Automatic emails" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading title="Automatic emails" />}>
      <AutomaticList />
    </Suspense>
  );
}
