import type { ReactNode } from "react";
import { notFound } from "next/navigation";

/**
 * Demo-data screens for review, not the product: available in `pnpm dev` only. The admin sidebar
 * placeholder lives in `(admin)/layout.tsx`; member-facing pages in `(member)` have no navigation.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
