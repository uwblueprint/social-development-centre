# State lab (disposable)

A dev-only tool for auditing every loading, empty, error and edge state. Click **State lab** in the sidebar footer (both portals) while `pnpm dev` runs.

- **Simulate:** switches that make the real code misbehave: slow loading, data failing to load, no data, very long text, slow saves, failing saves, a session ending mid-edit, and Eventbrite timing out or failing. They live in the dev server's memory and reset when it restarts. A yellow badge at the bottom left shows while any is on.
- **Checklist:** every designed edge case by area. **Go** turns on the switches the case needs (and turns the rest off) and opens the page; **Image** downloads a test picture for the image field.

Nothing runs in production: every hook checks `NODE_ENV`.

## Removing it

1. Delete `src/dev/state-lab/`.
2. Delete every line tagged `STATE LAB` (search the repo for `STATE LAB`), plus the import each one uses. They are in:
   - `src/app/layout.tsx` (mounts the panel)
   - `src/components/patterns/Sidebar.tsx` (the **State lab** footer item and its `FooterButton` style)
   - `src/app/admin/_data/session.ts`, `src/app/partner/_data/session.ts` (saves: slow, failing, signed out)
   - `src/features/opportunities/queries.ts`, `src/app/admin/partners/_data/queries.ts`, `src/app/admin/community/_data/queries.ts`, `src/app/partner/organization/_data/queries.ts` (loading: slow, failing)
   - `src/features/opportunities/store.ts`, `src/app/admin/community/_data/store.ts`, `src/app/admin/partners/_data/queries.ts` (empty, long text)
   - `src/features/opportunities/eventbrite.ts` (Eventbrite)
3. Run `pnpm check`.
