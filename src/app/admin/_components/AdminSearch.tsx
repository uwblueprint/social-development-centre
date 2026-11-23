"use client";

import * as React from "react";
import type { SidebarConfig } from "@/components/patterns/Sidebar";
import { useToast } from "@/components/ui/Toast";
import { SearchPalette } from "@/features/search/SearchPalette";
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
    <SearchPalette from={from} pages={pages} open={open} onOpenChange={onOpenChange} onPersonMissing={onPersonMissing} />
  );
}

/** The real portal's palette: says so when a person opened from search has been removed since. */
export function AdminSearchWithToast(props: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  return (
    <AdminSearch from="admin" {...props} onPersonMissing={() => toast({ title: "That person isn’t on the list anymore" })} />
  );
}
