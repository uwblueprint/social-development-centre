import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "./_components/AdminShell";
import { getAdminNavCounts, getCurrentAdmin } from "./_data/session";

export const metadata: Metadata = {
  title: { template: "%s · SDC Admin", default: "SDC Admin" },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentAdmin();
  if (!user) redirect("/login");
  const counts = await getAdminNavCounts();

  return (
    <AdminShell user={user} counts={counts}>
      {children}
    </AdminShell>
  );
}
