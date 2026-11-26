import type { Metadata } from "next";
import { EmailsShell } from "./_components/EmailsShell";

export const metadata: Metadata = {
  title: { template: "%s · SDC email prototype", default: "SDC email prototype" },
};

export default function EmailsLayout({ children }: LayoutProps<"/emails-pm-prototype">) {
  return <EmailsShell>{children}</EmailsShell>;
}
