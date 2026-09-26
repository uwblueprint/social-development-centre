import { styled } from "next-yak";

const Wrapper = styled.div`
  max-width: 880px;
  padding: var(--space-7) var(--space-6);

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4);
  }
`;

const Title = styled.h1`
  margin: 0 0 var(--space-2);
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const Description = styled.p`
  margin: 0;
  max-width: 60ch;
  color: var(--color-text-muted);
  line-height: var(--leading-body);
`;

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Wrapper>
  );
}
