# Table

A semantic data table for records with several columns: a muted `text-xs` header row, 1px hairline dividers between rows, and a `--color-bg-hover` row hover. Optionally makes the whole row open a detail view.

## Use when / Don't use when
- Records with several comparable fields (name, email, status, date) where people scan down a column.
- A list of similar records with one or two fields each and no real column alignment — use `List`/`ListRow` instead.
- A row with several independent interactive controls (its own buttons/checkbox) that shouldn't all trigger the same action — those go in a plain `<td>`, not on the row's `onRowClick`.

## API
```tsx
import { Table } from "@/components/ui/Table";
import type { TableColumn, TableSort } from "@/components/ui/Table";
```
- `columns`: `TableColumn<T>[]`. Each has `key`, `header`, `render(row)`, and optional `align` (`"left" | "right"`, default `"left"`), `sortKey` and `defaultSortDirection` (see Sorting).
- `rows`: `T[]`.
- `getRowId`: `(row: T) => string` — stable React key per row.
- `onRowClick?`: `(row: T) => void` — makes the whole row open a detail view; the row becomes keyboard-focusable and `Enter` activates it, same as a click. Omit it for a plain, non-interactive table.
- `sticky?`: keeps the header row visible while the body scrolls — wrap `Table` in a container with its own `max-height` and `overflow-y: auto`.
- `empty?`: rendered in place of the table when `rows` is empty (e.g. an `EmptyState`).
- `sort?`: `{ key, direction: "asc" | "desc" }`, the active sort. Controlled.
- `onSortChange?`: `(next: TableSort) => void`. Without it, every header renders as plain text, even with a `sortKey`.
- `busy?`: the next rows are loading. See Loading.
- `aria-label?`: accessible name for the table, when no visible heading already names it.

Paginate below the table with `Pagination`, outside `Table` itself.

## Example
```tsx
const columns: TableColumn<Member>[] = [
  { key: "name", header: "Name", render: (m) => m.name ?? "No name" },
  { key: "email", header: "Email", render: (m) => m.email },
  { key: "added", header: "Added", render: (m) => formatDate(m.addedAt) },
];

<Table
  columns={columns}
  rows={members}
  getRowId={(m) => m.id}
  onRowClick={(m) => openPanel(m.id)}
  empty={<EmptyState icon={UsersRound} title="No members yet" description="..." />}
/>
<Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} onPageChange={setPage} />
```

## Sorting
Sorting is controlled: `Table` shows the sort and reports selections, and the page sorts the rows, usually on the server so it sorts every page, not just the one on screen. On a list page, use `useListSort()` from `ListPage` (it keeps the sort in the `sort` and `dir` URL params and goes back to page 1).

- Give each column people would sort by a `sortKey` (the value the server sorts on). Leave it off columns whose order means nothing (badges, actions).
- `defaultSortDirection` is the direction on first select: `"asc"` (the default) for text, `"desc"` for dates and counts, where people want the newest or largest first.
- Selecting an inactive column sorts by its default direction; selecting the active column reverses it. `nextTableSort(current, column)` is the same rule if you need it elsewhere.
- The active column's label turns `--color-text` and shows `ArrowUp` (ascending) or `ArrowDown` (descending), so the state isn't carried by color. Other sortable headers show a muted `ChevronsUpDown` only on hover or focus, so the header row stays quiet but is still discoverable. The icon slot is always reserved: nothing shifts between states.
- Pass the page's default order as `sort` too, so its column shows as active before anyone selects a header.
- One sort at a time. No third "unsorted" state: selecting the active column only reverses it.

```tsx
const { sort, setSort } = useListSort({ key: "added", direction: "desc" });

const columns: TableColumn<Member>[] = [
  { key: "name", header: "Name", sortKey: "name", render: (m) => m.name ?? "No name" },
  { key: "email", header: "Email", sortKey: "email", render: (m) => m.email },
  { key: "added", header: "Added", sortKey: "added", defaultSortDirection: "desc", render: (m) => formatDate(m.addedAt) },
];

<Table columns={columns} rows={members} getRowId={(m) => m.id} sort={sort} onSortChange={setSort} />
```

## Loading
Pass `busy` while a sort, search, tab or page change is in flight (on a list page: the `pending` from `useListSort`, `useListSearch` and `useListParams`). The table:
- keeps the current rows in place at reduced opacity (a `--duration` fade, no layout shift), so people keep their place;
- turns the active column's arrow into a small spinner, so a sort shows where it's working;
- runs a thin indeterminate line along the bottom edge of the header row;
- sets `aria-busy` on the table.

Show the chosen sort at once (`useListSort` does this optimistically) so the spinner appears on the column that was selected. Don't replace the rows with a skeleton for a re-sort: the table is already on screen. For the first load, use the page's loading state instead.

## Content rules
Header labels are short nouns in sentence case ("Date added", not "DATE ADDED"). A cell with no value reads as muted placeholder text ("No name"), never a blank cell — a blank cell reads as missing data, not "not set".

## Accessibility
Renders a real `<table>`/`<thead>`/`<tbody>`, so column headers (`scope="col"`) are announced with each cell by screen readers. A clickable row is reachable and activatable by keyboard (`tabIndex`, `Enter`) with a visible focus ring; never nest another focusable control (a button, a link) inside a clickable row — a row can't contain a control that needs its own independent activation. Never convey status with a cell's color alone (pair it with a badge/label, as in the example's Status column).

A sortable header is a real `button` inside the `th`: reach it with Tab, sort with Enter or Space, with a visible focus ring and a hover fill. The `th` carries `aria-sort` (`ascending`, `descending`, or `none` on sortable columns that aren't active). The button's accessible name says what selecting does: "Name, sorted ascending. Select to sort descending", or "Name. Select to sort". The screen-reader text lives in `tableSortCopy` in `Table.tsx`.

A toolbar's search field above a `Table` is one documented exception to "every control has a visible label": a compact search box with an obvious icon and placeholder can use `aria-label` alone instead of a wrapping `Field` — see `SearchField.md`.

## Don't
1. Nesting a `Button` or link inside a clickable row (`onRowClick` set) — move it to a non-clickable table or stop the click from bubbling isn't a safe substitute; use `List`/`ListRow` or a plain table without `onRowClick` instead.
2. Using `Table` for one or two loosely related fields per record — that's `List`/`ListRow`.
3. Sorting only the rows on screen when the list is paginated. Sort on the server, then paginate.
4. Leaving off `getRowId` in favor of array index — breaks focus/selection identity when rows reorder or filter.
