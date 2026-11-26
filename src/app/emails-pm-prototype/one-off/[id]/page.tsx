import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/patterns/PageLoading";
import { OneOffDetail } from "@/features/emails/oneoff/OneOffDetail";

export const metadata: Metadata = { title: "One-off email" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoading title="One-off email" />}>
      <OneOffDetail id={id} />
    </Suspense>
  );
}
