import { Suspense } from "react";
import { PageLoading } from "@/components/patterns/PageLoading";
import { OutboxView } from "@/features/emails/outbox/OutboxView";

export const metadata = { title: "Outbox" };

export default function OutboxPage() {
  return (
    <Suspense fallback={<PageLoading title="Outbox" />}>
      <OutboxView />
    </Suspense>
  );
}
