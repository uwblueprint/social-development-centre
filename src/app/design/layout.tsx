import type { ReactNode } from "react";
import { notFound } from "next/navigation";

/**
 * Demo-data screens for review, not the product: available in `pnpm dev` only. Admin portal screens live
 * in `(admin)/`, whose layout draws the sidebar placeholder; public screens (goodbye, referrals) sit
 * outside it and get the full page, as they will in the product.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
