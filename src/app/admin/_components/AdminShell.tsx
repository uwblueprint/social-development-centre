"use client";

import { OfflineWatcher } from "@/app/_components/OfflineWatcher";
import type { ReactNode } from "react";
import { AppToastProvider } from "@/components/ui/Toast";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import type { AdminSection, AdminUser } from "../_data/types";
import { signOut } from "@/app/login/actions";

/** `description` shows as a delayed tooltip on the sidebar item; it replaces the old page descriptions. */
// Empty until the post-pivot sections are built; each one gets an entry here.
const sections: { key: AdminSection; label: string; description: string; icon: SidebarNavItem["icon"] }[] = [];

/** No section shows a count badge yet (owner decision 10); a count needs `count` plus a `countLabel` that explains it. */
export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const items: SidebarNavItem[] = sections.map((s) => ({
    href: `/admin/${s.key}`,
    label: s.label,
    description: s.description,
    icon: s.icon,
  }));
  return (
    // One provider for the whole portal so a toast survives navigating from a form back to its list.
    <AppToastProvider>
      <OfflineWatcher />
      <SidebarLayout
        config={{
          product: { name: "Nexus" },
          navLabel: "Admin navigation",
          items,
          docsHref: "/admin/documentation",
          onSignOut: () => void signOut(user.name.split(/\s+/)[0]),
        }}
      >
        {children}
      </SidebarLayout>
    </AppToastProvider>
  );
}
