import type { Metadata } from "next";
import { demoPayments } from "./data";
import { GridOverlay } from "./GridOverlay";
import { PaymentsPage } from "./PaymentsPage";

export const metadata: Metadata = { title: "Payments" };

/** Every other state is in the State lab (bottom left), stored as ?lab=... Add ?grid to draw alignment lines. */
export default async function PaymentsDesign({ searchParams }: PageProps<"/design/payments">) {
  const { grid } = await searchParams;
  return (
    <>
      <PaymentsPage data={demoPayments} />
      {grid !== undefined && <GridOverlay />}
    </>
  );
}
