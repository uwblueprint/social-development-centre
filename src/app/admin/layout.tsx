import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "./_components/AdminShell";
import { getCurrentAdmin } from "./_data/session";

export const metadata: Metadata = {
  title: { template: "%s · Nexus", default: "Nexus" },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentAdmin();
  if (!user) redirect("/login/admin");

  return (
    <AdminShell user={user}>
      {children}
    </AdminShell>
  );
}
