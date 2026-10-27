import type { ReactNode } from "react";
import { notFound } from "next/navigation";

/** PM prototypes are throwaway scoping aids, not the product: available in `pnpm dev` only. */
export default function PrototypesLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
