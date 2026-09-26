# Table

A semantic data table for records with several columns: a muted `text-xs` header row, 1px hairline dividers between rows, and a `--color-bg-hover` row hover. Optionally makes the whole row open a detail view.

## Use when / Don't use when
- Records with several comparable fields (name, email, status, date) where people scan down a column.
- A list of similar records with one or two fields each and no real column alignment — use `List`/`ListRow` instead.
- A row with several independent interactive controls (its own buttons/checkbox) that shouldn't all trigger the same action — those go in a plain `<td>`, not on the row's `onRowClick`.

## API
```tsx
import { Table } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
```
- `columns`: `TableColumn<T>[]` — each has `key`, `header`, `render(row)`, and optional `align` (`"left" | "right"`, default `"left"`).
- `rows`: `T[]`.
- `getRowId`: `(row: T) => string` — stable React key per row.
- `onRowClick?`: `(row: T) => void` — makes the whole row open a detail view; the row becomes keyboard-focusable and `Enter` activates it, same as a click. Omit it for a plain, non-interactive table.
- `sticky?`: keeps the header row visible while the body scrolls — wrap `Table` in a container with its own `max-height` and `overflow-y: auto`.
- `empty?`: rendered in place of the table when `rows` is empty (e.g. an `EmptyState`).
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

## Content rules
Header labels are short nouns in sentence case ("Date added", not "DATE ADDED"). A cell with no value reads as muted placeholder text ("No name"), never a blank cell — a blank cell reads as missing data, not "not set".

## Accessibility
Renders a real `<table>`/`<thead>`/`<tbody>`, so column headers (`scope="col"`) are announced with each cell by screen readers. A clickable row is reachable and activatable by keyboard (`tabIndex`, `Enter`) with a visible focus ring; never nest another focusable control (a button, a link) inside a clickable row — a row can't contain a control that needs its own independent activation. Never convey status with a cell's color alone (pair it with a badge/label, as in the example's Status column).

A toolbar's search field above a `Table` is one documented exception to "every control has a visible label": a compact search box with an obvious icon and placeholder can use `aria-label` alone instead of a wrapping `Field` — see `SearchField.md`.

## Don't
1. Nesting a `Button` or link inside a clickable row (`onRowClick` set) — move it to a non-clickable table or stop the click from bubbling isn't a safe substitute; use `List`/`ListRow` or a plain table without `onRowClick` instead.
2. Using `Table` for one or two loosely related fields per record — that's `List`/`ListRow`.
3. Leaving off `getRowId` in favor of array index — breaks focus/selection identity when rows reorder or filter.
