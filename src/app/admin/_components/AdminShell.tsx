"use client";

import type { ReactNode } from "react";
import { BriefcaseBusiness, Building, ChartColumnIncreasing, UsersRound } from "lucide-react";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import type { AdminSection, AdminUser } from "../_data/types";
import { signOut } from "@/app/login/actions";

const sections: { key: AdminSection; label: string; icon: SidebarNavItem["icon"] }[] = [
  { key: "opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { key: "partners", label: "Partners", icon: Building },
  { key: "community", label: "Community", icon: UsersRound },
  { key: "insights", label: "Insights", icon: ChartColumnIncreasing },
];

export function AdminShell({
  user,
  counts,
  children,
}: {
  user: AdminUser;
  counts: Partial<Record<AdminSection, number>>;
  children: ReactNode;
}) {
  const items = sections.map((s) => ({ href: `/admin/${s.key}`, label: s.label, icon: s.icon, count: counts[s.key] }));
  return (
    <SidebarLayout
      config={{
        product: { name: "SDC Admin", initials: "SDC" },
        navLabel: "Admin",
        items,
        user: { ...user, avatarSrc: user.avatarUrl },
        accountHref: "/admin/account",
        onSignOut: () => void signOut(),
      }}
    >
      {children}
    </SidebarLayout>
  );
}
