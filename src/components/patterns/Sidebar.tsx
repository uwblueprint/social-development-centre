"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { css, keyframes, styled } from "next-yak";
import type { LucideIcon } from "lucide-react";
import { BookOpen, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Pin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Tooltip } from "@/components/ui/Tooltip";
import { applySidebarCollapsed, readSidebarCollapsed, syncSidebarCollapsed } from "@/lib/sidebar";

/**
 * A badge is a number that needs attention, and it always comes with an accessible label saying what it
 * counts, including the number (e.g. "3 awaiting review" → "Partners, 3 awaiting review"). The number is
 * never announced alone. Use the same wording on the section's page.
 */
type SidebarNavCount =
  | { count?: undefined; countLabel?: undefined }
  | {
      count: number;
      /** What the count means, including the number, e.g. "3 awaiting review". */
      countLabel: string;
    };

export type SidebarNavItem = SidebarNavCount & {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * One sentence on what the section is for, shown as a tooltip to the right after a short hover or
   * keyboard focus. Never pinned on click. It replaces a page description, so keep it supplementary.
   */
  description?: string;
};

/** Long enough that sweeping the pointer down the nav doesn't flash every description. */
const DESCRIPTION_DELAY_MS = 600;

export interface SidebarRecentItem {
  href: string;
  icon: LucideIcon;
  title: string;
  /** Secondary text after a middle dot, e.g. the organization. */
  context?: string;
}

export interface SidebarConfig {
  product: { name: string };
  /** Accessible name for the main navigation landmark. */
  navLabel: string;
  items: SidebarNavItem[];
  recent?: { label: string; items: SidebarRecentItem[] };
  /** Link to the Documentation page (the user guide), shown above Sign out. */
  docsHref: string;
  /** Links at the top of the footer, right above Documentation (e.g. Admins and Settings). */
  footerItems?: { href: string; label: string; icon: LucideIcon }[];
  /** Owner decision: no My account concept (logins can be shared); the footer is just Documentation and a red Sign out. */
  onSignOut: () => void;
}

const MOBILE = "@media (max-width: 767px)";
/** Narrow desktops and tablets: the sidebar can collapse to a hover or click overlay. 1200px and up it stays docked. */
const NARROW = "@media (min-width: 768px) and (max-width: 1199px)";
const NARROW_QUERY = "(min-width: 768px) and (max-width: 1199px)";

/*
 * Collapsed is a per-browser choice, set as data-sidebar="collapsed" on <html> by the boot script in <head>
 * (src/lib/sidebar.ts) so a collapsed sidebar never flashes open. CSS reads it; it only applies in NARROW.
 */
const COLLAPSED = 'html[data-sidebar="collapsed"] &';

/**
 * The overlay starts below the page's title row (ListPage's top padding, its 36px header, a small gap), so
 * it never covers the button that opens it.
 */
const PEEK_TOP = "calc(var(--space-5) + 36px + var(--space-2))";

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
`;

// A div, not an aside: below 768px it becomes a modal dialog, a role <aside> can't take. The nav inside is the landmark.
const Aside = styled.div<{ $mobileOpen: boolean; $peek: boolean }>`
  position: sticky;
  top: 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  width: var(--sidebar-width);
  padding: var(--space-3);
  /* Short windows (or 200% zoom) can't fit every section plus the footer: scroll the sidebar, not the page. */
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);


  ${NARROW} {
    ${COLLAPSED} {
      position: fixed;
      z-index: calc(var(--z-nav) + 1);
      left: 0;
      top: ${PEEK_TOP};
      bottom: 0;
      height: auto;
      border: 1px solid var(--color-border);
      border-left: none;
      border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
      box-shadow: var(--shadow-md);
      transform: translateX(calc(-100% - var(--space-3)));
      visibility: hidden;
      transition:
        transform var(--duration-slow) var(--ease-out),
        visibility 0s linear var(--duration-slow);
    }
  }
  /* Tall enough: float it off the bottom edge too, so it reads as a panel over the page. */
  @media (min-width: 768px) and (max-width: 1199px) and (min-height: 600px) {
    ${COLLAPSED} {
      bottom: var(--space-3);
    }
  }
  ${({ $peek }) =>
    $peek &&
    css`
      ${NARROW} {
        ${COLLAPSED} {
          transform: translateX(0);
          visibility: visible;
          transition: transform var(--duration-slow) var(--ease-out);
        }
      }
    `}

  ${MOBILE} {
    position: fixed;
    z-index: calc(var(--z-nav) + 1);
    left: 0;
    width: min(288px, 85vw);
    padding: var(--space-3);
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    visibility: hidden;
    transition:
      transform var(--duration-slow) var(--ease-out),
      visibility 0s linear var(--duration-slow);

    ${({ $mobileOpen }) =>
      $mobileOpen &&
      css`
        transform: translateX(0);
        visibility: visible;
        transition: transform var(--duration-slow) var(--ease-out);
      `}
  }
