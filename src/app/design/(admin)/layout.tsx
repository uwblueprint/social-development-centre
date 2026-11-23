import type { ReactNode } from "react";
import { DesignAdminShell } from "./_components/DesignAdminShell";

/** Designers' admin screens sit inside the real admin sidebar, so they're designed for the space they'll have. */
export default function AdminDesignLayout({ children }: { children: ReactNode }) {
  return <DesignAdminShell>{children}</DesignAdminShell>;
}
