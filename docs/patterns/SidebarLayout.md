# SidebarLayout

App shell with a left sidebar: product mark, primary navigation, optional "recent" list, and a profile menu at the bottom. Used by the admin portal; reuse it for the partner portal and internal tools.

## Use when / Don't use when
- Use for any signed-in product area with 3–8 top-level sections.
- Don't nest a second sidebar inside a page; use Tabs for sub-sections within a page (e.g. Opportunities → Fields, Tags, Publishing rules).
- Don't put personal settings or team access in the main nav; personal settings live under the profile menu ("My account"), team access gets its own section when it exists.

## API
```tsx
import { SidebarLayout, type SidebarConfig } from "@/components/patterns/Sidebar";
```
- `config.product`: `{ name, initials }` shown top-left.
- `config.navLabel`: accessible name of the nav landmark ("Admin").
- `config.items`: `{ href, label, icon, count? }[]`. Active state comes from the URL (`aria-current="page"`). `count` shows an accent badge; use it only for things that need attention.
- `config.recent?`: `{ label, items: { href, icon, title, context? }[] }`.
- `config.user`, `config.accountHref`, `config.onSignOut`: the profile menu holds only "My account" and "Sign out".

Config must be built in a client component (icons are components and can't cross from server to client). See `src/app/admin/_components/AdminShell.tsx`.

## Behavior
- Desktop: always expanded (no collapse), so labels stay visible.
- Below 768px: the sidebar becomes a drawer opened from a top bar; Escape, the backdrop or navigating closes it.

## Accessibility
- Nav is a labelled `<nav>` landmark; the current page uses `aria-current="page"`.
- The drawer is hidden from assistive tech and the tab order when closed.

## Don't
- Don't add more than 8 top-level items; group related work under one item with in-page tabs.
- Don't show counts that are just totals; counts mean "needs attention".
