# DropdownMenu

A trigger-opened menu of actions, checkable items, and grouped labels.

## Use when / Don't use when
- Secondary actions that would clutter a screen as buttons (rename, duplicate, delete) or a set of togglable view options.
- A single primary action — use `Button` directly.
- Picking one value for a form field — use `Select`.
- Confirming a destructive action — open an `AlertDialog` from the menu item's `onSelect`, don't destroy directly.

## API
```tsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuCheckboxItem, DropdownMenuGroup, DropdownMenuRadioGroup,
} from "@/components/ui/DropdownMenu";
```
- `DropdownMenu` (Root): `open`/`onOpenChange`.
- `DropdownMenuTrigger`: `asChild` to render your own `Button`.
- `DropdownMenuItem`: `disabled?`, `onSelect`.
- `DropdownMenuCheckboxItem`: `checked`, `onCheckedChange`.

## Example
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem>Rename<DropdownMenuShortcut>⌘R</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked={show} onCheckedChange={setShow}>
      Show activity
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Content rules
Each item starts with a verb ("New file", "Rename"); shortcuts are accelerators shown via `DropdownMenuShortcut`, never the only path. `DropdownMenuLabel` is a short uppercase section heading.

## Accessibility
Full keyboard navigation (arrows, type-ahead, Esc to close) via Radix. Disabled items are focusable-skippable but visually muted, never color-only (also `cursor: not-allowed`). Checkbox items always render their box, checked or not, so state is visible at a glance.

## Don't
1. Putting a single, always-visible action inside a menu — just use `Button`.
2. Relying on a keyboard shortcut shown in `DropdownMenuShortcut` as the only way to trigger it.
3. Nesting a destructive action without a confirming `AlertDialog`.
