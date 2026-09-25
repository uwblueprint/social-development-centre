"use client";

import type { ReactNode } from "react";
import { BriefcaseBusiness, Building, ChartColumnIncreasing, UsersRound } from "lucide-react";
import { SidebarLayout, type SidebarConfig } from "@/components/patterns/Sidebar";
import { signOut } from "@/app/login/actions";

export interface AdminUser {
  name: string;
  email: string;
  initials: string;
}

const items: SidebarConfig["items"] = [
  { href: "/admin/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { href: "/admin/partners", label: "Partners", icon: Building },
  { href: "/admin/community", label: "Community", icon: UsersRound },
  { href: "/admin/insights", label: "Insights", icon: ChartColumnIncreasing },
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
