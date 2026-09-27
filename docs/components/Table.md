# Table

A semantic data table for records with several columns: a muted `text-xs` header row, 1px hairline dividers between rows, and a `--color-bg-hover` row hover. Every cell is one line, so every row is exactly `--row-height` (44px). Optionally makes the whole row open a detail view.

## Use when / Don't use when
- Records with several comparable fields (name, email, status, date) where people scan down a column.
- A list of similar records with one or two fields each and no real column alignment — use `List`/`ListRow` instead.
- A row with several independent interactive controls (its own buttons/checkbox) that shouldn't all trigger the same action — those go in a plain `<td>`, not on the row's `onRowClick`.

## API
```tsx
import { Table } from "@/components/ui/Table";
import type { TableColumn, TableSort } from "@/components/ui/Table";
```
- `columns`: `TableColumn<T>[]`. Each has `key`, `header`, `render(row)`, and optional `align` (`"left" | "right"`, default `"left"`), `sortKey` and `defaultSortDirection` (see Sorting), and `width` (see Row height and widths).
- `rows`: `T[]`.
- `getRowId`: `(row: T) => string` — stable React key per row.
- `onRowClick?`: `(row: T) => void` — makes the whole row open a detail view; the row becomes keyboard-focusable and `Enter` activates it, same as a click. Omit it for a plain, non-interactive table.
- `sticky?`: keeps the header row visible while the body scrolls — wrap `Table` in a container with its own `max-height` and `overflow-y: auto`.
- `empty?`: rendered in place of the table when `rows` is empty (e.g. an `EmptyState`).
- `sort?`: `{ key, direction: "asc" | "desc" }`, the active sort. Controlled.
- `onSortChange?`: `(next: TableSort) => void`. Without it, every header renders as plain text, even with a `sortKey`.
- `busy?`: the next rows are loading. See Loading.
- `sortPending?`: a sort change is in flight; the active sort icon becomes a spinner. See Loading.
- `stickyColumns?`: `number` — freezes the first N columns while the table scrolls sideways. See Frozen columns.
- On a column, `filter?`: `{ label, options: { value, label, count? }[], selected, onChange, defaultSelected? }` — a filter in the column header. See Filters.
- On a column, `width?`: a fixed CSS width such as `"240px"`. See Row height and widths.
- On a column, `isEmpty?`: `(row: T) => boolean` — when every row is empty for the column, the column is hidden. See Empty columns.
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

## Row height and widths
- Every cell is `white-space: nowrap`, so every row in every table is `--row-height` (44px, room for a 32px button). Don't put wrapping content or stacked two-line cells in a table; show the rest in the detail view.
- Give columns with long values (names, organizations, emails) a `width` such as `"240px"`. Once any column has one, the table uses `table-layout: fixed`: columns with a width keep it, the rest share what's left, and overflowing content is clipped. Wrap long text in `TruncatedText` (add `tooltip` to show the full text on hover, only when cut off) and emails in `TruncatedEmail` (keeps the `@domain`). See [TruncatedText](./TruncatedText.md).
- Without any widths, columns size to their content and the table scrolls sideways when it doesn't fit.

## Loading
Two separate props:
- `busy`, while any change to the rows is in flight (search, tab, filter, page, or a sort; on a list page: the `pending` from `useListSearch`, `useListParams` and `useListSort`). It keeps the current rows in place at reduced opacity (a `--duration` fade, no layout shift), so people keep their place, and runs a thin indeterminate line along the bottom edge of the header row.
- `sortPending`, only while a sort is in flight (`useListSort().pending`). It turns the active column's arrow into a small spinner, so a sort shows where it's working. A search never spins the sort arrow.

Either one sets `aria-busy` on the table. While a sort loads, pass both.

Show the chosen sort at once (`useListSort` does this optimistically) so the spinner appears on the column that was selected. Don't replace the rows with a skeleton for a re-sort: the table is already on screen. For the first load, use the page's loading state instead.

## Filters
**Filters live in column headers; don't add filter selects to toolbars.** Give the column a `filter` and a small filter icon (`ListFilter`) appears after its label. Selecting the label still sorts; the icon opens a popover with a checkbox list, **Clear** and **Apply**.

