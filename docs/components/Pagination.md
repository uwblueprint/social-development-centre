# Pagination

A page summary ("Showing 51–100 of 962") plus Previous/Next and numbered page controls, for a list too long to show at once.

## Use when / Don't use when
- A list or table paged server-side (dozens to thousands of rows) where the caller already tracks the current page in the URL or in state.
- A short list that always fits on one page — the component renders nothing when `pageCount` is 1, so it's safe to always mount, but don't add it if a list can never grow past a page.
- Infinite scroll or a "Load more" button — those don't need page numbers; use a plain `Button` instead.

## API
```tsx
import { Pagination } from "@/components/ui/Pagination";
```
- `page: number` — current 1-based page.
- `pageCount: number` — total pages.
- `pageSize: number` — rows per page, used only for the summary text.
- `total: number` — total row count across all pages.
- `onPageChange: (page: number) => void` — called with the next page number (Previous, Next, or a page number).

Presentational only: it doesn't read or write the URL itself. The caller decides what changing the page means (e.g. `router.replace` with an updated `page` search param) and passes the resulting `page` back down.

## Example
```tsx
function handlePageChange(page: number) {
  const params = new URLSearchParams(searchParams);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  router.replace(`${pathname}?${params}`, { scroll: false });
}

<Pagination page={page} pageCount={pageCount} pageSize={50} total={total} onPageChange={handlePageChange} />
```

## Content rules
The summary always reads "Showing X–Y of Z"; don't reword it. Button labels are "Previous"/"Next", not "Prev"/"«".

## Accessibility
Previous/Next are real, individually disabled `Button`s at the ends of the range. Page numbers are buttons in a `role="navigation"` region labeled "Pagination"; the current page carries `aria-current="page"` in addition to its filled background, so it isn't conveyed by color alone.

## Don't
1. Passing a `page` outside `1..pageCount` — clamp it (as the backend query already does) before rendering.
2. Reimplementing "Showing X–Y of Z" by hand elsewhere — always go through this component so the wording and math stay consistent.
3. Using this for a list that can never exceed one page.
