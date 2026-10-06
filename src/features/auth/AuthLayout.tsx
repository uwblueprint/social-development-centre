import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { css, styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { SDC_CONTACT_EMAIL } from "@/lib/contact";
import { sharedCopy } from "./copy";

/*
 * The sign-in screens for members, partners and admins (Figma "Auth — …" sections): one centred column
 * with the SDC logo or an icon well, a brand-green heading, the form or actions, and a quiet footnote.
 */

export const AuthMain = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-7) var(--space-4);
  background: var(--color-bg);
`;

/** 400 for most screens; 440 for the two-line "not on our paying member list" heading; 460 for partners. */
export const AuthColumn = styled.div<{ $width?: "md" | "lg" | "xl" }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  width: 100%;
  max-width: 400px;
  ${({ $width }) =>
    $width === "lg" &&
    css`
      max-width: 440px;
    `}
  ${({ $width }) =>
    $width === "xl" &&
    css`
      max-width: 460px;
    `}
`;

/** The SDC mark: 103×80 as in Figma on sign-in screens; smaller in a page header. */
export function SdcLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const [width, height] = size === "sm" ? [62, 48] : [103, 80];
  return <Image src="/brand/sdc-logo.png" alt={sharedCopy.logoAlt} width={width} height={height} priority />;
}

const Well = styled.div<{ $tone: "brand" | "warning" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-brand-tint);
  color: var(--color-brand-heading);
  ${({ $tone }) =>
    $tone === "warning" &&
    css`
      background: var(--color-warning-subtle);
      color: var(--color-warning);
    `}
  ${({ $tone }) =>
    $tone === "neutral" &&
    css`
      background: var(--color-bg-hover);
      color: var(--color-text-muted);
    `}
`;

/** A 24px icon in a 56px circle, above the heading on result screens (check email, expired, …). */
export function IconWell({ icon, tone = "brand" }: { icon: LucideIcon; tone?: "brand" | "warning" | "neutral" }) {
  return (
    <Well $tone={tone}>
      <Icon icon={icon} size={24} />
    </Well>
  );
}

const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  text-align: center;
  overflow-wrap: break-word;
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);
  text-wrap: balance;
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/** The h1, its description and an optional badge above ("SDC staff only"). */
export function AuthHeading({
  title,
  description,
  badge,
}: {
  title: ReactNode;
  description?: ReactNode;
  badge?: string;
}) {
  return (
    <HeadingGroup>
      {badge && <Badge>{badge}</Badge>}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
    </HeadingGroup>
  );
}

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

/** Stacked full-width actions under a result heading. */
export const AuthActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;

  & > button,
  & > a,
  & > form,
  & > form > button {
    width: 100%;
  }
`;

export const Footnote = styled.p`
  margin: 0;
  width: 100%;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-subtle);
  text-align: center;
`;

/** Small print under a full-width button, e.g. the resend cooldown. */
export const ActionNote = styled(Footnote)``;

/** An inline link inside running text (mailto addresses in footnotes and help). */
export const InlineLink = styled.a`
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:hover {
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/** SDC's contact address as a mailto link, or plain text while it's still a placeholder. */
export function ContactEmail() {
  if (!SDC_CONTACT_EMAIL.includes("@")) return <>{SDC_CONTACT_EMAIL}</>;
  return <InlineLink href={`mailto:${SDC_CONTACT_EMAIL}`}>{SDC_CONTACT_EMAIL}</InlineLink>;
}

/** A one-line result under a form's button: an icon plus text, never color alone. */
export const FormMessage = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--color-danger);
  }
`;

/** A quiet goodbye above the sign-in form after signing out (platform decision 4). */
export const Goodbye = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  text-align: center;
`;

/*
 * A link dressed as the kit's large button: it navigates (to another page, site or mail app), so it isn't
 * a <button>. Same tokens as Button $size="lg" (see src/app/_components/HomeLink.tsx). next/link renders
 * external and mailto: hrefs as plain anchors.
 */
export const LinkButton = styled(Link)<{ $variant?: "primary" | "outline" | "ghost"; $size?: "md" | "lg" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  padding: 0 var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  background: var(--color-primary);
  color: var(--color-on-primary);
  transition:
    background-color var(--duration) var(--ease),
    transform var(--duration) var(--ease);

  &:hover {
    background: var(--color-primary-hover);
  }
  &:active {
    transform: scale(0.96);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  ${({ $size }) =>
    $size === "md" &&
    css`
      height: 36px;
      padding: 0 var(--space-4);
      font-size: var(--text-sm);
    `}
  ${({ $variant }) =>
    $variant === "outline" &&
    css`
      background: var(--color-bg);
      color: var(--color-text);
      border-color: var(--color-border-strong);
      &:hover {
        background: var(--color-bg-hover);
      }
    `}
  ${({ $variant }) =>
    $variant === "ghost" &&
    css`
      background: transparent;
      color: var(--color-text);
      &:hover {
        background: var(--color-bg-hover);
      }
    `}
`;
