# Platform: decision log

Decisions that apply across both portals and the component kit. Each entry: the decision, which page it's on, what it affects, and when someone runs into it.

## 1. Filters live in column headers
- **Decision:** A list filters by a column's values from that column's header: a small filter icon after the label opens a checkbox list with counts and **Clear filter**. Toolbars keep search and page actions only; no filter selects there. An active filter shows the icon at full strength with the number selected.
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
