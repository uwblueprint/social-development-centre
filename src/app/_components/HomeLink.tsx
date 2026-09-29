"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { styled } from "next-yak";
import { Icon } from "@/components/ui/Icon";

/* A link dressed as the kit's primary button: it navigates, so it isn't a <button>. */
const Root = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 40px;
  margin-top: var(--space-2);
  padding: 0 var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  text-decoration: none;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-primary-hover);
  }
  &:hover > svg {
    translate: var(--space-1) 0;
  }
  & > svg {
    transition: translate var(--duration) var(--ease-spring);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/**
 * "Head home" on the 404: home is the Opportunities page of the portal the missing address was in
 * (owner). Partner addresses go to the partner portal; everything else to the admin portal, whose layout
 * sends anyone who isn't an admin to sign in.
 */
export function HomeLink({ label }: { label: string }) {
  const pathname = usePathname() ?? "";
  const href = pathname.startsWith("/partner") ? "/partner/opportunities" : "/admin/opportunities";
  return (
    <Root href={href}>
      {label}
      <Icon icon={ArrowRight} size={16} />
    </Root>
  );
}
