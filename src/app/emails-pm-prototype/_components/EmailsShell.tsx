"use client";

import type { ReactNode } from "react";
import { styled } from "next-yak";
import { useRouter } from "next/navigation";
import { Flag, Mail, Send, Workflow } from "lucide-react";
import { AppToastProvider } from "@/components/ui/Toast";
import { SidebarLayout, type SidebarNavItem } from "@/components/patterns/Sidebar";
import { EmailsProvider, useReviewCount } from "@/features/emails/store";
import { StateLab } from "@/features/emails/lab/StateLab";

const OUTBOX_DESCRIPTION = "Every email going out in the next 30 days. Personalize, approve, send early or stop them.";

/** The email prototype is its own app: its own shell, its own in-memory data, its own state lab. */
export function EmailsShell({ children }: { children: ReactNode }) {
  return (
    <EmailsProvider>
      <AppToastProvider>
        <Frame>{children}</Frame>
        <StateLab />
      </AppToastProvider>
    </EmailsProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reviewCount = useReviewCount();
  const outbox: SidebarNavItem =
    reviewCount > 0
      ? { href: "/emails-pm-prototype/outbox", label: "Outbox", description: OUTBOX_DESCRIPTION, icon: Send, count: reviewCount, countLabel: `${reviewCount} waiting for review` }
      : { href: "/emails-pm-prototype/outbox", label: "Outbox", description: OUTBOX_DESCRIPTION, icon: Send };
  const items: SidebarNavItem[] = [
    outbox,
    {
      href: "/emails-pm-prototype/automatic",
      label: "Automatic emails",
      description: "Emails that send themselves when something happens to a member, like joining or getting a tag.",
      icon: Workflow,
    },
    {
      href: "/emails-pm-prototype/one-off",
      label: "One-off emails",
      description: "Write an email and send it now to everyone, a group or people you pick.",
      icon: Mail,
    },
  ];
  return (
    <SidebarLayout
      config={{
        product: { name: "Nexus emails" },
        navLabel: "Email navigation",
        items,
        docsHref: "/emails-pm-prototype/notes",
        footerItems: [{ href: "/emails-pm-prototype/flags", label: "Notes for product", icon: Flag }],
        onSignOut: () => router.push("/"),
      }}
    >
      <FlushLeft>{children}</FlushLeft>
    </SidebarLayout>
  );
}

/*
 * One left edge per page: the title, the first tab, and the first table column share it. The kit insets
 * tab labels and table cells so hairlines can run edge to edge; here the hairlines still do, but the
 * text lines up with the page title.
 */
const FlushLeft = styled.div`
  & [role="tab"]:first-child {
    padding-left: 0;
  }
  & table th:first-child,
  & table td:first-child {
    padding-left: 0;
  }
`;