`;

const Scrim = styled.button`
  all: unset;
  display: none;

  ${MOBILE} {
    display: block;
    position: fixed;
    inset: 0;
    z-index: var(--z-nav);
    background: var(--color-overlay);
  }
`;

const backdropIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/**
 * Behind the overlay sidebar: blurs the page (like a dialog, with no dimming) so the sidebar reads first.
 * Clicked open, it also catches the next click outside the sidebar, so that click only closes the sidebar
 * and doesn't press whatever was underneath. While peeking on hover it lets the pointer through.
 */
const OverlayBackdrop = styled.button<{ $passThrough: boolean }>`
  all: unset;
  display: none;

  ${NARROW} {
    display: block;
    position: fixed;
    inset: 0;
    z-index: var(--z-nav);
    backdrop-filter: blur(var(--overlay-blur));
    animation: ${backdropIn} var(--duration) var(--ease-out);
    ${({ $passThrough }) =>
      $passThrough &&
      css`
        pointer-events: none;
      `}
  }
`;

/*
 * Re-keyed per section so page state resets when you move between sections. No entrance: the page just changes. */
const PageTransition = styled.div`
  display: contents;
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
`;

const MobileBar = styled.div`
  display: none;

  ${MOBILE} {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 56px;
    padding: 0 var(--space-3);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-1) 0 var(--space-2);
  margin-bottom: var(--space-3);

`;

const Brand = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  /* Owner: the same size as page headings (ListPage's h1). */
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const iconButton = css`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const IconButton = styled.button`
  ${iconButton}
`;

// Only the mobile drawer needs a close button; on desktop the sidebar is always open.
const CloseButton = styled.button`
  ${iconButton}
  display: none;

  ${MOBILE} {
    display: inline-flex;
  }
`;

/**
 * Collapse (docked) or keep open (overlay): only between 768px and 1199px. A quiet icon, not a boxed
 * button, so it doesn't compete with the sections below it.
 */
const DockButton = styled.button`
  ${iconButton}
  display: none;

  ${NARROW} {
    display: inline-flex;
  }
`;

/**
 * The button that opens a collapsed sidebar: the kit's outline button, square, the height of the page
 * header's other buttons. Only shown while collapsed, between 768px and 1199px.
 */
const OpenButton = styled(Button)`
  display: none;
  width: 36px;
  padding: 0;
  flex-shrink: 0;

  ${NARROW} {
    ${COLLAPSED} {
      display: inline-flex;
      /* Above the overlay's blurred backdrop, so the button that toggles it stays sharp. */
      position: relative;
      z-index: calc(var(--z-nav) + 1);
    }
  }
`;

/**
 * Holds the open button for pages without a ListPageHeader (which puts it beside the page title itself),
 * lined up with where that title would be.
 */
const OpenBar = styled.div`
  display: none;

  ${NARROW} {
    ${COLLAPSED} {
      display: flex;
      padding: var(--space-5) var(--space-6) 0;
    }
    main:has([data-sidebar-open-slot]) & {
      display: none;
    }
  }
`;

/**
 * Nav icons sit in muted grey on the tinted sidebar, so the kit's 1.5 stroke reads thinner there than
 * elsewhere. A slightly heavier stroke makes them match the weight of icons in the page.
 */
const NAV_STROKE = 1.75;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ItemLink = styled(Link)`

  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &[aria-current="page"] {
    background: var(--color-bg-selected);
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

`;

const ItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Count = styled.span`
  min-width: 22px;
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  text-align: center;
  font-variant-numeric: tabular-nums;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Divider = styled.hr`
  margin: var(--space-3) var(--space-2);
  border: 0;
  border-top: 1px solid var(--color-border);
