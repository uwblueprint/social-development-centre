import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { StateLabProvider } from "./_state-lab/StateLabProvider";

/**
 * Demo-data screens for review, not the product: available in `pnpm dev` only. Admin screens get the
 * real sidebar from `(admin)/layout.tsx`; member-facing screens have no navigation.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <StateLabProvider>{children}</StateLabProvider>;
}
