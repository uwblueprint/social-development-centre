import { styled } from "next-yak";
import { ListPage, ListPageHeader } from "./ListPage";

/* Narrow pages (Organization): the same centred 640px column and padding as OrganizationView. */
const NarrowPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-6) var(--space-8);

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
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

const TitleBar = styled.span`
  display: block;
  width: calc(var(--space-8) * 2.5);
  height: var(--space-5);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/**
 * A route's loading state (`loading.tsx`): the page title (or a bar when it isn't known) above
 * placeholder rows. Without one, Next keeps the old page on screen until the new one is ready, so a
 * sidebar click looks ignored (owner, 28 Sep). `narrow` matches centred 640px pages like Organization.
 */
export function PageLoading({ title, narrow }: { title?: string; narrow?: boolean }) {
  // The real page's wrapper and header, so the title sits exactly where it will when data loads (owner).
  const Page = narrow ? NarrowPage : ListPage;
  return (
    <Page aria-busy="true">
      {title ? <ListPageHeader title={title} /> : <TitleBar aria-hidden="true" />}
      <VisuallyHidden role="status">Loading</VisuallyHidden>
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