`;

const SectionLabel = styled.p`
  margin: 0 0 var(--space-1);
  padding: 0 var(--space-2);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-subtle);
`;

const RecentLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 32px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  text-decoration: none;

  svg {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  &:hover {
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const RecentText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RecentContext = styled.span`
  color: var(--color-text-muted);
`;

const Footer = styled.div`
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
`;

const FooterLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  text-decoration: none;
  transition: background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &[aria-current="page"] {
    background: var(--color-bg-selected);
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const SignOutButton = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-danger-subtle);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

/*
 * A 404 inside a portal keeps the sidebar but highlights nothing (owner): the URL may still start with a
 * section's path (e.g. /admin/opportunities/unknown-id). The 404 page flips this flag while it's shown.
 */
let notFoundShown = false;
const notFoundListeners = new Set<() => void>();
export function setSidebarNotFound(value: boolean) {
  notFoundShown = value;
  notFoundListeners.forEach((listener) => listener());
}
function subscribeNotFound(listener: () => void) {
  notFoundListeners.add(listener);
  return () => notFoundListeners.delete(listener);
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  config,
  onNavigate,
  onClose,
  closeRef,
  brandId,
  collapsed,
  onToggleCollapsed,
  dockRef,
}: {
  config: SidebarConfig;
  brandId: string;
  /** Called with the destination when a link in the sidebar is chosen. */
  onNavigate: (href: string) => void;
  onClose: () => void;
  closeRef: React.Ref<HTMLButtonElement>;
  /** The collapse / keep-open button (768–1199px). */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  dockRef: React.Ref<HTMLButtonElement>;
}) {
  const pathname = usePathname();
  // Highlight the chosen item at once (owner): a slow page would otherwise leave the old item selected
  // until it loads, so the click looks ignored. Dropped as soon as the URL changes.
  const [pending, setPending] = React.useState<{ href: string; from: string } | null>(null);
  const notFound = React.useSyncExternalStore(subscribeNotFound, () => notFoundShown, () => false);
  const current = pending && pending.from === pathname ? pending.href : notFound ? "" : pathname;
  const choose = (href: string) => (e: React.MouseEvent) => {
    // A new tab or window doesn't change this page.
    if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) setPending({ href, from: pathname });
    onNavigate(href);
  };

  return (
    <>
      <Header>
        <Brand id={brandId}>
          {config.product.name}
        </Brand>
        <CloseButton ref={closeRef} type="button" aria-label="Close menu" onClick={onClose}>
          <Icon icon={X} size={20} />
        </CloseButton>
        <DockButton
          ref={dockRef}
          type="button"
          aria-label={collapsed ? "Keep sidebar open" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          {/* A pin, not the open button's icon: it docks the sidebar, and the open button is already on screen. */}
          <Icon icon={collapsed ? Pin : PanelLeftClose} size={16} strokeWidth={NAV_STROKE} />
        </DockButton>
      </Header>

      <Nav aria-label={config.navLabel}>
        {config.items.map((item) => {
          const link = (
            <ItemLink
              key={item.href}
              href={item.href}
              aria-current={isActive(current, item.href) ? "page" : undefined}
              onClick={choose(item.href)}
            >
              <Icon icon={item.icon} size={16} strokeWidth={NAV_STROKE} />
              <ItemLabel>{item.label}</ItemLabel>
              {item.count ? (
                <>
                  <Count aria-hidden="true">{item.count}</Count>
                  <VisuallyHidden>, {item.countLabel}</VisuallyHidden>
                </>
              ) : null}
            </ItemLink>
          );
          return item.description ? (
            <Tooltip
              key={item.href}
              content={item.description}
              side="right"
              delayDuration={DESCRIPTION_DELAY_MS}
              pinOnClick={false}
            >
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </Nav>

      {config.recent && config.recent.items.length > 0 && (
        <>
          <Divider />
          <nav aria-label={config.recent.label}>
            <SectionLabel>{config.recent.label}</SectionLabel>
            {config.recent.items.map((item) => (
              <RecentLink key={item.href} href={item.href} onClick={() => onNavigate(item.href)}>
                <Icon icon={item.icon} size={14} />
                <RecentText>
                  {item.title}
                  {item.context && <RecentContext> · {item.context}</RecentContext>}
                </RecentText>
              </RecentLink>
            ))}
          </nav>
        </>
      )}

      <Footer>
        {config.footerItems?.map((item) => (
          <FooterLink
            key={item.href}
            href={item.href}
            aria-current={isActive(current, item.href) ? "page" : undefined}
            onClick={choose(item.href)}
          >
            <Icon icon={item.icon} size={16} strokeWidth={NAV_STROKE} />
            {item.label}
          </FooterLink>
        ))}
        <FooterLink href={config.docsHref} aria-current={isActive(current, config.docsHref) ? "page" : undefined} onClick={choose(config.docsHref)}>
          <Icon icon={BookOpen} size={16} strokeWidth={NAV_STROKE} />
          Documentation
        </FooterLink>
        <ThemeSwitcher />
        <SignOutButton type="button" onClick={config.onSignOut}>
          <Icon icon={LogOut} size={16} strokeWidth={NAV_STROKE} />
          Sign out
        </SignOutButton>
      </Footer>
    </>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus the page's h1 once it's on screen (a new route can render a moment after the URL changes).
 * List pages make it focusable with tabIndex -1; any other h1 is given it here so focus can land.
 */
function focusHeading(container: HTMLElement | null) {
  let frames = 0;
  const tryFocus = () => {
    const heading = container?.querySelector<HTMLElement>("h1");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus();
      return;
    }
    if (++frames < 120) requestAnimationFrame(tryFocus);
  };
  requestAnimationFrame(tryFocus);
}

/*
 * Hover intent for the collapsed sidebar (Notion-style peek). Hovering the open button slides the sidebar in.
 * It stays while the pointer is over it, or heading towards it; otherwise it closes:
 */
/** Resting on the open button without moving into the sidebar. */
const PEEK_LINGER_MS = 2500;
/** Outside both, moving towards the sidebar: time allowed between moves before giving up. */
const PEEK_APPROACH_MS = 500;
/** Outside both and not heading towards the sidebar: the intent is elsewhere. */
const PEEK_LEAVE_MS = 200;

type Peek = "closed" | "hover" | "pinned";

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  asideId: string;
  peek: Peek;
  /** Pointer entered an open button. */
  hoverOpen: (button: HTMLElement) => void;
  /** Pointer left an open button. */
  hoverLeave: () => void;
  /** An open button was clicked or pressed. */
  togglePinned: (button: HTMLElement) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

const subscribeCollapsed = (listener: () => void) => {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
  return () => observer.disconnect();
};

/**
 * Opens a collapsed sidebar: hover to peek, click to keep it open. Renders nothing outside a SidebarLayout,
 * and is hidden by CSS unless the sidebar is collapsed (768–1199px). ListPageHeader puts one beside the
 * page title (`slot`); pages without one get it from the layout.
 */
export function SidebarOpenButton({ slot = false }: { slot?: boolean }) {
  const sidebar = React.useContext(SidebarContext);
  if (!sidebar) return null;
  return (
    <OpenButton
      type="button"
      $variant="outline"
      aria-label="Open sidebar"
      aria-expanded={sidebar.peek !== "closed"}
      aria-controls={sidebar.asideId}
      data-sidebar-open=""
      {...(slot ? { "data-sidebar-open-slot": "" } : {})}
      onPointerEnter={(e) => e.pointerType === "mouse" && sidebar.hoverOpen(e.currentTarget)}
      onPointerLeave={sidebar.hoverLeave}
      onClick={(e) => sidebar.togglePinned(e.currentTarget)}
    >
      {/* The kit's stroke, like the page's other button icons; NAV_STROKE is for icons on the sidebar's tint. */}
      <Icon icon={PanelLeftOpen} size={16} />
    </OpenButton>
  );
}

function distanceToRect(x: number, y: number, r: DOMRect) {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return Math.hypot(dx, dy);
}

function contains(r: DOMRect, x: number, y: number) {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

/**
 * App layout with a left sidebar. Below 768px it's a modal drawer. From 768px to 1199px it can collapse:
 * hovering the open button peeks it in as an overlay, clicking keeps it open until you click it again, click
 * outside, press Escape or choose a page. From 1200px it's always docked.
 */
export function SidebarLayout({
  config,
  children,
}: {
  config: SidebarConfig;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // "/admin/community/…" → "/admin/community": the page entrance replays only when the section changes.
  const section = pathname.split("/").slice(0, 3).join("/");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [peek, setPeek] = React.useState<Peek>("closed");
  const collapsed = React.useSyncExternalStore(subscribeCollapsed, readSidebarCollapsed, () => false);
  const dockRef = React.useRef<HTMLButtonElement>(null);
  /** The open button last used, for hover intent and for returning focus. */
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const peekTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Set when a click closes the sidebar while the pointer is on the open button: it would otherwise peek
   * straight back in. Cleared once the pointer leaves the button.
   */
  const hoverSuppressed = React.useRef(false);
  const asideId = React.useId();
  const brandId = React.useId();
  const asideRef = React.useRef<HTMLDivElement>(null);
  const mainRef = React.useRef<HTMLElement>(null);
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const wasOpen = React.useRef(false);
  /** Set when a link in the open drawer is chosen: focus then goes to the destination's h1, not the menu button. */
  const pendingHref = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Leave Escape to the account menu (it renders outside the drawer) while that's open.
      const target = e.target as Node | null;
      if (target === document.body || asideRef.current?.contains(target)) setMobileOpen(false);
    };
    // Widening past the breakpoint turns the drawer back into the fixed sidebar, so drop the open state.
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => desktop.matches && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [mobileOpen]);

  // Move focus into the drawer when it opens. On close, return it to the menu button, unless a link was
  // chosen: then it goes to the destination page's heading.
  React.useEffect(() => {
    if (mobileOpen) closeRef.current?.focus();
    else if (wasOpen.current) {
      if (pendingHref.current) {
        // Same page: nothing will re-render, so focus its heading now. Otherwise wait for the route change.
        if (pendingHref.current === pathname) {
          pendingHref.current = null;
          focusHeading(mainRef.current);
        }
      } else if (menuRef.current?.offsetParent) menuRef.current.focus();
    }
    wasOpen.current = mobileOpen;
    // pathname is read, not tracked: the route-change effect below handles navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen]);

  React.useEffect(() => {
    if (!pendingHref.current) return;
    pendingHref.current = null;
    focusHeading(mainRef.current);
  }, [pathname]);

  const clearPeekTimer = () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = null;
  };
  const closePeek = React.useCallback(() => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = null;
    setPeek("closed");
  }, []);
  const closePeekIn = (ms: number) => {
    clearPeekTimer();
    peekTimer.current = setTimeout(closePeek, ms);
  };

  // Hover intent while peeking: keep it open over the sidebar, or while heading towards it.
  React.useEffect(() => {
    if (peek !== "hover") return;
    let lastDistance = Infinity;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const aside = asideRef.current?.getBoundingClientRect();
      const button = triggerRef.current?.getBoundingClientRect();
      if (!aside) return;
      if (contains(aside, e.clientX, e.clientY)) {
        lastDistance = 0;
        clearPeekTimer();
        return;
      }
      if (button && contains(button, e.clientX, e.clientY)) {
        lastDistance = distanceToRect(e.clientX, e.clientY, aside);
        if (!peekTimer.current) closePeekIn(PEEK_LINGER_MS);
        return;
      }
      const distance = distanceToRect(e.clientX, e.clientY, aside);
      const approaching = distance < lastDistance - 0.5;
      lastDistance = distance;
      closePeekIn(approaching ? PEEK_APPROACH_MS : PEEK_LEAVE_MS);
    };
    // The pointer left the window altogether.
    const onLeave = () => closePeekIn(PEEK_LEAVE_MS);
    // Resting on the button right after it opened: start the linger countdown without waiting for a move.
    closePeekIn(PEEK_LINGER_MS);
    document.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the handlers only use refs and closePeek
  }, [peek]);

  // Open in either way: Escape closes and returns focus to the open button. Leaving 768–1199px closes it.
  React.useEffect(() => {
    if (peek === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target as Node | null;
      if (target === document.body || asideRef.current?.contains(target) || target === triggerRef.current) {
        closePeek();
        triggerRef.current?.focus();
      }
    };
    const narrow = window.matchMedia(NARROW_QUERY);
    const onResize = () => !narrow.matches && closePeek();
    window.addEventListener("keydown", onKey);
    narrow.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      narrow.removeEventListener("change", onResize);
    };
  }, [peek, closePeek]);

  // Clicked open behaves like a dialog: focus goes into the sidebar, and back to the open button on close
  // (unless a page was chosen: then it goes to that page's heading).
  const wasPinned = React.useRef(false);
  React.useEffect(() => {
    if (peek === "pinned") {
      // Wait a frame so the sidebar is visible (and focusable) before moving focus into it.
      requestAnimationFrame(() => dockRef.current?.focus());
    } else if (wasPinned.current && !pendingHref.current && triggerRef.current?.offsetParent) {
      triggerRef.current.focus();
    }
    wasPinned.current = peek === "pinned";
  }, [peek]);

  React.useEffect(() => clearPeekTimer, []);
  React.useEffect(syncSidebarCollapsed, []);

  const sidebar: SidebarContextValue = {
    collapsed,
    asideId,
    peek,
    toggleCollapsed: () => {
      const next = !collapsed;
      closePeek();
      applySidebarCollapsed(next);
      // Collapsing hides this button: move focus to the button that brings the sidebar back.
      if (next) {
        requestAnimationFrame(() => {
          const opener = Array.from(document.querySelectorAll<HTMLElement>("[data-sidebar-open]")).find(
            (el) => el.offsetParent !== null,
          );
          opener?.focus();
        });
      }
    },
    hoverOpen: (button) => {
      triggerRef.current = button;
      if (peek === "pinned" || hoverSuppressed.current) return;
      clearPeekTimer();
      setPeek("hover");
    },
    hoverLeave: () => {
      hoverSuppressed.current = false;
    },
    togglePinned: (button) => {
      triggerRef.current = button;
      if (peek === "pinned") {
        hoverSuppressed.current = true;
        closePeek();
      } else {
        clearPeekTimer();
        setPeek("pinned");
      }
    },
  };

  function onNavigate(href: string) {
    if (peek !== "closed") {
      if (peek === "pinned") pendingHref.current = href;
      closePeek();
      return;
    }
    if (!mobileOpen) return;
    pendingHref.current = href;
    setMobileOpen(false);
  }

  // Keep Tab and Shift+Tab inside the open drawer. The page behind is inert, but without this Tab would
  // leave the document for the browser's own controls.
  function onAsideKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const aside = asideRef.current;
    const modal = mobileOpen || peek === "pinned";
    if (!modal || e.key !== "Tab" || !aside || !aside.contains(e.target as Node)) return;
    const focusables = Array.from(aside.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const pinned = peek === "pinned";
  return (
    <SidebarContext.Provider value={sidebar}>
    <Shell>
      <Aside
        ref={asideRef}
        id={asideId}
        $mobileOpen={mobileOpen}
        $peek={peek !== "closed"}
        onKeyDown={onAsideKeyDown}
        {...(mobileOpen || pinned ? { role: "dialog", "aria-modal": true, "aria-labelledby": brandId } : {})}
      >
        <SidebarContent
          config={config}
          onNavigate={onNavigate}
          onClose={() => setMobileOpen(false)}
          closeRef={closeRef}
          brandId={brandId}
          collapsed={collapsed}
          onToggleCollapsed={sidebar.toggleCollapsed}
          dockRef={dockRef}
        />
      </Aside>
      {mobileOpen && (
        <Scrim type="button" tabIndex={-1} aria-hidden="true" onClick={() => setMobileOpen(false)} />
      )}
      {peek !== "closed" && (
        <OverlayBackdrop
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          $passThrough={!pinned}
          onClick={(e) => {
            // Clicking the open button again (under this scrim) closes it for good, not just until a hover.
            const button = triggerRef.current?.getBoundingClientRect();
            if (button && contains(button, e.clientX, e.clientY)) hoverSuppressed.current = true;
            closePeek();
          }}
        />
      )}
      {/* While the drawer (or a clicked-open sidebar) is open the page behind is out of reach, like a dialog. */}
      <Main ref={mainRef} inert={mobileOpen || pinned}>
        <MobileBar>
          <IconButton
            ref={menuRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls={asideId}
            onClick={() => setMobileOpen(true)}
          >
            <Icon icon={Menu} size={20} />
          </IconButton>
          <Brand>{config.product.name}</Brand>
        </MobileBar>
        <OpenBar>
          <SidebarOpenButton />
        </OpenBar>
        <PageTransition key={section}>{children}</PageTransition>
      </Main>
    </Shell>
    </SidebarContext.Provider>
  );
}
