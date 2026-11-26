import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/patterns/PageLoading";
import { AutomaticDetail } from "@/features/emails/automatic/AutomaticEditor";

export const metadata: Metadata = { title: "Automatic email" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoading narrow />}>
      <AutomaticDetail id={id} />
    </Suspense>
  );
}
