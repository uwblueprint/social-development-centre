"use client";

import { OfflineWatcher } from "@/app/_components/OfflineWatcher";
import type { ReactNode } from "react";
import { AppToastProvider } from "@/components/ui/Toast";
import { SidebarLayout } from "@/components/patterns/Sidebar";
import { adminNav } from "./adminNav";
import { signOut } from "@/features/auth/actions";
import { NotificationsButton } from "@/features/notifications/NotificationsPanel";
import { serverNotifications } from "@/features/notifications/source";

/** No section shows a count badge yet (owner decision 10); a count needs `count` plus a `countLabel` that explains it. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { items, footerItems } = adminNav("admin");
  return (
    // One provider for the whole portal so a toast survives navigating from a form back to its list.
    <AppToastProvider>
      <OfflineWatcher />
      <SidebarLayout
        config={{
          product: { name: "Potluck" },
          navLabel: "Admin navigation",
          items,
          footerItems,
          docsHref: "/admin/documentation",
          headerActions: <NotificationsButton source={serverNotifications} settingsHref="/admin/settings#alerts" />,
          onSignOut: () => void signOut("admin"),
        }}
      >
        {children}
      </SidebarLayout>
    </AppToastProvider>
  );
}
