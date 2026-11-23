"use client";

import type { ReactNode } from "react";
import { SidebarLayout } from "@/components/patterns/Sidebar";
import { AppToastProvider } from "@/components/ui/Toast";
import { adminNav } from "@/app/admin/_components/adminNav";
import { signOut } from "@/features/auth/actions";
import { NotificationsButton } from "@/features/notifications/NotificationsPanel";
import { useNotificationsLab } from "./notifications/NotificationsLab";

/**
 * The real admin sidebar around the designers' admin screens. Sections with a design screen link to it;
 * the rest link to the built page in `/admin`. One toast provider for every screen, as in the real
 * AdminShell, so the sidebar's notifications and the pages share it. The bell's data comes from the
 * notifications lab, which swaps in edge cases (empty, failures, long text, ...) for designing the panel.
 */
export function DesignAdminShell({ children }: { children: ReactNode }) {
  const { source, lab } = useNotificationsLab();
  return (
    <AppToastProvider>
      <SidebarLayout
        config={{
          product: { name: "Potluck" },
          navLabel: "Admin navigation",
          ...adminNav("design"),
          docsHref: "/admin/documentation",
          headerActions: <NotificationsButton source={source} settingsHref="/design/settings#alerts" />,
          onSignOut: () => void signOut("admin"),
        }}
      >
        {children}
      </SidebarLayout>
      {process.env.NODE_ENV !== "production" && lab}
    </AppToastProvider>
  );
}
