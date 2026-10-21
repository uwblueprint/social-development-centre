"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";

/** Stand-in until the admin portal's sidebar (AdminShell) lands. */
const links = [
  { href: "/admin/admins", label: "Admins" },
  { href: "/admin/community", label: "Paying members" },
];

const Bar = styled.div`
  border-bottom: 1px solid var(--color-border);
`;

const Inner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
`;

const Links = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const NavLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  /* Fill plus weight, so the current page isn't marked by color alone. */
  &[aria-current="page"] {
    background: var(--color-bg-selected);
    color: var(--color-text);
    font-weight: var(--weight-medium);
  }
`;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <Bar>
      <Inner>
        <nav aria-label="Admin navigation">
          <Links>
            {links.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </Links>
        </nav>
        <form action={signOut.bind(null, "admin")}>
          <Button type="submit" $variant="outline" $size="sm">
            Sign out
          </Button>
        </form>
      </Inner>
    </Bar>
  );
}
