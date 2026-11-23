import Link from "next/link";
import { styled } from "next-yak";

const Heading = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
`;

/**
 * The kit's Button renders a <button>, and navigation should be a link, so this is a link drawn as a
 * primary Button (same as `LinkButton` in the sign-in screen). Ask the design-system owner whether the
 * kit should get a link-as-button.
 */
const ContinueLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-md);
  line-height: 1;
  text-decoration: none;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-primary-hover);
  }
`;

/** Keeps the signup link's `source` on every step so joins are attributed to it. */
function withSource(path: string, source: string | string[] | undefined) {
  const value = Array.isArray(source) ? source[0] : source;
  return value ? `${path}?source=${encodeURIComponent(value)}` : path;
}

export function JoinStep({
  title,
  next,
  source,
}: {
  title: string;
  next?: string;
  source: string | string[] | undefined;
}) {
  return (
    <>
      <Heading>{title}</Heading>
      {next && <ContinueLink href={withSource(next, source)}>Continue</ContinueLink>}
    </>
  );
}
