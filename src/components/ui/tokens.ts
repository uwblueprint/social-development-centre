import { globalStyle } from "next-yak";

// Provisional values until the Jack & Jill reference can be pulled; swap here only.
globalStyle`
  :root {
    --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-display: var(--font-sans);

    --color-bg: #ffffff;
    --color-surface: #f6f6f4;
    --color-surface-raised: #ffffff;
    --color-text: #111111;
    --color-text-muted: #6b6b6b;
    --color-border: #e4e4e0;
    --color-border-strong: #c9c9c4;
    --color-primary: #111111;
    --color-primary-hover: #333333;
    --color-on-primary: #ffffff;
    --color-accent: #3d5afe;
    --color-danger: #d92d20;
    --color-on-danger: #ffffff;
    --color-success: #12805c;
    --color-focus: #3d5afe;
    --color-overlay: rgb(17 17 17 / 0.45);

    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-full: 999px;

    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 24px;
    --space-6: 32px;
    --space-7: 48px;
    --space-8: 64px;

    --text-xs: 0.75rem;
    --text-sm: 0.875rem;
    --text-md: 1rem;
    --text-lg: 1.25rem;
    --text-xl: 2rem;
    --text-display: clamp(2.5rem, 6vw, 4.5rem);
    --tracking-tight: -0.03em;

    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
    --shadow-md: 0 8px 24px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.06);
    --shadow-lg: 0 24px 48px rgb(0 0 0 / 0.14);

    --focus-ring: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-focus);
    --duration: 150ms;
    --ease: cubic-bezier(0.2, 0, 0, 1);
  }

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: var(--font-sans);
    font-size: var(--text-md);
    line-height: 1.5;
    color: var(--color-text);
    background: var(--color-bg);
    -webkit-font-smoothing: antialiased;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
