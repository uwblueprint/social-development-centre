"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { css, keyframes, styled } from "next-yak";
import type { LucideIcon } from "lucide-react";
import { ChevronsUpDown, Menu, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";

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
  product: { name: string; initials: string };
  /** Accessible name for the main navigation landmark. */
  navLabel: string;
  items: SidebarNavItem[];
  recent?: { label: string; items: SidebarRecentItem[] };
  user: { name: string; email: string; initials: string; avatarSrc?: string };
  accountHref: string;
  onSignOut?: () => void;
}

const MOBILE = "@media (max-width: 767px)";

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
`;

// Entrance on first load. Uses `translate` (not `transform`) so it can't fight the mobile drawer's transform.
const slideIn = keyframes`
  from {
    opacity: 0;
    translate: calc(var(--enter-offset) * -1) 0;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const enter = css`
  animation: ${slideIn} var(--duration-enter) var(--ease) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// A div, not an aside: below 768px it becomes a modal dialog, a role <aside> can't take. The nav inside is the landmark.
const Aside = styled.div<{ $mobileOpen: boolean }>`
  ${enter}
  position: sticky;
  top: 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 264px;
  padding: var(--space-3);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);


  ${MOBILE} {
    position: fixed;
    z-index: 50;
    left: 0;
    width: min(288px, 85vw);
    padding: var(--space-3);
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    visibility: hidden;
    transition:
      transform var(--duration-slow) var(--ease),
      visibility 0s linear var(--duration-slow);

    ${({ $mobileOpen }) =>
      $mobileOpen &&
      css`
        transform: translateX(0);
        visibility: visible;
        transition: transform var(--duration-slow) var(--ease);
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
    z-index: 40;
    background: var(--color-overlay);
  }
`;

const Main = styled.main`
  animation: ${fadeIn} var(--duration-enter) var(--ease) calc(var(--stagger) * 6) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

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
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const BrandMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 10px;
  font-weight: var(--weight-medium);
  letter-spacing: 0.02em;
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
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

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

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ItemLink = styled(Link)`
  ${enter}
  animation-delay: calc(var(--stagger) * (var(--i, 0) + 2));

  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  text-decoration: none;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

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
  animation: ${fadeIn} var(--duration-enter) var(--ease) calc(var(--stagger) * 7) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
`;

const ProfileButton = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration) var(--ease);

  &:hover,
  &[data-state="open"] {
    background: var(--color-bg-hover);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

`;

const ProfileText = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: var(--leading-ui);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ProfileName = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const ProfileEmail = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const MenuLink = styled(Link)`
  color: inherit;
  text-decoration: none;
`;

const Muted = styled.span`
  display: inline-flex;
  color: var(--color-text-muted);
`;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  config,
  onNavigate,
  onClose,
  closeRef,
  brandId,
}: {
  config: SidebarConfig;
  brandId: string;
  /** Called with the destination when a link in the sidebar is chosen. */
  onNavigate: (href: string) => void;
  onClose: () => void;
  closeRef: React.Ref<HTMLButtonElement>;
}) {
  const pathname = usePathname();

  return (
    <>
      <Header>
        <Brand id={brandId}>
          <BrandMark aria-hidden="true">{config.product.initials}</BrandMark>
          {config.product.name}
        </Brand>
        <CloseButton ref={closeRef} type="button" aria-label="Close menu" onClick={onClose}>
          <Icon icon={X} size={20} />
        </CloseButton>
      </Header>

      <Nav aria-label={config.navLabel}>
        {config.items.map((item, i) => {
          const link = (
            <ItemLink
              key={item.href}
              style={{ "--i": i } as React.CSSProperties}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              onClick={() => onNavigate(item.href)}
            >
              <Icon icon={item.icon} size={18} />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ProfileButton type="button" aria-label={`Open account menu for ${config.user.name}`}>
              <Avatar initials={config.user.initials} src={config.user.avatarSrc} size="sm" />
              <ProfileText>
                <ProfileName>{config.user.name}</ProfileName>
                <ProfileEmail>{config.user.email}</ProfileEmail>
              </ProfileText>
              <Muted>
                <Icon icon={ChevronsUpDown} size={16} />
              </Muted>
            </ProfileButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" style={{ minWidth: 220 }}>
            <DropdownMenuItem asChild>
              <MenuLink href={config.accountHref} onClick={() => onNavigate(config.accountHref)}>
                My account
              </MenuLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={config.onSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

/** App layout with a left sidebar; becomes a modal drawer below 768px. */
export function SidebarLayout({
  config,
  children,
}: {
  config: SidebarConfig;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
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

  function onNavigate(href: string) {
    if (!mobileOpen) return;
    pendingHref.current = href;
    setMobileOpen(false);
  }

  // Keep Tab and Shift+Tab inside the open drawer. The page behind is inert, but without this Tab would
  // leave the document for the browser's own controls.
  function onAsideKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const aside = asideRef.current;
    if (!mobileOpen || e.key !== "Tab" || !aside || !aside.contains(e.target as Node)) return;
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

  return (
    <Shell>
      <Aside
        ref={asideRef}
        id={asideId}
        $mobileOpen={mobileOpen}
        onKeyDown={onAsideKeyDown}
        {...(mobileOpen ? { role: "dialog", "aria-modal": true, "aria-labelledby": brandId } : {})}
      >
        <SidebarContent
          config={config}
          onNavigate={onNavigate}
          onClose={() => setMobileOpen(false)}
          closeRef={closeRef}
          brandId={brandId}
        />
      </Aside>
      {mobileOpen && (
        <Scrim type="button" tabIndex={-1} aria-hidden="true" onClick={() => setMobileOpen(false)} />
      )}
      {/* While the drawer is open the page behind is dimmed and out of reach, like a dialog. */}
      <Main ref={mainRef} inert={mobileOpen}>
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
        {children}
      </Main>
    </Shell>
  );
}
