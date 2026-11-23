# Search palette (Ctrl K)

Ctrl K (⌘K on a Mac), or the search icon in the sidebar header (its tooltip reads "Search (Ctrl K)"), opens a search across:
- **pages**: the sidebar's sections and Documentation
- **settings**: each row on the Settings page
- **people**: everyone on the People page
- **automatic emails**

Choosing a result takes you there. A setting or a person is scrolled to, focused and tinted for a moment.

It runs in both the real admin shell and the design admin shell (`/design/...`), on demo data when there are no Supabase credentials.

## How it's built
- **UI:**
  - `CommandPalette` (kit, `src/components/ui/`) is a Radix dialog with cmdk inside.
  - `SearchPalette` (`src/features/search/`) decides what to search and how to rank it (`rank.ts`).
- **Pages and settings** are searched in the browser, so they show instantly.
  - Pages come from `adminNav.ts`, which also holds their hidden search words.
  - Settings come from `src/features/search/settings.ts`. It lists the rows on each Settings page: the built page has fewer rows than the design page.
- **People and automatic emails:**
  - `GET /api/admin-search` returns every person on the People page (id, name, email) and every automatic email (id, name).
  - The palette loads this once each time it opens and then filters in the browser. A list loaded earlier in the visit shows straight away while the fresh one loads.
  - At about 150 people this is faster and simpler than a query per keystroke. There's no debouncing, no cancelling stale requests and no escaping of user input in SQL.
  - It's a route handler, not a server action, because this Next version runs server actions one at a time.
- **Auth:** the route checks `getCurrentAdmin()` on every call, and row-level security limits both tables to admins as well. Without Supabase credentials in dev it returns demo data (`src/features/search/demo.ts`).
- **Errors:**
  - Each group (people, emails) reports success or failure on its own, so one failing doesn't hide the other.
  - Offline, the palette says pages and settings still work and offers **Try again**. It also retries by itself when the connection comes back.
- **Highlighting:**
  - A result's link ends in `#<id>`, and the destination row has that id (`targets.ts`): `setting-<key>` on Settings rows, `person-<id>` on People rows.
  - After navigating, `arrive()` scrolls to the row, focuses it and sets `data-search-arrived`. The tint (`--color-selection`) is a global rule in `tokens.ts`.
  - If a person's row isn't on the People page, a toast says "That person isn't on the list anymore".
- **Recents:** the last 5 results opened, kept in this browser's localStorage (`recent.ts`). People and emails are re-checked against the fresh list, so a removed person drops out.

## Before this feature is done
- [ ] **Documentation search.** Gaurav will add searching the user guide's contents (`docs/user-guide/`, rendered at `/admin/documentation`). For now Documentation is only a page result. Likely approach: build a small index of headings at build time and add a "Documentation" group that links to `/admin/documentation#<heading>`.
- [ ] **Open the person's panel.** People is still a plain list on this branch, so a person result scrolls to and tints their row. When the member directory's person panel lands, change `personHref` in `src/features/search/targets.ts` to open it (e.g. `?person=<id>`), and keep the "isn't on the list anymore" toast for removed people.
- [ ] **Highlight in an automatic email.** A result opens `/admin/automatic-emails/<id>`; nothing on that page is marked. Fine as is unless Gaurav wants more.
- [ ] **Outbox, Payments and Signup links results.** These sections only have design screens or live on other branches. Once they're built, decide whether their records (e.g. a scheduled email, a signup link) should be searchable too, and add each as a group.
- [ ] **Settings rows on the built Settings page.** Email sending and Email alerts show only on the design page until their backend lands (`docs/backend/settings.md`). When they move to `/admin/settings`, give each row its `settingTargetId(key)` and move its entry in `settings.ts` into the `admin` list.
- [ ] **A signed-out session.** If the session expires while the palette is open, the route returns 401 and the palette shows "Couldn't load people and automatic emails". Consider sending the person to sign in instead.
- [ ] **Scale.** If People grows past about 5,000 people (the list would pass about 500 KB), switch people to a query per keystroke. Use an `ilike` RPC on name and email with a parameterised pattern, `%`, `_` and `\` escaped, `limit 5`, debounced about 150ms and cancelled with `AbortController`. Add a `pg_trgm` GIN index only if it gets slow.
