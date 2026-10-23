import type { ReactNode } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { css, styled } from "next-yak";
import { Icon } from "@/components/ui/Icon";

export const AuthScreen = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-6) var(--space-4);
  background: var(--color-bg);
`;

export const AuthColumn = styled.div<{ $wide?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? "440px" : "400px")};
`;

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

export const AuthActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;

  & > form {
    display: flex;
    flex-direction: column;
  }
`;

export const FormError = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
`;

export const Footnote = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-subtle);
  text-align: center;
  white-space: pre-line;
`;

const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);

  &:focus {
    outline: none;
  }
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  white-space: pre-line;
`;

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <HeadingGroup>
      <Title tabIndex={-1}>{title}</Title>
      {description && <Description>{description}</Description>}
    </HeadingGroup>
  );
}

export function SdcLogo() {
  return (
    <Image src="/brand/sdc-logo.png" alt="Social Development Centre Waterloo Region" width={103} height={80} loading="eager" />
  );
}

const tones = {
  brand: { background: "var(--color-brand-tint)", color: "var(--color-brand-heading)" },
  neutral: { background: "var(--color-bg-hover)", color: "var(--color-text-muted)" },
  warning: { background: "var(--color-warning-subtle)", color: "var(--color-warning)" },
};

const Well = styled.div`
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
`;

export function IconWell({ icon, tone }: { icon: LucideIcon; tone: keyof typeof tones }) {
  return (
    <Well style={tones[tone]}>
      <Icon icon={icon} size={24} />
    </Well>
  );
}

/** A link that looks like a large kit Button. */
export const LinkButton = styled.a<{ $variant?: "primary" | "outline" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  line-height: 1;
  text-decoration: none;
  transition: background-color var(--duration) var(--ease);

  ${({ $variant }) =>
    $variant === "outline"
      ? css`
          background: var(--color-bg);
          color: var(--color-text);
          border-color: var(--color-border-strong);
          &:hover {
            background: var(--color-bg-hover);
          }
        `
      : css`
          background: var(--color-primary);
          color: var(--color-on-primary);
          &:hover {
            background: var(--color-primary-hover);
          }
        `}

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;
