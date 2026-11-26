import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/patterns/PageLoading";
import { NewOneOff } from "@/features/emails/oneoff/OneOffDetail";

export const metadata: Metadata = { title: "New one-off email" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading title="New one-off email" />}>
      <NewOneOff />
    </Suspense>
  );
}
