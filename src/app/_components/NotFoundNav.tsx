"use client";

import * as React from "react";
import { setSidebarNotFound } from "@/components/patterns/Sidebar";

/** Rendered by the 404: while it's on screen, no sidebar item is highlighted. */
export function NotFoundNav() {
  React.useEffect(() => {
    setSidebarNotFound(true);
    return () => setSidebarNotFound(false);
  }, []);
  return null;
}
