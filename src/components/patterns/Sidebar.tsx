"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { css, styled } from "next-yak";
import type { LucideIcon } from "lucide-react";
import { ChevronsUpDown, Menu, PanelLeft } from "lucide-react";
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

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Unread or pending count; shown as a badge. */
  count?: number;
}

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

const Aside = styled.aside<{ $collapsed: boolean; $mobileOpen: boolean }>`
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
  transition: width var(--duration-slow) var(--ease);

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      width: 64px;
      padding: var(--space-3) var(--space-2);
    `}

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

const Header = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-1) 0 var(--space-2);
  margin-bottom: var(--space-3);

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      flex-direction: column;
      height: auto;
      padding: 0;
    `}
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
    background: var(--stone-200);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const IconButton = styled.button`
  ${iconButton}
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ItemLink = styled(Link)<{ $collapsed: boolean }>`
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
    background: var(--stone-100);
    color: var(--color-text);
  }
  &[aria-current="page"] {
    background: var(--stone-200);
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding: 0;
    `}
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
    background: var(--stone-100);
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

const ProfileButton = styled.button<{ $collapsed: boolean }>`
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
    background: var(--stone-100);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding: var(--space-1) 0;
    `}
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
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  config: SidebarConfig;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <Header $collapsed={collapsed}>
        <Brand>
          <BrandMark aria-hidden="true">{config.product.initials}</BrandMark>
          {!collapsed && config.product.name}
        </Brand>
        {onToggleCollapsed && (
          <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
            <IconButton
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={onToggleCollapsed}
            >
              <Icon icon={PanelLeft} size={18} />
            </IconButton>
          </Tooltip>
        )}
      </Header>

      <Nav aria-label={config.navLabel}>
        {config.items.map((item) => {
          const link = (
            <ItemLink
              key={item.href}
              href={item.href}
              $collapsed={collapsed}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              onClick={onNavigate}
            >
              <Icon icon={item.icon} size={18} />
              {!collapsed && <ItemLabel>{item.label}</ItemLabel>}
              {!collapsed && item.count ? (
                <Count aria-label={`${item.count} new`}>{item.count}</Count>
              ) : null}
            </ItemLink>
          );
          return collapsed ? (
            <Tooltip key={item.href} content={item.label} side="right">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </Nav>

      {config.recent && !collapsed && config.recent.items.length > 0 && (
        <>
          <Divider />
          <nav aria-label={config.recent.label}>
            <SectionLabel>{config.recent.label}</SectionLabel>
            {config.recent.items.map((item) => (
              <RecentLink key={item.href} href={item.href} onClick={onNavigate}>
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
            <ProfileButton
              type="button"
              $collapsed={collapsed}
              aria-label={`Account menu for ${config.user.name}`}
            >
              <Avatar initials={config.user.initials} src={config.user.avatarSrc} size="sm" />
              {!collapsed && (
                <>
                  <ProfileText>
                    <ProfileName>{config.user.name}</ProfileName>
                    <ProfileEmail>{config.user.email}</ProfileEmail>
                  </ProfileText>
                  <Muted>
                    <Icon icon={ChevronsUpDown} size={16} />
                  </Muted>
                </>
              )}
            </ProfileButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" style={{ minWidth: 220 }}>
            <DropdownMenuItem asChild>
              <MenuLink href={config.accountHref} onClick={onNavigate}>
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

/** App layout with a left sidebar. Collapses to icons on desktop; becomes a drawer below 768px. */
export function SidebarLayout({
  config,
  children,
}: {
  config: SidebarConfig;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const asideId = React.useId();

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <Shell>
      <Aside id={asideId} $collapsed={collapsed} $mobileOpen={mobileOpen}>
        <SidebarContent
          config={config}
          collapsed={collapsed && !mobileOpen}
          onToggleCollapsed={mobileOpen ? undefined : () => setCollapsed((c) => !c)}
          onNavigate={() => setMobileOpen(false)}
        />
      </Aside>
      {mobileOpen && (
        <Scrim type="button" tabIndex={-1} aria-hidden="true" onClick={() => setMobileOpen(false)} />
      )}
      <Main>
        <MobileBar>
          <IconButton
            type="button"
            aria-label="Open navigation"
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
