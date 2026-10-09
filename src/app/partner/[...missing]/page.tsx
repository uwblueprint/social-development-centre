// Unknown partner URLs render inside the partner layout, so the signed-in sidebar stays visible (owner).
// A near-miss section name (e.g. a typo) redirects to the real section instead.
import { notFound, redirect } from "next/navigation";
import { closestSection } from "@/lib/closestSection";

export default async function Missing({ params }: { params: Promise<{ missing: string[] }> }) {
  const { missing } = await params;
  const target = closestSection("partner", missing);
  if (target) redirect(target);
  notFound();
}
