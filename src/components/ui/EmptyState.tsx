import { styled } from "next-yak";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-5);
  text-align: center;
`;

const IconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-subtle);
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.p`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const Description = styled.p`
  margin: 0;
  max-width: 40ch;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-1);
`;

/** Centered icon, title, optional description and action(s) for an empty list or no-results state. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Wrapper>
      <IconWrap aria-hidden="true">
        <Icon icon={icon} size={22} />
      </IconWrap>
      <Text>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </Text>
      {action && <Actions>{action}</Actions>}
    </Wrapper>
  );
}
