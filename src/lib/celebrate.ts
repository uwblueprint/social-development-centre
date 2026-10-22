import confetti from "canvas-confetti";

/** Tokens, read at runtime: confetti draws on a canvas, which can't use CSS variables directly. */
const CONFETTI_TOKENS = ["--color-success", "--color-category-1", "--color-category-2", "--color-category-3", "--color-warning"];

/** A short burst from both bottom corners. Skipped for people who ask for reduced motion. */
export function celebrate() {
  const styles = getComputedStyle(document.documentElement);
  const colors = CONFETTI_TOKENS.map((t) => styles.getPropertyValue(t).trim()).filter(Boolean);
  // `disableForReducedMotion` skips it for people who ask for less motion.
  const burst = { particleCount: 80, spread: 70, startVelocity: 45, colors, disableForReducedMotion: true };
  void confetti({ ...burst, angle: 60, origin: { x: 0, y: 0.7 } });
  void confetti({ ...burst, angle: 120, origin: { x: 1, y: 0.7 } });
}
