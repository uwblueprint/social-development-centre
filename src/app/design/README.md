# Designers' screens

One folder per feature: `src/app/design/<feature>/page.tsx`, open at `/design/<feature>` in `pnpm dev`. Hidden in production builds.

- Admin screens go in `(admin)/<feature>/` and sit inside the real admin sidebar. Design inside the space that's left; don't add your own navigation. A dev adds your screen to the sidebar. Member-facing screens go outside `(admin)` and have no sidebar.
- Same rules as the product (`AGENTS.md`): kit components, tokens, labels, accessibility. `pnpm check` scans these pages too.
- Demo data only, behind typed contracts in the feature's folder. No server actions or database calls.
- Devs build the real feature in `src/app/admin/` by moving code from here, then delete the design copy.

## State lab

Every `/design/*` screen has a floating **State lab** button at the bottom left. It opens a panel of switches for edge cases. The lab changes nothing on the page: each switch only sets a flag, and your screen reads the flag and decides what that state looks like. Active states are stored in the URL (`?lab=offline,empty`), so a combination can be shared as a link.

Three groups, in this order, on every screen. Each switch has a one-line note on what to design.

**Page** (the whole screen)

- Loading: first load, no data yet.
- Slow loading: plays a real ~10s delay. Loading, then a "taking longer" message after ~4s, then the data. Switch it off and on to replay.
- Couldn't load: the page's data failed; offer Try again.
- Empty: nothing exists yet.
- Page not found, No permission: the screen can't be shown.
- Session expired: signed out mid-session; keep unsaved work and ask them to sign in.
- Offline, Reconnecting: no connection, then back and catching up.
- Read-only: a viewer role; everything visible, nothing editable, controls say why.

**Section** (one pane or list while the rest works)

- One section failed, One section empty: map them to your screen's sections.
- Partial data: some items miss fields.
- Stale data: old data; show "Last updated" and a refresh.
- Many items: 500+ in a list.
- Single item: exactly one (plurals, layouts).
- Long text: long names, emails and messages.
- Then the screen's own `data` states.

**Action** (one thing the person does)

- Saving: in flight for ~5s; progress, no double submit.
- Save failed: keep their input, offer Try again.
- Changed by someone else: a conflict; show what changed and let them choose.
- Validation error: the server rejects a value.
- Too many requests: rate-limited; say when to try again.
- One action not allowed: the page works but this action doesn't; disable with a reason.
- Undo expired: the undo window passed.
- Then the screen's own `actions` states.

**Rule:** every screen designs Loading, Slow loading, Empty, Couldn't load and Long text, plus whichever Section and Action states apply (a screen with no save has no Save failed). Declare the screen's own edge cases too. List the smallest set that can really happen on that screen, not every possible one. Write each label as a short sentence-case name ("Couldn't create link") and add a description.

```tsx
import { useLabLoad, useLabDelay, SAVING_FOR, useStateLab } from "../_state-lab/useStateLab";

const lab = useStateLab({
  data: [{ id: "numbers-failed", label: "Couldn't load numbers", description: "The stats card fails; the list works." }],
  actions: [{ id: "create-failed", label: "Couldn't create link" }],
});

// Flags (typed): lab.loading, slowLoading, loadFailed, empty, notFound, noPermission, sessionExpired,
// offline, reconnecting, readOnly, sectionFailed, sectionEmpty, partialData, staleData, manyItems,
// singleItem, longText, saving, saveFailed, conflict, validationError, rateLimited, actionDenied, undoExpired.
lab.is("create-failed"); // only ids you declared type-check

// Loading, including the slow case with its real delay:
const load = useLabLoad(lab); // { loading, takingLonger }
// load.loading: show the skeleton. load.takingLonger: also show "Still loading. This is taking longer than usual."

// Any other delay, e.g. an approve that stays in flight, then resolves:
const inFlight = useLabDelay(SAVING_FOR, lab.saving); // true until 5s after Saving turns on
```

Declare general states that can't happen on your screen (say, Read-only when there are no viewer roles) so the panel shows them switched off with "Doesn't apply to this screen":

```tsx
useStateLab({ notApplicable: ["readOnly", "actionDenied"] }); // their flags are always false
```

Two more helpers: `useLabDeferred(value, ms)` returns `{ value, pending }` and follows `value` after a delay (a search that keeps the previous results while it runs; `SEARCH_FOR` is 400ms, `SLOW_SEARCH_FOR` while Slow loading is on), and `useLabDelay(ms, active)` is true for `ms` after `active` turns on.

Import from `../_state-lab/useStateLab` (adjust the path for your folder depth). A screen that doesn't call the hook still shows the general states.
