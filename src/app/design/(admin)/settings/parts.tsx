import { styled } from "next-yak";

/* Shared by Settings and Account: one centered column of labelled fields. */

/* Centered, wide enough to breathe, narrow enough that a label and its field stay in one glance. */
export const Column = styled.div`
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
  /* Rows stack by the column's own width, not the window's: beside the sidebar the column can be narrow on a wide screen. */
  container: settings / inline-size;
  /* Room under the last row for the unsaved-changes toast, so it never sits on top of Delete account. */
  padding-bottom: calc(var(--space-8) + var(--space-5));
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

/* One line between sections, none between rows: the lines show what belongs together. */
export const Sections = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  padding-block: var(--space-6);

  &:first-child {
    padding-top: 0;
  }
  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

/* The page's one heading style. Everything else is the one label style below. */
export const SectionTitle = styled.h2`
  margin: 0;
  padding-bottom: var(--space-2);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  color: var(--color-text);
`;

/*
 * Label on the left, the field itself on the right. Fields are always editable: click and type.
 * Rows align to the top so a field that grows (several emails, a longer footer) never drags its label.
 */
export const Row = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
  column-gap: var(--space-5);
  padding: var(--space-2) 0;

  /* Too narrow for a 280px label and a field that fits an email in one tag: the label goes above its field. */
  @container settings (max-width: 599px) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--space-2);
  }
`;

/*
 * The page's one label style (small, regular, main text). Its first line sits level with the first line of
 * text in the field: padded by half of what a 40px control has around one line, so one line is control-height tall.
 */
export const RowLabel = styled.span`
  display: block;
  padding-block: calc((var(--control-height) - 1lh) / 2);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: var(--leading-ui);
  color: var(--color-text);

  /* Stacked above its field there is nothing to sit level with, so the label is only as tall as its text. */
  @container settings (max-width: 599px) {
    padding-block: 0;
  }
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
