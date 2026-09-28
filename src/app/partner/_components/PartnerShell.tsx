"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BriefcaseBusiness, Building } from "lucide-react";
import { AppToastProvider } from "@/components/ui/Toast";
import { AccountDialog, accountDialogCopy } from "@/components/patterns/AccountDialog";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import { deleteAccount, updateAccount } from "@/features/account/actions";
import { signOut } from "@/app/login/actions";
import type { PartnerSection, PartnerUser } from "../_data/types";
import { partnerCopy as copy } from "../_copy";

const sections: { key: PartnerSection; label: string; description: string; icon: SidebarNavItem["icon"] }[] = [
  { key: "opportunities", label: copy.nav.opportunities, description: copy.nav.opportunitiesDescription, icon: BriefcaseBusiness },
  { key: "organization", label: copy.nav.organization, description: copy.nav.organizationDescription, icon: Building },
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
  const items = sections.map((s) => ({ href: `/partner/${s.key}`, label: s.label, description: s.description, icon: s.icon }));
  const [accountOpen, setAccountOpen] = useState(false);
  const actions = useMemo(
    () => ({ update: updateAccount.bind(null, "partner"), remove: deleteAccount.bind(null, "partner") }),
    [],
  );
  const profile = { name: user.name, email: user.email, initials: user.initials, avatarSrc: user.avatarUrl };
  return (
    // One provider for the whole portal so a toast survives navigating from a form back to its list,
    // and the account dialog can confirm a save.
    <AppToastProvider>
      <SidebarLayout
        config={{
          product: { name: user.organization.name, initials: initialsOf(user.organization.name) },
          navLabel: copy.nav.label,
          items,
          user: profile,
          onOpenAccount: () => setAccountOpen(true),
          onSignOut: () => void signOut(user.name.split(/\s+/)[0]),
        }}
      >
        {children}
      </SidebarLayout>
      <AccountDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        user={profile}
        updateAction={actions.update}
        deleteAction={actions.remove}
        deleteDescription={accountDialogCopy.deletePartner(user.organization.name)}
      />
    </AppToastProvider>
  );
}
