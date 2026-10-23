"use client";

import { OfflineWatcher } from "@/app/_components/OfflineWatcher";
import type { ReactNode } from "react";
import { UserCog, UsersRound } from "lucide-react";
import { AppToastProvider } from "@/components/ui/Toast";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import type { AdminSection } from "../_data/types";
import { signOut } from "@/features/auth/actions";

/** `description` shows as a delayed tooltip on the sidebar item; it replaces the old page descriptions. */
const sections: { key: AdminSection; label: string; description: string; icon: SidebarNavItem["icon"] }[] = [
  { key: "members", label: "Members", description: "People in SDC's community who can sign in to the members' area.", icon: UsersRound },
  { key: "admins", label: "Admins", description: "Who can sign in to the admin portal.", icon: UserCog },
];

/** No section shows a count badge yet (owner decision 10); a count needs `count` plus a `countLabel` that explains it. */
export function AdminShell({ children }: { children: ReactNode }) {
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
          onSignOut: () => void signOut("admin"),
        }}
      >
        {children}
      </SidebarLayout>
    </AppToastProvider>
  );
}
