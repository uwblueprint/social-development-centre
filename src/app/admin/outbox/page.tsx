import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { OutboxPage } from "@/features/outbox/_components/OutboxPage";
import { loadOutbox } from "@/features/outbox/queries";

export const metadata: Metadata = { title: "Outbox" };

export default async function OutboxRoute() {
  await requireAdmin();
  return <OutboxPage initial={await loadOutbox()} />;
}
