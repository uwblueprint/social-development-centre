"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { keyframes, styled } from "next-yak";
import { BookmarkCheck, Compass, FlaskConical, LogOut, Moon, Pencil, Sparkles, Sun, type LucideIcon } from "lucide-react";
import { OfflineWatcher } from "@/app/_components/OfflineWatcher";
import { signOut } from "@/app/login/actions";
import { Icon } from "@/components/ui/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { AppToastProvider } from "@/components/ui/Toast";
import { applyTheme, readTheme } from "@/lib/theme";
import { feedCopy } from "../copy";
import type { MemberProfile } from "../types";
import { MemberProvider, useMember } from "./MemberProvider";

/*
 * A consumer frame, not the partner and admin sidebar: a slim top bar on tablet and desktop, and on phones a
 * bottom tab bar within thumb reach. Both hold the same three places. `--header-height` is shared so the
 * Explore filter bar can stick right under the top bar.
 */
const Frame = styled.div`
  --header-height: calc(var(--space-7) + var(--space-2));
  --tabbar-height: var(--space-8);

  min-height: 100dvh;
  background: var(--color-bg);

  @media (max-width: 767px) {
    --header-height: var(--space-7);

    padding-bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
  }
`;

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  gap: var(--space-5);
  height: var(--header-height);
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);

  @media (max-width: 767px) {
    justify-content: space-between;
    padding: 0 var(--space-4);
  }
`;

const Brand = styled(Link)`
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  text-decoration: none;
  border-radius: var(--radius-sm);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-right: auto;

  @media (max-width: 767px) {
    display: none;
  }
`;

const bump = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

/* The count swells slightly when it changes, so adding something registers even if the list isn't on screen. */
const Count = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--space-4);
  height: var(--space-4);
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-xs);
  line-height: var(--leading-none);
  font-variant-numeric: tabular-nums;
  animation: ${bump} var(--duration-slow) var(--ease);
`;

const NavLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
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

const TabBar = styled.nav`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--z-nav);
  display: none;
  height: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
  padding: 0 var(--space-2) env(safe-area-inset-bottom);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);

  @media (max-width: 767px) {
    display: flex;
  }
`;

const Tab = styled(Link)`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-width: 0;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;

  &[aria-current="page"] {
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: inset var(--focus-ring);
    border-radius: var(--radius-md);
  }
`;

/* The active tab's pill grows from the middle; its icon nudges up when pressed. */
const TabIcon = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-7);
  height: var(--space-6);
  border-radius: var(--radius-full);
  transition:
    background-color var(--duration) var(--ease),
    transform var(--duration) var(--ease-spring);

  ${Tab}[aria-current="page"] & {
    background: var(--color-bg-selected);
  }
  ${Tab}:active & {
    transform: scale(0.9);
  }
`;

const TabCount = styled(Count)`
  position: absolute;
  top: calc(var(--space-1) * -1);
  right: var(--space-1);
`;

const Avatar = styled.button`
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-secondary);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-secondary-hover);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

const Who = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  padding: var(--space-2) var(--space-3);
`;

const WhoName = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  overflow-wrap: anywhere;
`;

const WhoEmail = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Main = styled.main`
  display: block;
`;

const ITEMS: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: "/member/for-you", label: feedCopy.nav.forYou, short: feedCopy.nav.forYou, icon: Sparkles },
  { href: "/member/explore", label: feedCopy.nav.explore, short: feedCopy.nav.explore, icon: Compass },
  { href: "/member/yours", label: feedCopy.nav.yours, short: feedCopy.nav.yoursShort, icon: BookmarkCheck },
];

function isDark(): boolean {
  const saved = readTheme();
  return saved === "dark" || (saved === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function AccountMenu() {
  const { member, editInterests } = useMember();
  const [dark, setDark] = React.useState(false);
  const initial = member.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <DropdownMenu onOpenChange={(open) => open && setDark(isDark())}>
      <DropdownMenuTrigger asChild>
        <Avatar type="button" aria-label={feedCopy.nav.account}>
          {initial}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel asChild>
          <Who>
            <WhoName>{member.name}</WhoName>
            <WhoEmail>{member.email}</WhoEmail>
          </Who>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={editInterests}>
          <Icon icon={Pencil} size={16} />
          {feedCopy.nav.editInterests}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => applyTheme(dark ? "light" : "dark")}>
          <Icon icon={dark ? Sun : Moon} size={16} />
          {dark ? feedCopy.nav.lightMode : feedCopy.nav.darkMode}
        </DropdownMenuItem>
        {process.env.NODE_ENV !== "production" && ( // STATE LAB (disposable): opens src/dev/state-lab
          <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event("state-lab:open"))}>
            <Icon icon={FlaskConical} size={16} />
            State lab
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut(member.name.split(/\s+/)[0])}>
          <Icon icon={LogOut} size={16} />
          {feedCopy.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { entries, ready } = useMember();
  const count = ready ? entries.length : 0;
  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);
  return (
    <Frame>
      <TopBar>
        <Brand href="/member/for-you">{feedCopy.brand}</Brand>
        <DesktopNav aria-label={feedCopy.nav.label}>
          {ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} aria-current={current(item.href)}>
              {item.label}
              {item.href.endsWith("yours") && count > 0 && <Count key={count}>{count}</Count>}
            </NavLink>
          ))}
        </DesktopNav>
        <AccountMenu />
      </TopBar>
      <Main>{children}</Main>
      <TabBar aria-label={feedCopy.nav.label}>
        {ITEMS.map((item) => (
          <Tab key={item.href} href={item.href} aria-current={current(item.href)}>
            <TabIcon>
              <Icon icon={item.icon} size={22} />
              {item.href.endsWith("yours") && count > 0 && <TabCount key={count}>{count}</TabCount>}
            </TabIcon>
            {item.short}
          </Tab>
        ))}
      </TabBar>
    </Frame>
  );
}

export function MemberShell({ member, now, children }: { member: MemberProfile; now: string; children: React.ReactNode }) {
  return (
    // One provider for the whole portal so a toast survives moving between tabs.
    <AppToastProvider>
      <OfflineWatcher />
      <MemberProvider member={member} now={now}>
        <Chrome>{children}</Chrome>
      </MemberProvider>
    </AppToastProvider>
  );
}
