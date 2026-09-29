"use client";

import { useSidebarNoActiveItem } from "@/components/patterns/Sidebar";

/** Rendered by the 404: while it is on screen, no sidebar item is highlighted. */
export function NotFoundNav() {
  useSidebarNoActiveItem();
  return null;
}
