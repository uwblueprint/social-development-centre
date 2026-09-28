# TruncatedText and TruncatedEmail

One line of text that ends in an ellipsis when it doesn't fit. `TruncatedEmail` truncates an email address in the middle so the `@domain` always shows.

## Use when / Don't use when
- Long single-line values in a fixed-width space: table cells (give the column a `width`), list rows, sheet headers.
- Emails anywhere they can be cut off: `TruncatedEmail`, so the organization's domain stays readable.
- Don't use it for text people need to read in full to act (errors, descriptions, instructions): let it wrap.
- Don't truncate a row's only identifier without a way to see it all: add `tooltip`, or show it in the detail view.

## API
```tsx
import { TruncatedText, TruncatedEmail } from "@/components/ui/TruncatedText";
// TruncatedEmail is also importable from "@/components/ui/TruncatedEmail".
```
- `TruncatedText({ children: string; tooltip?: boolean })`: a block-level span with `overflow: hidden`, `text-overflow: ellipsis` and `nowrap`. It fills its container, so the container needs a width (a table column's `width`, or a flex child with `min-width: 0`). With `tooltip`, hovering it shows the full text in a kit `Tooltip`, only when the text is actually cut off (measured when the tooltip would open).
- `TruncatedEmail({ email })`: two spans. The local part shrinks first and ends in an ellipsis; `@domain` never shrinks until the local part is down to its ellipsis, and then end-truncates. Pure CSS, no tooltip.

## Example
```tsx
{ key: "organization", header: "Organization", width: "220px", render: (p) => <TruncatedText tooltip>{p.organization}</TruncatedText> },
{ key: "email", header: "Email", width: "240px", render: (p) => <TruncatedEmail email={p.email} /> },
```
`amara.okafor.coordinator@northsidefood.org` in 200px reads `amara.okafor.co…@northsidefood.org`.

## Content rules
Truncate from the end for names and titles, where the start identifies the item. Truncate emails in the middle: the domain says which organization someone is from, and the owner copies emails rather than reading them.

## Accessibility
The full text is always in the DOM, so screen readers and copy-paste get all of it; the ellipsis is visual only. The tooltip repeats the visible text, so it's hidden from assistive tech. It opens on hover; keyboard users get the full text in the row's detail view (text isn't a tab stop). `TruncatedEmail` has no tooltip: selecting and copying gets the whole address.

## Don't
1. Passing a `ReactNode` to `TruncatedText`: it takes a string so the tooltip can repeat it.
2. Wrapping it in a container with no width constraint: nothing truncates, the table just grows.
3. Adding a `title` attribute for the full email: people copy it instead.
