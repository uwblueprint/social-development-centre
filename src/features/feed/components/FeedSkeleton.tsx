import { keyframes, styled } from "next-yak";
import { VisuallyHidden } from "./FeedPage";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const Page = styled.div`
  --gutter: var(--space-6);

  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: calc(var(--space-8) * 19);
  margin: 0 auto;
  padding: var(--space-6) var(--gutter) var(--space-8);

  @media (max-width: 767px) {
    --gutter: var(--space-4);

    padding-top: var(--space-5);
  }
`;

const Bar = styled.span<{ $width: string; $tall?: boolean }>`
  display: block;
  width: ${({ $width }) => $width};
  max-width: 100%;
  height: ${({ $tall }) => ($tall ? "var(--space-6)" : "var(--space-3)")};
  border-radius: var(--radius-sm);
  background: var(--color-surface);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--space-8) * 4.5)), 1fr));
  gap: var(--space-5) var(--space-4);
`;

/* The real card's silhouette: picture, three lines, button. The group pulses slowly, all together. */
const Card = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  animation: ${pulse} 1.6s var(--ease) infinite;
`;

const Picture = styled.span`
  display: block;
  aspect-ratio: 16 / 9;
  background: var(--color-surface);
`;

const Lines = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
`;

const Button = styled.span`
  display: block;
  height: 36px;
  margin-top: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-surface);
`;

/** A member page's loading state (`loading.tsx`): card-shaped placeholders in the feed's own grid, so nothing jumps when data arrives. */
export function FeedSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Page aria-busy="true">
      <div>
        <Bar $width="calc(var(--space-8) * 3)" $tall />
      </div>
      <VisuallyHidden role="status">Loading</VisuallyHidden>
      <Grid aria-hidden="true">
        {Array.from({ length: cards }, (_, i) => (
          <Card key={i} style={{ animationDelay: `calc(var(--stagger) * ${i})` }}>
            <Picture />
            <Lines>
              <Bar $width="55%" />
              <Bar $width="85%" />
              <Bar $width="40%" />
              <Button />
            </Lines>
          </Card>
        ))}
      </Grid>
    </Page>
  );
}
