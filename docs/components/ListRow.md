# ListRow

A dense, full-width, clickable and keyboard-focusable row for lists and simple tables, used with `List` for hairline dividers between rows.

## Use when / Don't use when
- A list of records (partners, people, results) where the whole row opens a detail view and every row looks alike.
- A row with several independent interactive controls (e.g. its own buttons/checkbox) that shouldn't all trigger the same action — compose plain elements in a `Card` or table instead; don't nest interactive controls inside a `ListRow`.
- A single primary action — use `Button`.

## API
```tsx
import { List, ListRow } from "@/components/ui/ListRow";
```
- `List` — flex column; adds a 1px `--color-border` divider between children (none around the group).
- `ListRow` — a `<button>` (all native button props/`ref` apply); lay out its contents with your own flex/grid.

## Example
```tsx
<List>
  {partners.map((p) => (
    <ListRow key={p.id} onClick={() => openPanel(p.id)}>
      <span>{p.name}</span>
      <span>{p.opportunityCount} opportunities</span>
    </ListRow>
  ))}
</List>
```

## Content rules
Keep row content to short, scannable fragments (name, one or two secondary fields); move anything longer into the detail view the row opens.

## Accessibility
Renders as a real `<button>`, so it's reachable and activatable (Enter/Space) by keyboard with no extra wiring, and gets the standard visible focus ring. Never put another focusable control inside a `ListRow` — a button can't contain a button.

## Don't
1. Nesting a `Button`, link or other focusable control inside a `ListRow`.
2. Using it for a single isolated action — that's `Button`.
3. Skipping `List` and hand-rolling dividers — keeps spacing/border rules consistent.
