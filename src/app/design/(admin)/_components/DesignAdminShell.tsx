"use client";

import type { ReactNode } from "react";
import { SidebarLayout } from "@/components/patterns/Sidebar";
import { adminNav } from "@/app/admin/_components/adminNav";
import { signOut } from "@/features/auth/actions";

/**
 * The real admin sidebar around the designers' admin screens. Sections with a design screen link to it;
 * the rest link to the built page in `/admin`. Each design screen brings its own toast provider.
 */
export function DesignAdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarLayout
      config={{
        product: { name: "Potluck" },
        navLabel: "Admin navigation",
        ...adminNav("design"),
        docsHref: "/admin/documentation",
        onSignOut: () => void signOut("admin"),
      }}
    >
      {children}
    </SidebarLayout>
  );
}
