# Tag

A small pill: a static label (`Tag`), a togglable filter chip (`SelectableTag`), or a removable selection chip (`RemovableTag`).

## Use when / Don't use when
- `Tag`: a static, non-interactive label (status, category).
- `SelectableTag`: multi-select pickers where several chips can be toggled on/off (topics, filters).
- `RemovableTag`: showing the current selections made elsewhere, each removable on its own.
- Choosing exactly one value — use `RadioGroup` or `Select`, not tags.

## API
```tsx
import { Tag, SelectableTag, RemovableTag, TagList } from "@/components/ui/Tag";
```
- `Tag`: plain `<span>` props, `children`.
- `SelectableTag({ selected?: boolean, ...button props })` — sets `aria-pressed`; shows a check/plus icon plus color change.
- `RemovableTag({ children, onRemove: () => void, ...span props })` — auto-labels its remove button when `children` is a string.
- `TagList` — flex-wrap container with the standard gap.

## Example
```tsx
<TagList role="group" aria-label="Available topics">
  {topics.map((t) => (
    <SelectableTag key={t} selected={selected.includes(t)} onClick={() => toggle(t)}>
      {t}
    </SelectableTag>
  ))}
</TagList>
```

## Content rules
Short nouns (1–3 words), sentence case, no trailing punctuation. Keep a group's tags parallel in form.

## Accessibility
`SelectableTag` never relies on color alone — it also swaps the leading icon (plus → check) and keeps a fixed width so toggling never reflows the row. `RemovableTag`'s × button always gets a descriptive label. Wrap a `TagList` of pickers in `role="group"` with a group `aria-label`.

## Don't
1. Using `SelectableTag` for a single-choice picker — use `RadioGroup`.
2. Leaving a `RemovableTag` unlabeled when `children` isn't plain text.
3. Forgetting the group `aria-label` on a `TagList` of pickers.
