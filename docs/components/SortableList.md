# SortableList

A list the person puts in their own order, such as the membership tiers on the Payments page. Each row shows its place (1, 2, 3…) and a drag handle.

## Use when / Don't use when
- Use it when the order is a choice someone makes and it is shown to others (tiers, steps, featured items).
- Don't use it to sort by a value (price, date, name). Use a sortable `Table` for that.
- Holding a row within 80px of the top or bottom of the screen (or of its scrolling box) scrolls that way, faster the closer to the edge, so long lists work.

## API
```tsx
import { SortableList } from "@/components/ui/SortableList";
```
- `items: T[]`, `getId(item)` (a stable id, never the index), `getLabel(item)` (what the item is called, e.g. "Gold").
- `onReorder(next: T[])`: called with the whole list in its new order after a drop or a key press. Update your state, then save.
- `variant`: `"list"` (default, with position numbers) or `"table"`: no position numbers, the Table's row height, inset dividers and hover box, for a list that sits under a Table-style header row.
- `onRowClick(item)`: makes the whole row clickable (clicks on buttons and links inside it are left to them). Give the same action a keyboard path, e.g. a row menu.
- `aria-label`: names the list. Required.
- `children(item)`: the row's own content (text, buttons). The position number and drag handle are added for you.

## Example
```tsx
<SortableList items={tiers} getId={(t) => t.id} getLabel={(t) => t.name} onReorder={save} aria-label="Tiers">
  {(tier) => <span>{tier.name}</span>}
</SortableList>
```

## Content rules
- Labels are the item's name only; the component writes "Reorder Gold, position 2 of 4…" and "Gold moved to position 2 of 4." itself.
- Say somewhere near the list that the order is what others see.

## Accessibility
- Dragging uses pointer events, so it works with a mouse, a touchpad (press, drag, release) and touch. The handle is 40px square and stops page scroll only while it is touched.
- Keyboard: Tab to a row's handle, then press Up or Down to move it one place. Escape cancels a drag. The handle's label says its position and how to move it.
- The visible position number is decorative (`aria-hidden`); the handle's label and the live announcement carry it for screen readers.
- Each move is announced in a polite live region.
- Moving rows animate with `--duration`; reduced motion is handled globally.

## Don't
1. Using the array index as `getId`: rows lose their identity when the order changes.
2. Removing the keyboard path. The handle must stay a focusable button that takes Up and Down.
3. Putting form controls inside a row without labels: each still needs its own `aria-label`.
