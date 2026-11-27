import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmailFooterProvider } from "@/features/automatic-emails/components/EmailFooterContext";
import { getReferLinkText } from "@/features/automatic-emails/queries";
import { AdminShell } from "./_components/AdminShell";
import { getCurrentAdmin } from "./_data/session";

export const metadata: Metadata = {
  title: { template: "%s · Nexus", default: "Nexus" },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await getCurrentAdmin())) redirect("/login/admin");
  // Every email footer in the portal shows the refer link's text from Settings.
  const referLinkText = await getReferLinkText();

  return (
    <AdminShell>
      <EmailFooterProvider referLinkText={referLinkText}>{children}</EmailFooterProvider>
    </AdminShell>
  );
}
