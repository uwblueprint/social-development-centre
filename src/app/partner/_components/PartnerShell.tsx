"use client";

import { OfflineWatcher } from "@/app/_components/OfflineWatcher";
import type { ReactNode } from "react";
import { BriefcaseBusiness, Building, ChartColumnIncreasing } from "lucide-react";
import { AppToastProvider } from "@/components/ui/Toast";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import { signOut } from "@/app/login/actions";
import type { PartnerSection, PartnerUser } from "../_data/types";
import { partnerCopy as copy } from "../_copy";

const sections: { key: PartnerSection; label: string; description: string; icon: SidebarNavItem["icon"] }[] = [
  { key: "opportunities", label: copy.nav.opportunities, description: copy.nav.opportunitiesDescription, icon: BriefcaseBusiness },
  { key: "insights", label: copy.nav.insights, description: copy.nav.insightsDescription, icon: ChartColumnIncreasing },
];

export function PartnerShell({ user, children }: { user: PartnerUser; children: ReactNode }) {
  const items = sections.map((s) => ({ href: `/partner/${s.key}`, label: s.label, description: s.description, icon: s.icon }));
  return (
    // One provider for the whole portal so a toast survives navigating from a form back to its list.
    <AppToastProvider>
      <OfflineWatcher />
      <SidebarLayout
        config={{
          product: { name: user.organization.name },
          navLabel: copy.nav.label,
          items,
          docsHref: "/partner/documentation",
          // Owner: Organization is a settings-like page, so it sits in the footer, right above Sign out.
          footerItems: [{ href: "/partner/organization", label: copy.nav.organization, icon: Building }],
          onSignOut: () => void signOut(user.name.split(/\s+/)[0]),
        }}
      >
        {children}
      </SidebarLayout>
    </AppToastProvider>
  );
}
