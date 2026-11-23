import { BookOpen, CreditCard, Link2, Mail, Send, Settings, UserCog, UsersRound } from "lucide-react";
import type { SidebarNavItem } from "@/components/patterns/Sidebar";
import type { AdminSection } from "../_data/types";
import type { SearchPage } from "@/features/search/SearchPalette";

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
  /** Other words that find this section in the search palette. Never shown. */
  keywords?: string[];
  /** Shown at the bottom of the sidebar, above Documentation, instead of with the main sections. */
  footer?: true;
}[] = [
  {
    key: "members",
    label: "People",
    description: "Everyone in SDC's community.",
    icon: UsersRound,
    href: "/admin/members",
    keywords: ["members", "community", "directory"],
  },
  {
    key: "outbox",
    label: "Outbox",
    description: "Review emails before they send.",
    icon: Send,
    designHref: "/design/outbox",
    keywords: ["review", "queue", "scheduled"],
  },
  {
    key: "payments",
    label: "Payments",
    description: "Insights on membership payments through PayPal.",
    icon: CreditCard,
    // Built on the icema/payments branch; becomes `href` once it merges.
    designHref: "/admin/payments",
    keywords: ["paypal", "money", "membership fees"],
  },
  {
    key: "automatic-emails",
    label: "Automatic emails",
    description: "Emails that send themselves on a schedule.",
    icon: Mail,
    href: "/admin/automatic-emails",
    keywords: ["schedule", "templates"],
  },
  {
    key: "signup-links",
    label: "Signup links",
    description: "Links people use to join SDC.",
    icon: Link2,
    designHref: "/design/signup-links",
    keywords: ["join", "sign up", "invite"],
  },
  {
    key: "admins",
    label: "Admins",
    description: "People who can use this portal.",
    icon: UserCog,
    href: "/admin/admins",
    designHref: "/design/admins",
    keywords: ["team", "staff"],
    footer: true,
  },
  {
    key: "settings",
    label: "Settings",
    description: "Your name and your account.",
    icon: Settings,
    href: "/admin/settings",
    designHref: "/design/settings",
    keywords: ["account", "preferences", "alerts"],
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

/** Every section as the search palette lists it (the same links as the sidebar), then Documentation. */
export function adminSearchPages(from: "admin" | "design"): SearchPage[] {
  const { items, footerItems } = adminNav(from);
  const keywords = new Map(sections.map((s) => [s.label, s.keywords]));
  return [
    ...[...items, ...footerItems].map(({ href, label, icon }) => ({ href, label, icon, keywords: keywords.get(label) })),
    { href: ADMIN_DOCS_HREF, label: "Documentation", icon: BookOpen, keywords: ["help", "guide", "docs", "how to"] },
  ];
}

export const ADMIN_DOCS_HREF = "/admin/documentation";
