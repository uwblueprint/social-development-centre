"use client";

import type { ReactNode } from "react";
import { BriefcaseBusiness, Building } from "lucide-react";
import { AppToastProvider } from "@/components/ui/Toast";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import { signOut } from "@/app/login/actions";
import type { PartnerSection, PartnerUser } from "../_data/types";
import { partnerCopy as copy } from "../_copy";

const sections: { key: PartnerSection; label: string; icon: SidebarNavItem["icon"] }[] = [
  { key: "opportunities", label: copy.nav.opportunities, icon: BriefcaseBusiness },
  { key: "organization", label: copy.nav.organization, icon: Building },
];

/** "Northside Food Bank" → "NF"; single words give one letter. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PartnerShell({ user, children }: { user: PartnerUser; children: ReactNode }) {
  const items = sections.map((s) => ({ href: `/partner/${s.key}`, label: s.label, icon: s.icon }));
  return (
    <SidebarLayout
      config={{
        product: { name: user.organization.name, initials: initialsOf(user.organization.name) },
        navLabel: copy.nav.label,
        items,
        user: { name: user.name, email: user.email, initials: user.initials, avatarSrc: user.avatarUrl },
        accountHref: "/partner/account",
        onSignOut: () => void signOut(),
      }}
    >
      {/* One provider for the whole portal so a toast survives navigating from a form back to its list. */}
      <AppToastProvider>{children}</AppToastProvider>
    </SidebarLayout>
  );
}
