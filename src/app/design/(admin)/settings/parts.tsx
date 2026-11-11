import { styled } from "next-yak";

/* Shared by Settings and Account: one centered column of labelled fields. */

/* Centered, wide enough to breathe, narrow enough that a label and its field stay in one glance. */
export const Column = styled.div`
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  padding-bottom: var(--space-3);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
`;

/*
 * Label on the left, the field itself on the right. Fields are always editable: click and type.
 * Rows align to the top so a field that grows (several emails, a longer signature) never drags its label.
 */
export const Row = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
  column-gap: var(--space-5);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--space-2);
  }
`;

/* The kit's label look (small, regular, main text), as tall as an input so it sits level with the first line of its field. */
export const RowLabel = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--control-height);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

export const RowDetail = styled.span`
  color: var(--color-text-muted);
`;

/* The row's own label is the visible one; the Field's label row is kept for screen readers only. */
export const Cell = styled.div`
  min-width: 0;

  & > div > div:first-child {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
`;
