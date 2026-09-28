import { styled } from "next-yak";
import { copy } from "../copy";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 960px;
  padding: var(--space-7) var(--space-6);

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4);
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

/* Placeholder rows at the table's row rhythm; hairline dividers like the real table. */
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);

  &:not(:first-child) {
    border-top: 1px solid var(--color-border);
  }
`;

const Bar = styled.span<{ $width: string }>`
  display: block;
  height: var(--space-3);
  width: ${({ $width }) => $width};
  border-radius: var(--radius-sm);
  background: var(--color-surface);
`;

/** Route-level loading state for both portals' Opportunities lists. */
export function OpportunitiesLoading() {
  return (
    <Page aria-busy="true">
      <Title>{copy.page.title}</Title>
      <Rows aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Row key={i}>
            <Bar $width="40%" />
            <Bar $width="20%" />
            <Bar $width="15%" />
          </Row>
        ))}
      </Rows>
    </Page>
  );
}
