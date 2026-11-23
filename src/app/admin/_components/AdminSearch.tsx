"use client";

import * as React from "react";
import { Bell, LogOut } from "lucide-react";
import type { SidebarConfig } from "@/components/patterns/Sidebar";
import { useToast } from "@/components/ui/Toast";
import { signOut } from "@/features/auth/actions";
import { openNotifications } from "@/features/notifications/NotificationsPanel";
import { SearchPalette, type SearchAction } from "@/features/search/SearchPalette";
import { adminSearchPages } from "./adminNav";

/** The search palette's open state, and the sidebar header's search icon that opens it. */
export function useAdminSearch() {
  const [open, setOpen] = React.useState(false);
  const shortcut = React.useSyncExternalStore(
    noop,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => null,
  );
  const sidebar: SidebarConfig["search"] = { onOpen: () => setOpen(true), shortcut };
  return { open, setOpen, sidebar };
}

const noop = () => () => {};

/** What the palette can do in place, the same as the sidebar's bell and Sign out. */
const ACTIONS: SearchAction[] = [
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    keywords: ["bell", "alerts", "inbox", "updates"],
    run: openNotifications,
  },
  {
    id: "sign-out",
    label: "Sign out",
    icon: LogOut,
    keywords: ["log out", "logout", "sign off", "leave"],
    run: () => void signOut("admin"),
  },
];

export function AdminSearch({
  from,
  open,
  onOpenChange,
  onPersonMissing,
}: {
  from: "admin" | "design";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonMissing?: () => void;
}) {
  const pages = React.useMemo(() => adminSearchPages(from), [from]);
  return (
    <SearchPalette
      from={from}
      pages={pages}
      actions={ACTIONS}
      open={open}
      onOpenChange={onOpenChange}
      onPersonMissing={onPersonMissing}
    />
  );
}

/** The real portal's palette: says so when a person opened from search has been removed since. */
export function AdminSearchWithToast(props: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  return (
    <AdminSearch from="admin" {...props} onPersonMissing={() => toast({ title: "That person isn’t on the list anymore" })} />
  );
}
