import { globalStyle } from "next-yak";

// Neutrals are Tailwind Stone hex values. Accent is Tailwind Orange; statuses use the -700 step for 4.5:1 text on white.
globalStyle`
  :root {
    --font-sans: "Onest Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    --font-display: var(--font-sans);
    --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;

    --weight-regular: 400;
    --weight-medium: 500;

    --stone-50: #fafaf9;
    --stone-100: #f5f5f4;
    --stone-200: #e7e5e4;
    --stone-300: #d6d3d1;
    --stone-400: #a8a29e;
    --stone-500: #78716c;
    --stone-600: #57534e;
    --stone-700: #44403c;
    --stone-800: #292524;
    --stone-900: #1c1917;

    --color-bg: #ffffff;
    --color-surface: var(--stone-50);
    --color-surface-raised: #ffffff;
    --color-text: var(--stone-900);
    --color-text-muted: var(--stone-600);
    --color-text-subtle: var(--stone-500);
    --color-border: var(--stone-200);
    /* Form control boundaries need 3:1 against white (WCAG 1.4.11); stone-500 is 4.8:1. */
    --color-border-strong: var(--stone-500);
    --color-primary: var(--stone-900);
    --color-primary-hover: var(--stone-800);
    --color-on-primary: var(--stone-50);
    --color-secondary: var(--stone-100);
    --color-secondary-hover: var(--stone-200);
    --color-disabled-bg: var(--stone-100);

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
    --color-info: #0369a1;
    --color-info-subtle: #f0f9ff;

    --color-focus: var(--stone-900);
    --color-overlay: rgb(28 25 23 / 0.4);

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

    --shadow-sm: 0 1px 2px rgb(28 25 23 / 0.06);
    --shadow-md: 0 4px 16px rgb(28 25 23 / 0.08), 0 1px 2px rgb(28 25 23 / 0.06);
    --shadow-lg: 0 16px 40px rgb(28 25 23 / 0.14);

    --focus-ring: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-focus);
    --duration: 160ms;
    --duration-slow: 240ms;
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
      transition-duration: 0.01ms !important;
    }
  }
`;
