// Unknown admin URLs render inside the admin layout, so the signed-in sidebar stays visible.
// A near-miss section name (e.g. a typo) redirects to the real section instead.
import { notFound, redirect } from "next/navigation";
import { closestSection } from "@/lib/closestSection";

export default async function Missing({ params }: { params: Promise<{ missing: string[] }> }) {
  const { missing } = await params;
  const target = closestSection("admin", missing);
  if (target) redirect(target);
  notFound();
}
