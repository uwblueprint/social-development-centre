# Popover

A small, dismissible panel anchored to a trigger, for a contextual action or bit of info.

## Use when / Don't use when
- A short, focused action anchored to a control (e.g. "Share" showing a copyable link) that doesn't need the whole page dimmed.
- A full task or form — use `Dialog`, which centers and dims the page.
- Text-only, non-interactive info on hover — use `HoverCard` or `Tooltip`.

## API
```tsx
import { Popover, PopoverTrigger, PopoverAnchor, PopoverContent, PopoverActions, PopoverClose } from "@/components/ui/Popover";
```
- `Popover` (Root): `open`/`onOpenChange`.
- `PopoverTrigger asChild` — wrap your own `Button`.
- `PopoverContent({ showClose = true, sideOffset = 8, ... })` — includes a labeled close (×) button and an arrow by default.
- `PopoverActions` — right-aligned footer row with a top divider, for popovers that end in an action.

## Example
```tsx
<Popover>
  <PopoverTrigger asChild><Button variant="secondary">Share</Button></PopoverTrigger>
  <PopoverContent>
    <Field label="Link">
      {(props) => <Input {...props} readOnly defaultValue="https://example.com/s/abc123" />}
    </Field>
    <PopoverActions>
      <Button size="sm">Copy link</Button>
    </PopoverActions>
  </PopoverContent>
</Popover>
```

## Content rules
Keep content to one focused idea; if it grows into a multi-field form, promote it to a `Dialog` instead.

## Accessibility
Focus moves into the content on open; Esc and outside-click dismiss and return focus to the trigger. The close button always carries `aria-label="Close"`.

## Don't
1. Stuffing a multi-step form into a `Popover` — move it to a `Dialog`.
2. Setting `showClose={false}` without another obvious way to dismiss (e.g. an action that itself closes it).
3. Using `Popover` for purely informational, non-interactive content — that's `HoverCard`.
