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
**Superseded (28 Sep 2026):** there is no My account; see "Sidebar footer: Documentation and Sign out, no My account" below.
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

## Sidebar footer: Documentation and Sign out, no My account (28 Sep 2026)
**What:** The sidebar footer has **Documentation** (the user guide, rendered in the portal) and a red **Sign out**. The profile menu, My account dialog, profile pictures and account deletion are gone. The SDC mark next to the product name is removed.
**Why:** Logins can be shared and the app doesn't use the person's name, so an account screen added complexity with no benefit.
**Affects:** Both portals.

## Documentation page (28 Sep 2026)
**What:** The sidebar link is **Documentation** (not "Help and guides"). The page uses the ListPage header and one tab per guide (`?guide=` keeps the open tab linkable). Emphasis in the guides renders as medium weight, `--text-sm`, 140% line height, never bold.
**Why:** Owner request; it follows the design system instead of a one-off long page.
Round two: sub-headings in "On this page" show only for the section you're reading; the text column is narrower (60 characters) and starts a fixed gap after the contents list, with the spare width on the right; body text uses `--leading-prose` (1.7) and `--tracking-prose` (0.01em), new tokens for long-form reading.

## Dark mode (owner, 28 Sep 2026)
**What:** Every color token has a dark value (`tokens.ts`). The app follows the device's light/dark setting. One sidebar item above **Sign out** names the other mode ("Dark mode" / "Light mode"); clicking it switches and saves the choice in the browser. A script in `<head>` applies a saved choice before first paint.
**Why:** Owner request; a single item is simpler than a System / Light / Dark control.

## Page entrance when switching sections (owner, 28 Sep 2026)
**What:** Choosing another section in the sidebar fades the new page in while it rises 12px (`--enter-offset`, `--duration-slow`, `--ease`). Tabs, filters and panels inside a section don't replay it. Reduced-motion settings turn it off.
Dark hover and selected (owner, 28 Sep): translucent white (9% and 14%) instead of fixed shades, so ghost buttons, menu items and rows visibly lighten on every surface, including sheets.
Documentation tabs (owner, 28 Sep): Getting around first, then the sidebar's order (Opportunities, Insights, Community, Partners) with the sidebar's icons. Insights has an empty guide until the page exists.
Product name (owner, 28 Sep): the admin portal is **Nexus**: sidebar brand (at page-heading size) and page titles ("Community · Nexus").
Kit (owner, 28 Sep): `Avatar` removed; nothing in the product shows people's pictures or initials.

Toasts (owner, 28 Sep): every confirmation names its subject: "“Film night” saved as a draft", "Changes to Northside Food Bank saved", "Copied 3 email addresses from Northside Food Bank". Disabled controls' dashed borders are drawn as 4px dashes in the hairline border color (grey), so they read as dashed and as disabled.

## 404 page (owner, 28 Sep 2026)
**What:** Unknown URLs show "404: Next station... not found. / This one isn't on the ION route. Head home and get back on track." with **Head home** and the owner's line illustration (`public/illustrations/off-route.svg`, recoloured to taupe-600 lines on taupe-50 with a CSS luminance mask, gently drifting).
**Head home** goes to the Opportunities page of the portal the missing address was in (`/partner/…` → partner, anything else → admin).

## Page loading (owner, 28 Sep 2026)
With slow data, clicking Community from Opportunities looked ignored: the old page and highlight stayed until Community loaded. Now the sidebar highlights the chosen item immediately, and every data page has a loading state (title and placeholder rows) that shows while it loads.

## State lab (owner, 28 Sep 2026)
A disposable, dev-only panel for auditing edge states, opened from **State lab** in the sidebar footer (no keyboard shortcut). See `src/dev/state-lab/README.md` to remove it.

404 illustration in dark mode (owner, 28 Sep 2026): the inverse of light mode. Light is taupe-600 lines on a taupe-50 square; dark is taupe-500 lines (owner) on a taupe-900 square, and the page behind it is taupe-900 so the square blends in (tokens `--illustration-line`, `--illustration-ground`, `--illustration-page-bg`).

Portal 404s (owner, 28 Sep 2026): unknown URLs under /admin or /partner show the 404 inside that portal's shell (sidebar visible, nothing highlighted). A mistyped section name (one segment, 4+ characters, exactly one section within two typos, e.g. /admin/communit) redirects to that section instead (`src/lib/closestSection.ts`).

Motion (owner, 28 Sep 2026): after a loading state, list-page content (everything under the page title) fades in and rises 8px; the title doesn't move. Tabs' active line slides between tabs with a slight spring, in every tab set (kit `TabsList`).

## Load errors: escalation (owner, 28 Sep 2026)
**What:** when a page fails to load, the error is centred in the content area like the 404 (same spacing and type sizes), with the escalation sentence in the same paragraph as the description, then **Try again**. Admins: "If it keeps happening, email {BSF_SUPPORT_EMAIL}." (a mailto link once the address is real). Partners and anyone else: "If it keeps happening, tell an SDC admin." It replaces the partner-only "contact SDC at {email}" line.
**Where:** every section's error boundary (`RouteError`). **Pending:** a dedicated illustration to replace the alert icon, like the 404's; the real BSF address in `src/lib/contact.ts`.

Offline (owner, 28 Sep 2026): the app never locks up the moment the wifi drops. A toast says you're offline and that you can keep reading; when you try something that needs the server (submitting a form or opening another page), a dialog shows the goose illustration: "Goose stole your wifi. Please reconnect to the internet and try again." with **Try again**. A page that fails to load while offline shows the same screen. A toast says when you're back online. Guidance: web.dev offline UX guidelines, Google Design "Offline design".
Tab titles (owner, 28 Sep 2026): both portals' browser tabs read "… · Nexus".

Offline: modal or page (owner, 28 Sep 2026): a dialog when an action needs the server (people keep their place and their draft), a full page only when the page they asked for can't load. Both use the illustration's ground (taupe-50; taupe-900 in dark) so the drawing's square blends in. The dialog uses the dialog title size (centred) with a 14px message; the full page uses the 404's sizes. Brand illustrations are square (no radius) and their mask bleeds 2px past the frame, so no hairline shows at the edges when zoomed in.

Offline actions (owner, 28 Sep 2026): actions that call the server directly (Fill in details, the panel's Close, Reopen, Delete and so on) also stop with the goose while offline (`requireOnline()` in `src/lib/offline.ts`), and any other server action made offline is caught by a safety net in `OfflineWatcher`.
