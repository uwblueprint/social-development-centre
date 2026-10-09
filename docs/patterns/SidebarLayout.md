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
- `config.footerItems` (optional): links shown in the footer after the theme item, right above **Sign out**, e.g. the partner portal's **Organization**. Highlighted like a section when you're on it.
- `config.docsHref`, `config.onSignOut`: the footer holds **Documentation** (a link to the portal's `/documentation` page, rendered from `docs/user-guide/`) and a red **Sign out** button. `onSignOut` should pass the first name to `signOut()` so the sign-in page can say goodbye.

Config must be built in a client component (icons are components and can't cross from server to client). See `src/app/admin/_components/AdminShell.tsx`.

## Behavior
- Desktop: always expanded (no collapse), so labels stay visible.
- Below 768px: the sidebar becomes a modal drawer (`role="dialog"`, named by the product name) opened from the top bar's menu button ("Open menu", with `aria-expanded` and `aria-controls`). It dims the page behind it, which is inert while it's open.
  - Focus moves to the close button on open, and Tab and Shift+Tab stay inside the drawer.
  - The X button ("Close menu"), tapping the dimmed page or Escape closes it without navigating and returns focus to the menu button.
  - Choosing a section (or a recent item) closes it, navigates and moves focus to the destination's `h1`. `ListPageHeader` renders its h1 with `tabIndex={-1}` for this; any other page's h1 is made focusable when focus lands.
  - Widening the viewport to 768px or more closes it and shows the desktop sidebar.
- Page entrance: `children` sit in a wrapper keyed by section (`/admin/community`), so moving between sections replays a short fade-and-rise; in-section changes (tabs, query params) don't. Off for reduced motion.
- Footer: **Documentation** (link), then the theme item (`ThemeSwitcher`: "Dark mode" while the app is light, "Light mode" while dark; follows the device until someone picks, then saves to localStorage via `src/lib/theme.ts`), then **Sign out** (button, `--color-danger` text, `--color-danger-subtle` hover). Sign out happens right away, with no confirmation, and lands on `/login?signedOut=1&name={first name}`, which shows "You're signed out. See you soon, {name}." above the form.

- First load: the sidebar settles in, nav items slide and fade in on a stagger, then the page content fades in (`--duration-enter`, `--stagger`, `--enter-offset`). Plays once per visit, not on every navigation, and not at all with reduced motion.

## Accessibility
- Nav is a labelled `<nav>` landmark; the current page uses `aria-current="page"`.
- The drawer is hidden from assistive tech and the tab order when closed.

## Don't
- Don't add more than 8 top-level items; group related work under one item with in-page tabs.
- Don't show counts that are just totals; counts mean "needs attention".

## Navigation feedback (owner, 28 Sep 2026)
- The chosen item is highlighted the moment it's clicked, before the page arrives; the highlight follows the URL again once it changes. Opening in a new tab (Ctrl/Cmd/Shift-click) doesn't move it.
- Each route has a `loading.tsx` ([PageLoading](./PageLoading.md)), so the page area switches to a loading state at once.
