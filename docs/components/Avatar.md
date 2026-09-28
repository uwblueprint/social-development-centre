# Avatar

A circular image with an initials fallback, in three sizes.

## Use when / Don't use when
- Representing a person or organization (profile photo, member list, avatar stack).
- Generic iconography — use `Icon`.
- Don't rely on it alone to identify someone in a dense list — pair with a visible name nearby.

## API
```tsx
import { Avatar } from "@/components/ui/Avatar";
```
- `initials: string` (required) — shown while the image loads or if `src` is absent.
- `src?: string`, `alt?: string` (default `""` — decorative unless the image conveys unique info).
- `size?: "sm" | "md" | "lg"` — default `md`.

## Example
```tsx
<Avatar src={user.photoUrl} initials="AK" size="md" />
```

## Overlapping stack
```tsx
<AvatarGroup> {/* your own flex row with negative margin + border, see DisplayDemos */}
  <Avatar initials="AK" />
  <Avatar initials="+8" />
</AvatarGroup>
```

## Content rules
`initials` is 1–2 characters, uppercase. For a "+N more" avatar in a stack, pass `initials="+8"` rather than inventing a separate component.

## Accessibility
The fallback only appears after a 400ms delay when `src` is set, avoiding an initials-then-image flash on fast loads. Give `alt` real text only when the image itself carries information beyond the person's identity already stated elsewhere (usually leave it empty/decorative).

## Don't
1. Leaving `initials` empty — it's required precisely because images fail to load.
2. Using `Avatar` for non-person/organization imagery.
3. Building a custom border/overlap stack without a 2px `--color-bg`/`--color-surface-raised` border between avatars — they'll visually merge.