- **Staged:** checking and unchecking only changes the popover's draft; nothing filters yet. **Apply** (primary) calls `onChange` once with the new selection (in option order) and closes. **Clear** checks every option (no filtering) and stays open; Apply still commits it. Closing any other way (Escape, clicking outside) discards the draft, and the popover reopens showing the applied selection.
- None selected and all selected both mean "no filtering": the icon shows no count and the filter isn't active. Pages filter with `selected.includes(value)` when `selected` isn't empty.
- Controlled, like sorting: the page keeps `selected` (usually in the URL, via `useListParams`), filters the rows (on the server when paginated) and goes back to page 1.
- `options[].count` is how many records have that value; it shows muted after the option label. Leave it off when you can't count cheaply.
- An active filter shows the icon in `--color-text` with the number of selected values next to it, so it isn't carried by color alone.
- A filtered list that ends up empty uses `ListEmptyState`, which offers a way to clear the filters.
- Search lives in the page header (`ListPageHeader`'s `search`); the toolbar holds tabs only.

```tsx
{
  key: "status",
  header: "Status",
  sortKey: "status",
  render: (p) => <Badge $variant={statusVariant(p.status)}>{p.status}</Badge>,
  filter: {
    label: "Status",
    options: [{ value: "active", label: "Active", count: 12 }, { value: "invited", label: "Invited", count: 3 }],
    selected: statusFilter,
    onChange: setStatusFilter,
  },
}
```

## Empty columns
**Tag columns hide when empty.** Give optional columns (tags, notes, secondary IDs) an `isEmpty(row)`. When every row on screen is empty for that column, `Table` leaves out the header and the cells, so the table doesn't carry a column of placeholders. A column with an active filter always shows, so its filter can be cleared. Required columns (name, status) never take `isEmpty`: an empty value there reads as muted placeholder text (see Content rules).

## Frozen columns
`stickyColumns={n}` keeps the first `n` columns (header and cells) in place while the rest scroll sideways, with the table background behind them. Columns only freeze when the table is actually wider than its container; a table that fits behaves like any other. The 1px `--color-border` divider and a soft `--shadow-edge` shadow after the last frozen column appear only while the table is scrolled sideways (the wrapper's `data-scrolled`, set on scroll), so an unscrolled table has no extra line. Freeze what identifies a row, usually the name (1) or name and organization (2), never more. Below 600px only the first column freezes, so frozen columns never fill a phone screen. It works with `sticky` (the header row stays up too). Row focus rings are drawn inside the cells, so the scroll container never clips them.

## Hover
Row hover is pure CSS on every cell (`tbody tr:hover > td`, frozen cells included) with no transition and no script, so the whole row highlights in the same frame. Don't add a hover transition to rows or cells: frozen cells paint their own background, and a transition makes them lag behind the rest of the row.

## Content rules
Header labels are short nouns in sentence case ("Date added", not "DATE ADDED"). A cell with no value reads as muted placeholder text ("No name"), never a blank cell — a blank cell reads as missing data, not "not set".

## Accessibility
Renders a real `<table>`/`<thead>`/`<tbody>`, so column headers (`scope="col"`) are announced with each cell by screen readers. A clickable row is reachable and activatable by keyboard (`tabIndex`, `Enter`) with a visible focus ring; never nest another focusable control (a button, a link) inside a clickable row — a row can't contain a control that needs its own independent activation. Never convey status with a cell's color alone (pair it with a badge/label, as in the example's Status column).

A header filter is its own `button` after the sort button, reached with Tab. Its accessible name is "Filter Status", or "Filter Status, 2 selected" when active (copy in `tableFilterCopy`). Enter or Space opens the popover and moves focus to the first checkbox; Tab moves through the checkboxes, **Clear** and **Apply**; Enter on a checkbox or Apply applies; Escape discards and returns focus to the icon. The checkboxes sit in a `fieldset` whose legend names the column.

A sortable header is a real `button` inside the `th`: reach it with Tab, sort with Enter or Space, with a visible focus ring and a hover fill. The `th` carries `aria-sort` (`ascending`, `descending`, or `none` on sortable columns that aren't active). The button's accessible name says what selecting does: "Name, sorted ascending. Select to sort descending", or "Name. Select to sort". The screen-reader text lives in `tableSortCopy` in `Table.tsx`.

A list page's search field above a `Table` is one documented exception to "every control has a visible label": a compact search box with an obvious icon and placeholder can use `aria-label` alone instead of a wrapping `Field` — see `SearchField.md`.

## Don't
1. Nesting a `Button` or link inside a clickable row (`onRowClick` set) — move it to a non-clickable table or stop the click from bubbling isn't a safe substitute; use `List`/`ListRow` or a plain table without `onRowClick` instead.
2. Using `Table` for one or two loosely related fields per record — that's `List`/`ListRow`.
3. Sorting only the rows on screen when the list is paginated. Sort on the server, then paginate.
4. Adding a filter `Select` to the toolbar for a value that has a column — put a `filter` on that column instead.
5. Freezing more than two columns, or freezing actions.
6. Leaving off `getRowId` in favor of array index — breaks focus/selection identity when rows reorder or filter.
