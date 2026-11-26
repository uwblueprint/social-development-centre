import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { PaymentsPage } from "@/features/payments/PaymentsPage";
import { listMemberPayments, listUnmatchedPayments } from "@/features/payments/queries";

export const metadata: Metadata = { title: "Payments" };

/** Membership payments from PayPal (docs/backend/payments.md). */
export default async function PaymentsRoute() {
  await requireAdmin();
  const [members, unmatched] = await Promise.all([listMemberPayments(), listUnmatchedPayments()]);
  return <PaymentsPage members={members} unmatched={unmatched} />;
}
