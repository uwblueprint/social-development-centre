# Platform: decision log

Decisions that apply across both portals and the component kit. Each entry: the decision, which page it's on, what it affects, and when someone runs into it.

## 1. Filters live in column headers
- **Decision:** A list filters by a column's values from that column's header: a small filter icon after the label opens a checkbox list with counts, **Clear** and **Apply** (see 9). No filter selects in toolbars or the header. An active filter shows the icon at full strength with the number selected.
- **Page:** Every list page with a `Table` (Admin → Community, Partners; Partner → Organization → Team).
- **Affects:** `Table` (`TableColumn.filter`), `docs/components/Table.md`, list toolbars.
- **When encountered:** Narrowing a list by status, role or tag.

## 2. Tag columns hide when empty
- **Decision:** Optional columns such as Tags are hidden, header and cells, when no row on screen has a value. A column with an active filter always shows so the filter can be cleared.
- **Page:** Any `Table` with an optional column (`TableColumn.isEmpty`).
- **Affects:** Table layout; nobody sees a column of placeholders.
- **When encountered:** Lists where nobody has been tagged yet.

## 3. My account is a dialog with three things
- **Decision:** My account opens as a dialog from the sidebar profile menu in both portals, not a page. It holds a profile picture (upload, remove; cropped to a square), the person's name, and a danger zone with **Delete account**. The `/admin/account` and `/partner/account` pages are removed.
- **Why nothing else:** Sign-in is passwordless (email links), so there's no password to change. Email changes wait: the address is the sign-in identity, and for partners it's also the contact record admins manage (partners decision 2), so changing it needs a verified flow the backend doesn't have yet.
- **Deleting:** signs the person out and removes their access at once; it can't be undone. For an admin, SDC keeps their past actions, attributed to "Former admin".
- **Page:** Admin and Partner → profile menu → My account.
- **Affects:** `AccountDialog`, `SidebarConfig.onOpenAccount`, `src/features/account/actions.ts`, backend (docs/backend/README.md, "Accounts").
- **When encountered:** Setting a photo or fixing a name; leaving SDC.

## 4. Sign-out says goodbye, without a confirmation
- **Decision:** **Sign out** acts at once and lands on the sign-in page with a quiet line above the form: "You're signed out. See you soon, {first name}." Deleting an account shows "Your account is deleted and you're signed out."
- **Page:** Sign-in page (`/login?signedOut=1&name=…`, `/login?accountDeleted=1`).
- **Affects:** `signOut()` in `src/app/login/actions.ts`, the sign-in page.
- **When encountered:** Every sign-out.

## 5. Dialogs blur the page behind them; sheets don't
- **Decision:** `Dialog` and `AlertDialog` overlays dim and slightly blur the page (`--overlay-blur`), so the decision in front reads first. `Sheet` only dims: the list behind a sheet is context people keep reading.
- **Page:** Every dialog and sheet.
- **Affects:** `Dialog`, `AlertDialog`, `Sheet`, `tokens.ts`.
- **When encountered:** Any confirmation or dialog form.

## 6. Toasts sit above everything
- **Decision:** One z-index scale in `tokens.ts` (`--z-raised` → `--z-toast`). Toasts are the top layer and are portalled to the page body, so a toast fired from a sheet or dialog (for example after copying an email) always shows.
- **Page:** Any toast.
- **Affects:** `Toast`, `Sheet`, `Dialog`, `AlertDialog`, `Popover`, `DropdownMenu`, `Select`, `Tooltip` and other floating kit components.
- **When encountered:** Copying or saving from inside a sheet or dialog.

## 7. Emails truncate in the middle
- **Decision:** A cut-off email keeps its `@domain` whole and ellipsizes the name part (`amara.okafor.co…@northsidefood.org`); only if the domain alone doesn't fit does it end-truncate. No tooltip.
- **Why:** The domain says which organization someone belongs to, which is what people scan for. The owner copies emails rather than reading them, and copying gets the full address, so a tooltip would only add noise.
- **Page:** Any table or list showing emails (Admin → Community, Partners; Partner → Organization → Team).
- **Affects:** `TruncatedEmail` (`src/components/ui/TruncatedText.tsx`), `docs/components/TruncatedText.md`.
- **When encountered:** Scanning a list with long email addresses.

## 8. Every table row is one height
- **Decision:** Table cells never wrap, so every row in every table is `--row-height` (44px). Long values truncate (`TruncatedText`, with a tooltip where needed) inside fixed column widths (`TableColumn.width`). Row hover is instant on every cell, frozen ones included; frozen columns only freeze when the table overflows, and their divider and shadow show only while scrolled sideways.
- **Why:** Even rows scan faster and don't jump when data changes; the owner saw frozen columns lag a second behind the row hover.
- **Page:** Every `Table`.
- **Affects:** `Table`, `tokens.ts` (`--row-height`, `--shadow-edge`), `docs/components/Table.md`.
- **When encountered:** Any list page.

## 9. Column filters are staged and apply with Apply
- **Decision:** Checking options in a column filter doesn't filter yet. **Apply** commits the selection and closes; **Clear** checks everything (no filtering) and stays open; closing without Apply discards. None or all checked both mean "no filter".
- **Why:** Each change used to reload the list; staging lets people pick several values and filter once, and back out without side effects.
- **Page:** Every column filter (Admin → Community, Partners, Opportunities).
- **Affects:** `Table` (`TableColumnFilter`, `tableFilterCopy`).
- **When encountered:** Narrowing a list by status, role, type or tag.

## 10. Search sits in the page header
- **Decision:** A list page's search field sits in the header row, just left of the page actions, at a fixed 280px (`--search-width`); below 640px it wraps to its own full-width row. The toolbar under the header holds the tabs only.
- **Why:** Search filters the whole page across tabs (tab counts follow it, and empty tabs point to matches in other tabs), so it belongs with the page, not with one tab.
- **Page:** Admin → Opportunities, Partners, Community; Partner → Opportunities.
- **Affects:** `ListPageHeader` (`search`, `results`), `ListPageToolbar` (tabs only; `search` ignored), `docs/patterns/ListPage.md`.
- **When encountered:** Every search.

## 11. Opportunity types have their own colors
- **Decision:** Five category colors (`--color-category-1…5`: blue, violet, fuchsia, pink, lime, each with `-subtle` and `-border`) for kinds of thing, starting with opportunity types. Badges take `$category` and a leading icon; the type's name is always shown.
- **Why:** Opportunity types need distinct, non-status colors: using status colors would make a job read as "success" or an event as "warning". Hues avoid the status and accent hues; text is 5.5:1 or better on its fill.
- **Page:** Wherever an opportunity type shows (Opportunities list and sheet, both portals).
- **Affects:** `Badge` (`$category`), `tokens.ts`, `docs/components/Badge.md`.
- **When encountered:** Scanning opportunities by type.

## 12. Entered tags are selectable
- **Decision:** In a tag input (e.g. adding members by email), tags select like Notion's share dialog: click, Shift-click for a range, Cmd/Ctrl-click to toggle, Cmd/Ctrl+A in the empty field for all, arrows to move. Backspace/Delete removes the selection; Cmd/Ctrl+C copies it comma-separated, Cmd/Ctrl+X cuts it. Typing or Escape deselects.
- **Why:** People paste long lists and need to fix or move several addresses at once.
- **Page:** Any `TagInput` (entering many emails at once; the kit demo on `/components` today).
- **Affects:** `TagInput`, `docs/components/TagInput.md`.
- **When encountered:** Adding or inviting several people at once.
