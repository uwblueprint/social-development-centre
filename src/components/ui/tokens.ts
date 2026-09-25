import { globalStyle } from "next-yak";

// Modelled on jackandjill.ai; only #f9f9f6 is their exact value.
globalStyle`
  :root {
    --font-sans: "Onest Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    --font-display: var(--font-sans);
    --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

    --weight-regular: 400;
    --weight-medium: 500;

    --color-bg: #ffffff;
    --color-surface: #f9f9f6;
    --color-surface-raised: #ffffff;
    --color-text: #1a1a18;
    --color-text-muted: rgb(26 26 24 / 0.62);
    --color-border: #e8e7e1;
    /* Darker than the reference's 12% borders so inputs meet WCAG 1.4.11 (3:1). */
    --color-border-strong: rgb(26 26 24 / 0.5);
    --color-primary: #262624;
    --color-primary-hover: rgb(38 38 36 / 0.9);
    --color-on-primary: #f9f9f6;
    --color-secondary: #efeee9;
    --color-secondary-hover: #e6e5df;
    --color-accent: #3b6fe0;
    --color-danger: #c8321f;
    --color-on-danger: #ffffff;
    --color-success: #1f7a4d;
    --color-focus: #262624;
    --color-overlay: rgb(26 26 24 / 0.4);

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --radius-full: 999px;

    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 24px;
    --space-6: 32px;
    --space-7: 48px;
    --space-8: 64px;

    --text-xs: 0.8125rem;
    --text-sm: 0.875rem;
    --text-md: 1rem;
    --text-lg: 1.1875rem;
    --text-xl: clamp(1.75rem, 3vw, 2.5rem);
    --text-display: clamp(2.75rem, 6vw, 4.5rem);
    --tracking-tight: -0.02em;

    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
    --shadow-md: 0 8px 24px rgb(26 26 24 / 0.08), 0 1px 2px rgb(0 0 0 / 0.05);
    --shadow-lg: 0 24px 56px rgb(26 26 24 / 0.16);

    --focus-ring: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-focus);
    --duration: 160ms;
    --ease: cubic-bezier(0.215, 0.61, 0.355, 1);
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
