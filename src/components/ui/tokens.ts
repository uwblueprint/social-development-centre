import { globalStyle } from "next-yak";

// Neutrals are Tailwind Taupe (converted from its OKLCH values). Accent is Tailwind Orange; statuses use the -700 step for 4.5:1 text on white.
globalStyle`
  :root {
    --font-sans: "Switzer", "Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    --font-display: var(--font-sans);
    --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;

    --weight-regular: 400;
    --weight-medium: 500;
    /* The intake letter's greeting and "5 quick questions" (letter prototype): the only bold text in the app so far. */
    --weight-bold: 700;

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
    /* A shade lighter than taupe-500 (owner); still 4.7:1 on white and 4.5:1 on --color-surface. */
    --color-text-subtle: #7f706a;
    /* One shade lighter than subtle, for sample values in menus (owner). Below 4.5:1: decorative hints only. */
    --color-text-placeholder: var(--taupe-400);
    --color-border: var(--taupe-200);
    /* Form control boundaries need 3:1 against white (WCAG 1.4.11); taupe-500 is 4.95:1. */
    --color-border-strong: var(--taupe-500);
    /* SDC green as the primary colour (owner). To revert: --taupe-900 / --taupe-800 / --taupe-50. */
    --color-primary: var(--color-brand-heading);
    --color-primary-hover: #043a34;
    --color-on-primary: #ffffff;
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
    --color-highlight: #fef08a; /* text highlight in the email editor and emails: Tailwind yellow-200, 4.5:1+ with --color-text */
    --color-highlight-selected: #facc15; /* selected highlighted text: Tailwind yellow-400, still reads as highlight, 4.5:1+ with --color-text */
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
    /* Member tag colours: five calm Tailwind hues. bg = 50, bg-strong = 100 (selected), text = 800 (4.5:1 or better on both). */
    --tag-stone-bg: #fafaf9;
    --tag-stone-bg-strong: #f5f5f4;
    --tag-stone-text: #292524;
    --tag-sky-bg: #f0f9ff;
    --tag-sky-bg-strong: #e0f2fe;
    --tag-sky-text: #075985;
    --tag-emerald-bg: #ecfdf5;
    --tag-emerald-bg-strong: #d1fae5;
    --tag-emerald-text: #065f46;
    --tag-amber-bg: #fffbeb;
    --tag-amber-bg-strong: #fef3c7;
    --tag-amber-text: #92400e;
    --tag-rose-bg: #fff1f2;
    --tag-rose-bg-strong: #ffe4e6;
    --tag-rose-text: #9f1239;

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

    /* The intake form's "letter" (/intake-form only, design-system owner approval pending): a doodled
       invitation on paper. Ink lines on cream paper over a dotted desk; Coming Soon for headings,
       Nunito for everything else. */
    --font-intake-display: "Coming Soon", "Comic Sans MS", "Chalkboard SE", cursive;
    --font-intake-body: "Nunito Variable", "Nunito", var(--font-sans);
    --intake-desk: #fbf1d9;
    --intake-desk-dot: rgb(140 110 50 / 0.28);
    --intake-paper: #fffef8;
    --intake-paper-tint: #fbf5e4;
    /* Ink is taupe-900 so drawn lines match body text (16.9:1 on the paper). */
    --intake-ink: var(--taupe-900);
    --intake-envelope-inside: #f4e7c6;
    /* A hand-drawn sheet: uneven corners and an offset ink shadow instead of a soft one. */
    --radius-intake-sheet: 22px 8px 26px 10px / 10px 24px 8px 26px;
    --shadow-intake-sheet: 5px 6px 0 var(--intake-ink);
    --shadow-intake-small: 3px 3px 0 var(--intake-ink);
    /* Doodle colours from the two partner logos (SDC green and orange, Ride for Refuge yellow, blue, red).
       Decoration only: never text, never the only sign of state. */
    --intake-doodle-green: #0b7a52;
    --intake-doodle-orange: #f07b2a;
    --intake-doodle-yellow: #f6b81a;
    --intake-doodle-blue: #1f5fa8;
    --intake-doodle-red: #d9412f;
    /* The Canada goose on the confirmation screen. */
    --intake-goose-body: #b39a7c;
    --intake-goose-wing: #8f7560;
    --intake-goose-wing-back: #7d6450;
    --intake-goose-breast: #f1e8d8;
    --intake-goose-head: var(--taupe-900);
    --intake-goose-cheek: #fffef8;
    /* SDC brand green (sign-in and public pages, from the brand mark): headings 9.7:1 on white, and the
       tint behind brand icons. Not for portal UI, which stays taupe. */
    --color-brand-heading: #064d45;
    /* SDC green as a Tailwind-style scale (owner): the brand green sits at 900; the other steps follow Tailwind's teal lightness curve. */
    --sdc-50: #effcf9;
    --sdc-100: #c9f7ec;
    --sdc-200: #95eedb;
    --sdc-300: #5adcc4;
    --sdc-400: #2bc0a8;
    --sdc-500: #12a48e;
    --sdc-600: #0b8474;
    --sdc-700: #0d695e;
    --sdc-800: #0d554d;
    --sdc-900: #064d45;
    --sdc-950: #032e29;
    /* A softened sdc-100: same hue, less saturation, so selection is fresh but not neon. */
    --color-selection: color-mix(in oklch, var(--sdc-100) 55%, var(--taupe-100));
    --color-brand-tint: #e3f1ee;

    /* Personalized-detail tags and email-body links now use the SDC green scale: sdc-800 text on sdc-50 is 8.6:1. */
    --color-mention: var(--sdc-800);
    --color-mention-subtle: var(--sdc-50);
    --color-mention-hover: var(--sdc-100);
    /* The range band in the date calendar: a light green so the span reads as part of the brand, calm behind day numbers. */
    --color-range-band: var(--sdc-50);
    /* Outline buttons hover to a light green fill instead of grey. */
    --color-outline-hover: var(--sdc-50);

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
    /* The email footer (sender, unsubscribe, address): airy small print, set by Gaurav. */
    --leading-footer: 1.8;

    --shadow-sm: 0 1px 2px rgb(29 24 22 / 0.06);
    --shadow-md: 0 4px 16px rgb(29 24 22 / 0.08), 0 1px 2px rgb(29 24 22 / 0.06);
    --shadow-lg: 0 16px 40px rgb(29 24 22 / 0.14);
    /* A soft shadow cast to the right by frozen table columns while the table is scrolled sideways. */
    --shadow-edge: 6px 0 8px -6px rgb(29 24 22 / 0.16);

    /* Height of a one-line form control (Input, Select, tag boxes) and of controls that sit beside them. */
    --control-height: 40px;
    /* One row of tag pills (and the inline controls that sit beside them), so labels and dividers line up with pills. */
    --pill-height: 28px;
    /* Every table row is one height (cells are single-line), so lists scan evenly; fits a 32px button. */
    --row-height: 44px;
    /* Height of one row in Select, TagCombobox and CreatableCombobox lists; scrolling lists cap at a whole number of rows plus half, so the last visible row is cut off and signals more below (PM). */
    --menu-row-height: 34px;
    /* List page search in the header row: wide enough for a name or email, narrow enough to leave room for actions. */
    --search-width: 280px;
    /* The desktop sidebar's width; the design zone's nav placeholder uses it too, so swapping in the real sidebar doesn't shift screens. */
    --sidebar-width: 264px;
    /* Full-page flows (an email, a form): one readable column, matching the People page (owner). */
    --flow-width: 720px;

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
    /* Motion is calm and rare. See docs/design/motion.md. Nothing overshoots, springs or slides a pill. */
    --duration-fast: 100ms; /* colour fades on hover, press and state change (borders, fills, text) */
    /* Motion is calm and rare. See docs/design/motion.md. Nothing overshoots, springs or slides a pill. */
    --duration-fast: 100ms; /* colour fades on hover, press and state change (borders, fills, text) */
    --duration: 160ms; /* overlays in (menu, select, popover, tooltip, dialog), switch thumb, toast */
    --duration-slow: 240ms; /* things with real distance: sheet slide, accordion and collapsible height */
    --ease-out: cubic-bezier(0, 0, 0.2, 1); /* decelerate: anything entering or changing state */
    --ease-in: cubic-bezier(0.4, 0, 1, 1); /* accelerate: anything leaving; pair with --duration-fast */
    --ease: var(--ease-out); /* alias for --ease-out, kept so older code still resolves */
    --ease-spring: var(--ease-out); /* retired: nothing springs. Alias for --ease-out so old code can't bounce */
    /* First-load entrance for brand and intake screens (not kit components): slow enough to feel calm. */
    --duration-enter: 480ms;
    --stagger: 40ms; /* intake and brand screens only */
    /* The Eventbrite "filling in" scan (owner): a steady sweep down a long form. */
    --duration-scan: 3s;
    --enter-offset: 12px;

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
  /* Text selection everywhere: a light tint of the primary colour (owner), not the browser's blue; text keeps its colour. */
  ::selection {
    background-color: var(--color-selection);
    color: inherit;
  }

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
      /* SDC green, lifted for dark backgrounds. To revert: --taupe-100 / --taupe-300 / --taupe-900. */
      --color-primary: #8fd3c4;
      --color-selection: var(--sdc-800);
      --color-primary-hover: #b5e3d8;
      --color-on-primary: #052e29;
      --color-secondary: #3a3230;
      --color-secondary-hover: #4a403d;
      --color-disabled-bg: #2b2422;
      --color-bg-hover: rgb(255 255 255 / 0.09);
      --color-bg-selected: rgb(255 255 255 / 0.14);
      --color-mention: var(--sdc-200);
      --color-mention-subtle: color-mix(in oklch, var(--sdc-900) 55%, var(--color-bg));
      --color-mention-hover: var(--sdc-800);
      --color-range-band: color-mix(in oklch, var(--sdc-900) 60%, var(--color-bg));
      --color-outline-hover: color-mix(in oklch, var(--sdc-900) 60%, var(--color-bg));

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
      --color-highlight: #713f12; /* yellow-900: dark-mode highlight, keeps light text readable */
      --color-highlight-selected: #a16207; /* yellow-700: selected highlight in dark mode */
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
      /* Dark tag colours: the 900 mixed into the page background; text = 200 (4.5:1 or better on both fills). */
      --tag-stone-bg: color-mix(in srgb, #1c1917 50%, var(--color-bg));
      --tag-stone-bg-strong: color-mix(in srgb, #1c1917 75%, var(--color-bg));
      --tag-stone-text: #e7e5e4;
      --tag-sky-bg: color-mix(in srgb, #0c4a6e 50%, var(--color-bg));
      --tag-sky-bg-strong: color-mix(in srgb, #0c4a6e 75%, var(--color-bg));
      --tag-sky-text: #bae6fd;
      --tag-emerald-bg: color-mix(in srgb, #064e3b 50%, var(--color-bg));
      --tag-emerald-bg-strong: color-mix(in srgb, #064e3b 75%, var(--color-bg));
      --tag-emerald-text: #a7f3d0;
      --tag-amber-bg: color-mix(in srgb, #78350f 50%, var(--color-bg));
      --tag-amber-bg-strong: color-mix(in srgb, #78350f 75%, var(--color-bg));
      --tag-amber-text: #fde68a;
      --tag-rose-bg: color-mix(in srgb, #881337 50%, var(--color-bg));
      --tag-rose-bg-strong: color-mix(in srgb, #881337 75%, var(--color-bg));
      --tag-rose-text: #fecdd3;

      --color-focus: var(--taupe-100);
    --illustration-page-bg: var(--taupe-900);
    --illustration-line: var(--taupe-500);
    --illustration-ground: var(--taupe-900);
    /* The intake letter in the dark: the same paper and ink, inverted. */
    --intake-desk: #1b1714;
    --intake-desk-dot: rgb(255 240 210 / 0.1);
    --intake-paper: #231e1b;
    --intake-paper-tint: #2e2724;
    --intake-ink: var(--taupe-100);
    --intake-envelope-inside: #3a312a;
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
    /* SDC green, lifted for dark backgrounds. To revert: --taupe-100 / --taupe-300 / --taupe-900. */
    --color-primary: #8fd3c4;
    --color-selection: var(--sdc-800);
    --color-primary-hover: #b5e3d8;
    --color-on-primary: #052e29;
    --color-secondary: #3a3230;
    --color-secondary-hover: #4a403d;
    --color-disabled-bg: #2b2422;
    --color-bg-hover: rgb(255 255 255 / 0.09);
    --color-bg-selected: rgb(255 255 255 / 0.14);
    --color-mention: var(--sdc-200);
    --color-mention-subtle: color-mix(in oklch, var(--sdc-900) 55%, var(--color-bg));
    --color-mention-hover: var(--sdc-800);
    --color-range-band: color-mix(in oklch, var(--sdc-900) 60%, var(--color-bg));
    --color-outline-hover: color-mix(in oklch, var(--sdc-900) 60%, var(--color-bg));

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
    --color-highlight: #713f12; /* yellow-900: dark-mode highlight, keeps light text readable */
    --color-highlight-selected: #a16207; /* yellow-700: selected highlight in dark mode */
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
    /* Dark tag colours: the 900 mixed into the page background; text = 200 (4.5:1 or better on both fills). */
    --tag-stone-bg: color-mix(in srgb, #1c1917 50%, var(--color-bg));
    --tag-stone-bg-strong: color-mix(in srgb, #1c1917 75%, var(--color-bg));
    --tag-stone-text: #e7e5e4;
    --tag-sky-bg: color-mix(in srgb, #0c4a6e 50%, var(--color-bg));
    --tag-sky-bg-strong: color-mix(in srgb, #0c4a6e 75%, var(--color-bg));
    --tag-sky-text: #bae6fd;
    --tag-emerald-bg: color-mix(in srgb, #064e3b 50%, var(--color-bg));
    --tag-emerald-bg-strong: color-mix(in srgb, #064e3b 75%, var(--color-bg));
    --tag-emerald-text: #a7f3d0;
    --tag-amber-bg: color-mix(in srgb, #78350f 50%, var(--color-bg));
    --tag-amber-bg-strong: color-mix(in srgb, #78350f 75%, var(--color-bg));
    --tag-amber-text: #fde68a;
    --tag-rose-bg: color-mix(in srgb, #881337 50%, var(--color-bg));
    --tag-rose-bg-strong: color-mix(in srgb, #881337 75%, var(--color-bg));
    --tag-rose-text: #fecdd3;

    --color-focus: var(--taupe-100);
    --illustration-page-bg: var(--taupe-900);
    --illustration-line: var(--taupe-500);
    --illustration-ground: var(--taupe-900);
    /* The intake letter in the dark: the same paper and ink, inverted. */
    --intake-desk: #1b1714;
    --intake-desk-dot: rgb(255 240 210 / 0.1);
    --intake-paper: #231e1b;
    --intake-paper-tint: #2e2724;
    --intake-ink: var(--taupe-100);
    --intake-envelope-inside: #3a312a;
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
