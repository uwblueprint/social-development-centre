import { globalStyle } from "next-yak";

// Neutrals are Tailwind Taupe (converted from its OKLCH values). Accent is Tailwind Orange; statuses use the -700 step for 4.5:1 text on white.
globalStyle`
  :root {
    --font-sans: "Onest Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    --font-display: var(--font-sans);
    --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;

    --weight-regular: 400;
    --weight-medium: 500;

    --taupe-50: #fbfaf9;
    --taupe-100: #f3f1f1;
    --taupe-200: #e8e4e3;
    --taupe-300: #d8d2d0;
    --taupe-400: #aba09c;
    --taupe-500: #7c6d67;
    --taupe-600: #5b4f4b;
    --taupe-700: #473c39;
    --taupe-800: #2b2422;
    --taupe-900: #1d1816;

    --color-bg: #ffffff;
    --color-surface: var(--taupe-50);
    --color-surface-raised: #ffffff;
    --color-text: var(--taupe-900);
    --color-text-muted: var(--taupe-600);
    --color-text-subtle: var(--taupe-500);
    --color-border: var(--taupe-200);
    /* Form control boundaries need 3:1 against white (WCAG 1.4.11); taupe-500 is 4.95:1. */
    --color-border-strong: var(--taupe-500);
    --color-primary: var(--taupe-900);
    --color-primary-hover: var(--taupe-800);
    --color-on-primary: var(--taupe-50);
    --color-secondary: var(--taupe-100);
    --color-secondary-hover: var(--taupe-200);
    --color-disabled-bg: var(--taupe-100);
    /* One hover and one selected fill for every list row, menu item, nav link and ghost control. */
    --color-bg-hover: var(--taupe-100);
    --color-bg-selected: var(--taupe-200);

    --color-accent: #c2410c;
    --color-accent-hover: #9a3412;
    --color-on-accent: #ffffff;
    --color-accent-subtle: #fff7ed;
    --color-accent-border: #fed7aa;

    --color-danger: #b91c1c;
    --color-danger-subtle: #fef2f2;
    --color-on-danger: #ffffff;
    --color-success: #047857;
    --color-success-subtle: #ecfdf5;
    --color-warning: #b45309;
    --color-warning-subtle: #fffbeb;
    --color-info: #3a6c88;
    --color-info-subtle: #eef4f7;

    --color-focus: var(--taupe-900);
    --color-overlay: rgb(29 24 22 / 0.4);

    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
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

    /* Body 1.5 (WCAG 1.4.12 baseline); small UI text 1.4; headings tighten as size grows. */
    --leading-none: 1;
    --leading-display: 1.05;
    --leading-heading: 1.2;
    --leading-ui: 1.4;
    --leading-body: 1.5;

    --shadow-sm: 0 1px 2px rgb(29 24 22 / 0.06);
    --shadow-md: 0 4px 16px rgb(29 24 22 / 0.08), 0 1px 2px rgb(29 24 22 / 0.06);
    --shadow-lg: 0 16px 40px rgb(29 24 22 / 0.14);

    --focus-ring: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-focus);
    --duration: 160ms;
    --duration-slow: 240ms;
    /* First-load entrance for app shells: slow enough to feel calm, short enough not to block work. */
    --duration-enter: 480ms;
    --stagger: 40ms;
    --enter-offset: 12px;
    --ease: cubic-bezier(0.215, 0.61, 0.355, 1);
    --ease-spring: cubic-bezier(0.34, 1.3, 0.64, 1);
  }

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: var(--font-sans);
    font-size: var(--text-md);
    line-height: var(--leading-body);
    color: var(--color-text);
    background: var(--color-bg);
    -webkit-font-smoothing: antialiased;
  }

  kbd {
    font-family: var(--font-mono);
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-delay: 0ms !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
    }
  }
`;
