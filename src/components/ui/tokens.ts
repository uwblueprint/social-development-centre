import { globalStyle } from "next-yak";

// Neutrals are Tailwind Taupe (converted from its OKLCH values). Accent is Tailwind Orange; statuses use the -700 step for 4.5:1 text on white.
globalStyle`
  :root {
    --font-sans: "Switzer", "Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
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
    /* Hairline borders for status badges on their -subtle fills (Tailwind -200 steps; info matched by hue). */
    --color-success-border: #a7f3d0;
    --color-warning-border: #fde68a;
    --color-danger-border: #fecaca;
    --color-info-border: #c9dbe5;

    /* Opportunity types need distinct, non-status colors. Hues avoid the status and accent hues
       (red, orange, amber, emerald, steel blue); each text color is 5.5:1 or more on its -subtle fill. */
    --color-category-1: #1d4ed8; /* blue */
    --color-category-1-subtle: #eff6ff;
    --color-category-1-border: #bfdbfe;
    --color-category-1-line: #3b82f6; /* the hover line: 200 lighter than the category colour (owner) */
    --color-category-2: #6d28d9; /* violet */
    --color-category-2-subtle: #f5f3ff;
    --color-category-2-border: #ddd6fe;
    --color-category-2-line: #8b5cf6;
    --color-category-3: #a21caf; /* fuchsia */
    --color-category-3-subtle: #fdf4ff;
    --color-category-3-border: #f5d0fe;
    --color-category-3-line: #d946ef;
    --color-category-4: #be185d; /* pink */
    --color-category-4-subtle: #fdf2f8;
    --color-category-4-border: #fbcfe8;
    --color-category-4-line: #ec4899;
    --color-category-5: #3f6212; /* lime */
    --color-category-5-subtle: #f7fee7;
    --color-category-5-border: #d9f99d;
    --color-category-5-line: #65a30d;

    /* Eventbrite's brand orange, only for recognizing an Eventbrite link (owner). Not for text: 3.3:1. */
    --color-eventbrite: #f05537;
    /* The Eventbrite scan line (owner): a brighter, sunnier orange than the brand mark; same in both modes. */
    --color-eventbrite-bright: #ff8a1f;
    --color-eventbrite-subtle: #fff4f1;
    --color-eventbrite-border: #fbcabd;

    /* Pages built around a brand illustration (the 404): the taupe-50 of the drawing's ground in light mode. */
    --illustration-page-bg: var(--taupe-50);
    /* The 404 drawing: taupe-600 lines on a taupe-50 ground; dark mode inverts it: taupe-500 lines (owner) on taupe-900. */
    --illustration-line: var(--taupe-600);
    --illustration-ground: var(--taupe-50);

    /* SDC brand green (sign-in and public pages, from the brand mark): headings 9.7:1 on white, and the
       tint behind brand icons. Not for portal UI, which stays taupe. */
    --color-brand-heading: #064d45;
    --color-brand-tint: #e3f1ee;

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
    /* Long-form reading (Documentation): slightly open tracking. */
    --tracking-prose: 0.01em;

    /* Body 1.5 (WCAG 1.4.12 baseline); small UI text 1.4; headings tighten as size grows. */
    --leading-none: 1;
    --leading-display: 1.05;
    --leading-heading: 1.2;
    --leading-ui: 1.4;
    --leading-body: 1.5;
    /* Long-form reading (Documentation): extra air for scanning long guides. */
    --leading-prose: 1.7;

    --shadow-sm: 0 1px 2px rgb(29 24 22 / 0.06);
    --shadow-md: 0 4px 16px rgb(29 24 22 / 0.08), 0 1px 2px rgb(29 24 22 / 0.06);
    --shadow-lg: 0 16px 40px rgb(29 24 22 / 0.14);
    /* A soft shadow cast to the right by frozen table columns while the table is scrolled sideways. */
    --shadow-edge: 6px 0 8px -6px rgb(29 24 22 / 0.16);

    /* Every table row is one height (cells are single-line), so lists scan evenly; fits a 32px button. */
    --row-height: 44px;
    /* List page search in the header row: wide enough for a name or email, narrow enough to leave room for actions. */
    --search-width: 280px;

    /*
     * Dashed borders (disabled controls, drop targets): drawn as 4px dashes with 4px gaps, because the
     * browser's own dashes at 1px are too short to read as dashed (owner). Use with a transparent border:
     * background-image / -size / -position / -repeat from these, and background-origin: border-box.
     */
    --dashed-border:
      linear-gradient(90deg, var(--color-border) 4px, transparent 4px),
      linear-gradient(90deg, var(--color-border) 4px, transparent 4px),
      linear-gradient(0deg, var(--color-border) 4px, transparent 4px),
      linear-gradient(0deg, var(--color-border) 4px, transparent 4px);
    --dashed-border-size: 8px 1px, 8px 1px, 1px 8px, 1px 8px;
    --dashed-border-position: 0 0, 0 100%, 0 0, 100% 0;
    --dashed-border-repeat: repeat-x, repeat-x, repeat-y, repeat-y;

    --focus-ring: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-focus);
    --duration: 160ms;
    --duration-slow: 240ms;
    /* First-load entrance for app shells: slow enough to feel calm, short enough not to block work. */
    --duration-enter: 480ms;
    --stagger: 40ms;
    /* The Eventbrite "filling in" scan (owner): a steady sweep down a long form. */
    --duration-scan: 3s;
    --enter-offset: 12px;
    --ease: cubic-bezier(0.215, 0.61, 0.355, 1);
    --ease-spring: cubic-bezier(0.34, 1.3, 0.64, 1);

    /* Stacking layers, lowest to highest. One scale so a toast always sits above a sheet or dialog
       (the owner copied from a sheet and never saw the toast). */
    --z-raised: 1; /* in-flow content lifted above its neighbors: frozen table columns, a focused row */
    --z-sticky: 2; /* sticky table headers, above frozen columns scrolling under them */
    --z-nav: 40; /* the mobile sidebar drawer and its scrim */
    --z-modal: 50; /* sheets, dialogs and alert dialogs, with their overlays */
    --z-popover: 60; /* popovers, menus, selects and date pickers; they open from inside modals */
    --z-tooltip: 70; /* tooltips and hover cards, above the control they describe */
    --z-toast: 80; /* toasts confirm actions taken anywhere, including inside a modal */

    /* Dialogs soften what's behind them so the decision in front reads first. Sheets don't blur:
       the list behind a sheet is context people keep reading. */
    --overlay-blur: 2px;
  }

  /*
   * Dark theme: the same tokens, re-pointed. It follows the device setting unless someone picks
   * Light or Dark in the sidebar (stored as data-theme on <html>; see src/lib/theme.ts). Text colors
   * keep 4.5:1 on --color-bg and on their -subtle fills; --color-border-strong keeps 3:1. Hairline
   * borders and secondary fills are lifted enough to read on raised surfaces (sheets, dialogs).
   * Hover and selected are translucent white, not a fixed shade: dark UIs show state by lightening
   * whatever surface is underneath (page, sheet, menu), so it reads the same everywhere.
   * The block is repeated because next-yak's globalStyle can't interpolate a shared string.
   */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --color-bg: #151211;
      --color-surface: var(--taupe-900);
      --color-surface-raised: #211c1a;
      --color-text: var(--taupe-100);
      --color-text-muted: var(--taupe-400);
      --color-text-subtle: #8e817c;
      --color-border: #473c39;
      --color-border-strong: var(--taupe-500);
      --color-primary: var(--taupe-100);
      --color-primary-hover: var(--taupe-300);
      --color-on-primary: var(--taupe-900);
      --color-secondary: #3a3230;
      --color-secondary-hover: #4a403d;
      --color-disabled-bg: #2b2422;
      --color-bg-hover: rgb(255 255 255 / 0.09);
      --color-bg-selected: rgb(255 255 255 / 0.14);

      --color-accent: #fb923c;
      --color-accent-hover: #fdba74;
      --color-on-accent: var(--taupe-900);
      --color-accent-subtle: #2c1a0e;
      --color-accent-border: #7c2d12;

      --color-danger: #f87171;
      --color-danger-subtle: #2a1414;
      --color-on-danger: var(--taupe-900);
      --color-success: #34d399;
      --color-success-subtle: #0f2a20;
      --color-warning: #fbbf24;
      --color-warning-subtle: #2a2210;
      --color-info: #7fb0cc;
      --color-info-subtle: #16232b;
      --color-success-border: #065f46;
      --color-warning-border: #78350f;
      --color-danger-border: #7f1d1d;
      --color-info-border: #2f4b5c;

      --color-category-1: #93c5fd;
      --color-category-1-subtle: #172033;
      --color-category-1-border: #1e3a8a;
      --color-category-1-line: #3b82f6; /* the hover line: 200 lighter than the category colour (owner) */
      --color-category-2: #c4b5fd;
      --color-category-2-subtle: #1f1a33;
      --color-category-2-border: #4c1d95;
      --color-category-2-line: #8b5cf6;
      --color-category-3: #f0abfc;
      --color-category-3-subtle: #2a1530;
      --color-category-3-border: #701a75;
      --color-category-3-line: #d946ef;
      --color-category-4: #f9a8d4;
      --color-category-4-subtle: #2d1422;
      --color-category-4-border: #831843;
      --color-category-4-line: #ec4899;
      --color-category-5: #bef264;
      --color-category-5-subtle: #1c2410;
      --color-category-5-border: #3f6212;
      --color-category-5-line: #84cc16;

      --color-focus: var(--taupe-100);
    --illustration-page-bg: var(--taupe-900);
    --illustration-line: var(--taupe-500);
    --illustration-ground: var(--taupe-900);
    --color-brand-heading: #5fbfae; /* 8.5:1 on --color-bg */
    --color-brand-tint: #12302b;
    --color-eventbrite-subtle: #2c1712;
    --color-eventbrite-border: #7a2b18;
      --color-overlay: rgb(0 0 0 / 0.6);
      --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
      --shadow-md: 0 4px 16px rgb(0 0 0 / 0.5), 0 1px 2px rgb(0 0 0 / 0.4);
      --shadow-lg: 0 16px 40px rgb(0 0 0 / 0.6);
      --shadow-edge: 6px 0 8px -6px rgb(0 0 0 / 0.6);
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --color-bg: #151211;
    --color-surface: var(--taupe-900);
    --color-surface-raised: #211c1a;
    --color-text: var(--taupe-100);
    --color-text-muted: var(--taupe-400);
    --color-text-subtle: #8e817c;
    --color-border: #473c39;
    --color-border-strong: var(--taupe-500);
    --color-primary: var(--taupe-100);
    --color-primary-hover: var(--taupe-300);
    --color-on-primary: var(--taupe-900);
    --color-secondary: #3a3230;
    --color-secondary-hover: #4a403d;
    --color-disabled-bg: #2b2422;
    --color-bg-hover: rgb(255 255 255 / 0.09);
    --color-bg-selected: rgb(255 255 255 / 0.14);

    --color-accent: #fb923c;
    --color-accent-hover: #fdba74;
    --color-on-accent: var(--taupe-900);
    --color-accent-subtle: #2c1a0e;
    --color-accent-border: #7c2d12;

    --color-danger: #f87171;
    --color-danger-subtle: #2a1414;
    --color-on-danger: var(--taupe-900);
    --color-success: #34d399;
    --color-success-subtle: #0f2a20;
    --color-warning: #fbbf24;
    --color-warning-subtle: #2a2210;
    --color-info: #7fb0cc;
    --color-info-subtle: #16232b;
    --color-success-border: #065f46;
    --color-warning-border: #78350f;
    --color-danger-border: #7f1d1d;
    --color-info-border: #2f4b5c;

    --color-category-1: #93c5fd;
    --color-category-1-subtle: #172033;
    --color-category-1-border: #1e3a8a;
    --color-category-1-line: #3b82f6; /* the hover line: 200 lighter than the category colour (owner) */
    --color-category-2: #c4b5fd;
    --color-category-2-subtle: #1f1a33;
    --color-category-2-border: #4c1d95;
    --color-category-2-line: #8b5cf6;
    --color-category-3: #f0abfc;
    --color-category-3-subtle: #2a1530;
    --color-category-3-border: #701a75;
    --color-category-3-line: #d946ef;
    --color-category-4: #f9a8d4;
    --color-category-4-subtle: #2d1422;
    --color-category-4-border: #831843;
    --color-category-4-line: #ec4899;
    --color-category-5: #bef264;
    --color-category-5-subtle: #1c2410;
    --color-category-5-border: #3f6212;
    --color-category-5-line: #84cc16;

    --color-focus: var(--taupe-100);
    --illustration-page-bg: var(--taupe-900);
    --illustration-line: var(--taupe-500);
    --illustration-ground: var(--taupe-900);
    --color-brand-heading: #5fbfae; /* 8.5:1 on --color-bg */
    --color-brand-tint: #12302b;
    --color-eventbrite-subtle: #2c1712;
    --color-eventbrite-border: #7a2b18;
    --color-overlay: rgb(0 0 0 / 0.6);
    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
    --shadow-md: 0 4px 16px rgb(0 0 0 / 0.5), 0 1px 2px rgb(0 0 0 / 0.4);
    --shadow-lg: 0 16px 40px rgb(0 0 0 / 0.6);
    --shadow-edge: 6px 0 8px -6px rgb(0 0 0 / 0.6);
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
