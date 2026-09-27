"use client";

import type { ReactNode } from "react";
import { BriefcaseBusiness, Building, ChartColumnIncreasing, UsersRound } from "lucide-react";
import { AppToastProvider } from "@/components/ui/Toast";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import type { AdminSection, AdminUser } from "../_data/types";
import { signOut } from "@/app/login/actions";

/** `description` shows as a delayed tooltip on the sidebar item; it replaces the old page descriptions. */
const sections: { key: AdminSection; label: string; description: string; icon: SidebarNavItem["icon"] }[] = [
  {
    key: "opportunities",
    label: "Opportunities",
    description: "Events, petitions, volunteer roles and jobs from SDC and Civic Hub partners.",
    icon: BriefcaseBusiness,
  },
  { key: "partners", label: "Partners", description: "Civic Hub organizations and the people who post for them.", icon: Building },
  { key: "community", label: "Community", description: "Everyone on SDC's email list, and who has paid access.", icon: UsersRound },
  { key: "insights", label: "Insights", description: "Reports on what people click and join.", icon: ChartColumnIncreasing },
];

/** No section shows a count badge yet (owner decision 10); a count needs `count` plus a `countLabel` that explains it. */
export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const items: SidebarNavItem[] = sections.map((s) => ({
    href: `/admin/${s.key}`,
    label: s.label,
    description: s.description,
    icon: s.icon,
  }));
  return (
    <SidebarLayout
      config={{
        product: { name: "SDC Admin", initials: "SDC" },
        navLabel: "Admin navigation",
        items,
        user: { ...user, avatarSrc: user.avatarUrl },
        accountHref: "/admin/account",
        onSignOut: () => void signOut(),
      }}
    >
      {/* One provider for the whole portal so a toast survives navigating from a form back to its list. */}
      <AppToastProvider>{children}</AppToastProvider>
    </SidebarLayout>
  );
}
