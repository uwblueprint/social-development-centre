import type { Metadata } from "next";
import { AdminsPage } from "@/features/admins/AdminsPage";
import { listAdmins } from "@/features/admins/queries";
import { requireAdmin } from "@/features/auth/session";

export const metadata: Metadata = { title: "Admins" };

export default async function AdminsRoute() {
  const admin = await requireAdmin();
  const admins = await listAdmins();
  return <AdminsPage admins={admins} currentAdminId={admin.id} />;
}
