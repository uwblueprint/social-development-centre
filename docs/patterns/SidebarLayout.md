# SidebarLayout

App shell with a left sidebar: product mark, primary navigation, optional "recent" list, and a profile menu at the bottom. Used by the admin portal; reuse it for the partner portal and internal tools.

## Use when / Don't use when
- Use for any signed-in product area with 3–8 top-level sections.
- Don't nest a second sidebar inside a page; use Tabs for sub-sections within a page (e.g. Opportunities → Fields, Tags, Publishing rules).
- Don't put personal settings or team access in the main nav. There is no My account (owner decision, 28 Sep 2026); team access gets its own section when it exists.

## API
```tsx
import { SidebarLayout, type SidebarConfig } from "@/components/patterns/Sidebar";
```
- `config.product`: `{ name, initials }` shown top-left.
- `config.navLabel`: accessible name of the nav landmark ("Admin navigation", "Partner navigation").
- `config.items`: `{ href, label, icon, description?, count?, countLabel? }[]`. `description` is one sentence on what the section is for (it replaces the page description). It shows as a `Tooltip` to the right after ~600ms of hover or keyboard focus, and is never pinned by a click. Active state comes from the URL (`aria-current="page"`). `count` shows an accent badge beside the label; use it only for things that need attention, with a defined meaning. A `count` requires `countLabel`, which says what it counts including the number ("3 awaiting review"): the link is announced as "Partners, 3 awaiting review" and the bare number is hidden from screen readers. Use the same wording on the section's page. No section uses a count yet (owner decision 10).
- `config.recent?`: `{ label, items: { href, icon, title, context? }[] }`.
- `config.footerItems` (optional): links at the top of the footer, right above **Documentation**, e.g. the admin portal's **Admins** and **Settings**. Highlighted like a section when you're on it.
- `config.docsHref`, `config.onSignOut`: the footer holds **Documentation** (a link to the portal's `/documentation` page, rendered from `docs/user-guide/`) and a red **Sign out** button. `onSignOut` should pass the first name to `signOut()` so the sign-in page can say goodbye.

Config must be built in a client component (icons are components and can't cross from server to client). See `src/app/admin/_components/AdminShell.tsx`, which takes its sections from `adminNav.ts`.

## Behavior
- 1200px and up: always expanded (no collapse), so labels stay visible.
- Below 768px: the sidebar becomes a modal drawer (`role="dialog"`, named by the product name) opened from the top bar's menu button ("Open menu", with `aria-expanded` and `aria-controls`). It dims the page behind it, which is inert while it's open.
  - Focus moves to the close button on open, and Tab and Shift+Tab stay inside the drawer.
  - The X button ("Close menu"), tapping the dimmed page or Escape closes it without navigating and returns focus to the menu button.
  - Choosing a section (or a recent item) closes it, navigates and moves focus to the destination's `h1`. `ListPageHeader` renders its h1 with `tabIndex={-1}` for this; any other page's h1 is made focusable when focus lands.
  - Widening the viewport to 768px or more closes it and shows the desktop sidebar.
- 768px to 1199px: a small "Collapse sidebar" button sits at the top right of the sidebar. Collapsed, the page takes the full width and an "Open sidebar" button sits beside the page title (`ListPageHeader` places it; other pages get it in a row above their content). The choice is kept per browser (`src/lib/sidebar.ts`, applied before first paint).
  - Hover the open button: just the sidebar's edge slides out from the left, a hint that clicking opens it. No blur. It goes back the moment the pointer leaves the button. It can't be used while it's only a hint.
  - Click (or Enter/Space) the open button: the whole sidebar slides in over the page, below the title row, inset from the bottom when the window is tall enough, with the page blurred behind it. It stays open wherever the pointer goes, like a dialog: focus moves into it and the page is inert. Clicking the button again, clicking anywhere else, Escape or choosing a page closes it. A click outside only closes the sidebar; it doesn't also press what's underneath.
  - In the overlay, the top-right button becomes "Keep sidebar open", which docks it again.
  - 1200px and up: always docked, whatever was chosen.
- Page change: no entrance animation. `children` sit in a wrapper keyed by section so state resets when you move between sections.
- Footer: **Admins** and **Settings** (`footerItems`), **Documentation** (link), then **Sign out** (button, `--color-danger` text, `--color-danger-subtle` hover). The theme is not in the sidebar: it is a setting on the Settings page (`ThemeChoice` in `src/components/patterns/ThemeSwitcher.tsx`). Sign out happens right away, with no confirmation, and lands on `/login?signedOut=1&name={first name}`, which shows "You're signed out. See you soon, {name}." above the form.

- Motion: none on load. On mobile the drawer slides in from the left edge (`--duration-slow`, `--ease-out`); see `docs/design/motion.md`.

## Accessibility
- Nav is a labelled `<nav>` landmark; the current page uses `aria-current="page"`.
- The drawer is hidden from assistive tech and the tab order when closed.

## Don't
- Don't add more than 8 top-level items; group related work under one item with in-page tabs.
- Don't show counts that are just totals; counts mean "needs attention".

## Navigation feedback (owner, 28 Sep 2026)
- The chosen item is highlighted the moment it's clicked, before the page arrives; the highlight follows the URL again once it changes. Opening in a new tab (Ctrl/Cmd/Shift-click) doesn't move it.
- Each route has a `loading.tsx` ([PageLoading](./PageLoading.md)), so the page area switches to a loading state at once.
