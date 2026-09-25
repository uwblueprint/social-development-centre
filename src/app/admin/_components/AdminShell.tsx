"use client";

import type { ReactNode } from "react";
import { ChartNoAxesColumn, Compass, Handshake, Users } from "lucide-react";
import { SidebarLayout, type SidebarConfig } from "@/components/patterns/Sidebar";
import { signOut } from "@/app/login/actions";

export interface AdminUser {
  name: string;
  email: string;
  initials: string;
}

const items: SidebarConfig["items"] = [
  { href: "/admin/opportunities", label: "Opportunities", icon: Compass },
  { href: "/admin/partners", label: "Partners", icon: Handshake },
  { href: "/admin/community", label: "Community", icon: Users },
  { href: "/admin/insights", label: "Insights", icon: ChartNoAxesColumn },
];

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  return (
    <SidebarLayout
      config={{
        product: { name: "SDC Admin", initials: "SDC" },
        navLabel: "Admin",
        items,
        user,
        accountHref: "/admin/account",
        onSignOut: () => void signOut(),
      }}
    >
      {children}
    </SidebarLayout>
  );
}
