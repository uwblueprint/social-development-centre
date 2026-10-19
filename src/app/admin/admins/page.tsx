import type { Metadata } from "next";
import { getCurrentAdmin } from "../_data/session";
import { SAMPLE_ADMINS } from "./_lib/demoData";
import { AdminsView } from "./_components/AdminsView";

export const metadata: Metadata = { title: "Admins" };

export default async function Page() {
  const me = await getCurrentAdmin();
  return <AdminsView initialAdmins={SAMPLE_ADMINS} currentEmail={me?.email ?? ""} />;
}
