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

## Icons
- Put a leading `<Icon icon={Name} size={16} />` as the item's first child. The kit gives it the standard `--space-2` gap, keeps it from shrinking and mutes it so the label leads (a danger item can set `& > svg { color: inherit; }`).
- **All or none:** when any item in a menu has an icon, every item in that menu has one. Mixed menus make the labels start at different positions.

```tsx
<DropdownMenuItem onSelect={duplicate}>
  <Icon icon={Copy} size={16} />
  Duplicate
</DropdownMenuItem>
```

## Content rules
Each item starts with a verb ("New file", "Rename"); shortcuts are accelerators shown via `DropdownMenuShortcut`, never the only path. `DropdownMenuLabel` is a short uppercase section heading.

`DropdownMenuSeparator` has 2px (`calc(var(--space-1) / 2)`) above and below.

## Accessibility
Full keyboard navigation (arrows, type-ahead, Esc to close) via Radix. Disabled items are focusable-skippable but visually muted, never color-only (also `cursor: not-allowed`). Checkbox items always render their box, checked or not, so state is visible at a glance.

## Don't
1. Putting a single, always-visible action inside a menu — just use `Button`.
2. Relying on a keyboard shortcut shown in `DropdownMenuShortcut` as the only way to trigger it.
3. Nesting a destructive action without a confirming `AlertDialog`.
4. Giving icons to some items in a menu and not others.

## Destructive items
Use `<DropdownMenuItem $variant="danger">` for destructive actions (Unsubscribe, Remove, Delete). The label and its icon both use `--color-danger`, and the highlight uses `--color-danger-subtle`. Don't restyle items locally. Put destructive items last, after a separator.
