import type { Metadata } from "next";
import { AdminShell } from "./_components/AdminShell";

export const metadata: Metadata = {
  title: { template: "%s · SDC Admin", default: "SDC Admin" },
};

// Placeholder until the admin's profile is loaded from Supabase.
const user = { name: "Admin User", email: "admin@sdc.example", initials: "AU" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell user={user}>{children}</AdminShell>;
}
