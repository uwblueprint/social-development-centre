import type { Metadata } from "next";
import { OutboxPage } from "./OutboxPage";

export const metadata: Metadata = { title: "Outbox" };

export default function OutboxDesign() {
  return <OutboxPage />;
}
