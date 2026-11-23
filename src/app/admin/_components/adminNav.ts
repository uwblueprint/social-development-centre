import { CreditCard, Link2, Mail, Send, Settings, UserCog, UsersRound } from "lucide-react";
import type { SidebarNavItem } from "@/components/patterns/Sidebar";
import type { AdminSection } from "../_data/types";

/**
 * The admin sidebar, shared by the real portal (`/admin`) and the designers' admin screens
 * (`/design/(admin)`), so both show the same sections in the same order.
 *
 * `href` is the built page. `designHref` is the design screen on demo data, which only exists in `pnpm dev`.
 * A section with only a design screen shows in dev and is left out of production until its page is built.
 * `description` shows as a delayed tooltip on the sidebar item.
 */
const sections: {
  key: AdminSection;
  label: string;
  description: string;
  icon: SidebarNavItem["icon"];
  href?: string;
  designHref?: string;
  /** Shown at the bottom of the sidebar, above Documentation, instead of with the main sections. */
  footer?: true;
}[] = [
  {
    key: "members",
    label: "People",
    description: "Everyone in SDC's community.",
    icon: UsersRound,
    href: "/admin/members",
  },
  {
    key: "outbox",
    label: "Outbox",
    description: "Review emails before they send.",
    icon: Send,
    designHref: "/design/outbox",
  },
  {
    key: "payments",
    label: "Payments",
    description: "Insights on membership payments through PayPal.",
    icon: CreditCard,
    // Built on the icema/payments branch; becomes `href` once it merges.
    designHref: "/admin/payments",
  },
  {
    key: "automatic-emails",
    label: "Automatic emails",
    description: "Emails that send themselves on a schedule.",
    icon: Mail,
    href: "/admin/automatic-emails",
  },
  {
    key: "signup-links",
    label: "Signup links",
    description: "Links people use to join SDC.",
    icon: Link2,
    designHref: "/design/signup-links",
  },
  {
    key: "admins",
    label: "Admins",
    description: "People who can use this portal.",
    icon: UserCog,
    href: "/admin/admins",
    designHref: "/design/admins",
    footer: true,
  },
  {
    key: "settings",
    label: "Settings",
    description: "Your name and your account.",
    icon: Settings,
    href: "/admin/settings",
    designHref: "/design/settings",
    footer: true,
  },
];

/**
 * `admin` links to built pages, plus design-only sections in dev. `design` prefers each section's design
 * screen and falls back to the built page, so a designer can click through the whole portal.
 * `items` are the main sections; `footerItems` sit at the bottom, above Documentation.
 */
export function adminNav(from: "admin" | "design"): { items: SidebarNavItem[]; footerItems: SidebarNavItem[] } {
  const dev = process.env.NODE_ENV !== "production";
  const links = sections.flatMap((s) => {
    const href = from === "design" ? (s.designHref ?? s.href) : (s.href ?? (dev ? s.designHref : undefined));
    return href ? [{ footer: s.footer, item: { href, label: s.label, description: s.description, icon: s.icon } }] : [];
  });
  return {
    items: links.filter((l) => !l.footer).map((l) => l.item),
    footerItems: links.filter((l) => l.footer).map((l) => l.item),
  };
}
