import { keyframes, styled } from "next-yak";
import { RadioCardGroup } from "@/components/ui/RadioGroup";

/*
 * The intake form's paper look, shared with the member-facing email-preferences and membership screens:
 * a hand-drawn sheet on a dotted desk. The page re-points --color-bg and --color-bg-hover at the paper so
 * kit components sit on it. On a phone the sheet fills the screen instead.
 */

const fadeUp = keyframes`
  from {
    opacity: 0;
    translate: 0 var(--enter-offset);
  }
`;
const sheetIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(var(--space-6)) scale(0.96);
  }
`;

export const PaperPage = styled.div`
  --color-bg: var(--intake-paper);
  --color-bg-hover: var(--intake-paper-tint);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--intake-desk);
  background-image: radial-gradient(var(--intake-desk-dot) 1px, transparent 1.2px);
  background-size: var(--space-5) var(--space-5);
  color: var(--color-text);
  font-family: var(--font-intake-body);
  line-height: var(--leading-body);
`;

export const PaperSheet = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 40rem;
  min-height: calc(100dvh - var(--space-4) * 2);
  margin: var(--space-4) auto;
  padding: var(--space-5) var(--space-5) 0;
  border: 2px solid var(--intake-ink);
  border-radius: var(--radius-intake-sheet);
  background: var(--intake-paper);
  box-shadow: var(--shadow-intake-sheet);
  animation: ${sheetIn} var(--duration-enter) var(--ease-spring) both;

  @media (max-width: 40rem) {
    min-height: 100dvh;
    margin: 0;
    padding: var(--space-4) var(--space-4) 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
`;

export const PaperLogos = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--space-6);

  img {
    width: auto;
    height: var(--space-8);
  }
  @media (max-height: 45rem), (max-width: 40rem) {
    img {
      height: var(--space-7);
    }
  }
`;

/** One step's content; key it by step so each new step fades in. */
export const PaperStep = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  animation: ${fadeUp} var(--duration-enter) var(--ease) both;
`;

/** The step's heading. Give it tabIndex={-1} so focus can move to it on each step. */
export const PaperHeading = styled.h1`
  margin: 0;
  font-family: var(--font-intake-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-regular);
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;

  &:focus {
    outline: none;
  }
`;

export const PaperLead = styled.p`
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
  max-width: 60ch;
`;

/* Single-choice cards in one column, as in the letter design: each option on its own line. */
export const PaperChoices = styled(RadioCardGroup)`
  grid-template-columns: 1fr;
  gap: var(--space-3);
`;

/** A RadioCard's text inside PaperChoices. */
export const PaperCardText = styled.span`
  /* Leave room for the card's check in the corner. */
  padding-right: var(--space-6);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
`;

/*
 * The step's buttons, stuck to the bottom of the sheet so the next step is never below a long list.
 * The last button stretches to fill the row; put the main action last. Wraps when the buttons don't fit
 * on one line (a phone with three buttons).
 */
export const PaperActions = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0 calc(var(--space-5) * -1);
  padding: var(--space-3) var(--space-5) var(--space-4);
  background: var(--intake-paper);

  > :last-child {
    flex: 1;
  }
  @media (max-width: 40rem) {
    margin: 0 calc(var(--space-4) * -1);
    padding: var(--space-3) var(--space-4) var(--space-4);
  }
`;
