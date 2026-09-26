import { styled } from "next-yak";

export const Card = styled.div`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
`;

export const CardHeader = styled.div`
  padding: var(--space-5) var(--space-5) 0;
`;

export const CardTitle = styled.h3`
  margin: 0 0 var(--space-1);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
`;

export const CardDescription = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

export const CardContent = styled.div`
  padding: var(--space-5);
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-5) var(--space-5);
`;
