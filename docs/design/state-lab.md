# State lab: designing every state of a screen

Every `/design/*` screen has a **State lab** button at the bottom left. It opens a panel of switches, one per state the screen can be in. The lab changes nothing by itself: a switch sets a flag, and the screen reads the flag and draws that state. Active states live in the URL (`?lab=offline,empty`), so any state can be opened from a link, reviewed and screenshotted.

## What adding the lab means

Adding the lab to a screen is not "call the hook and draw a few states", and it is not ticking through the general list. It is finding every way **this screen's data and actions** can differ from the happy path, deciding what each one looks like and says, and making each one reachable from a switch and a link. A screen is done when someone can flip every switch, alone and in combination, and never sees a broken, blank, jumping or lying screen. A switch for something that can't happen on this screen is noise: leave it out.

Do it in this order:

1. **Start from the backend, not from the list.** Read what the screen really talks to: the tables and their nullable columns, the `check` constraints and enums (every value a `status` or `kind` can take), the queries, the RPCs and the errors they raise, the server actions and the messages they return, and anything outside (webhooks, an outside service, a cron). Each one is a state:
   - a nullable column → a missing value (a fee not reported yet, a payer with no email, a person deleted);
   - an enum value → a row that looks different (a refund, a chargeback, a declined card, a suspended subscription);
   - a sign or `check` constraint → a value outside the happy range (a negative amount, a total below zero);
   - an RPC `raise` or a returned code → an action failure with its own words ("That payment is already assigned", "name_taken", "deleted");
   - each separate request → a part that loads, is slow or fails on its own;
   - an outside service → it isn't set up, or it's behind (webhooks failing and retrying).
   Payments is the worked example: `PAYMENTS_LAB` in `src/app/design/(admin)/payments/states.tsx` says where each of its states comes from.
2. **Then walk the checklist below** to catch what the backend doesn't show (first load, empty for a period vs empty because filtered, long text, many rows, the session ending).
3. **Declare only what can happen** with `useStateLab` (below): the screen's own states as `data` and `actions`, named in the screen's words, each with a one-line description of where it comes from. List every general state that can't happen here as `notApplicable`; the panel then leaves it out. App-wide conditions the shell handles (offline, page not found, no access) are not designed per page unless the page does something of its own with them.
4. **Design each one** with the rules below, using the kit and the copy rules. Reuse the patterns other screens already use; a new way to show "couldn't load" is a bug.
5. **Check each one** in the browser at 1280px and 360px, with the keyboard, alone and combined with the others (Empty + Filters on, Slow loading + one part failed, a missing value + a partial period). No text may read `NaN`, `undefined`, `null`, `Infinity` or `[object Object]`.

## Checklist

Go through every line for every region and action. "Can't happen here" is a fine answer; "didn't think about it" is not.

**Loading**
- [ ] First load: nothing is known yet. What shows in each region's place, at its final size?
- [ ] Slow load: still loading after about 4 seconds. Is there a calm "still loading" line, and does the rest of the page stay usable?
- [ ] Refresh: data is on screen and something changes it (a filter, the range, a page, a sort). The old data stays in place, marked busy; never a skeleton again.
- [ ] One region loads much later than the others. Does anything jump when it arrives?

**Failure**
- [ ] The whole page's data fails.
- [ ] One region fails while the rest loads. The rest keeps working.
- [ ] A retry fails again, or succeeds.
- [ ] Some items come back with missing fields (no name, no date, a deleted person, a removed tier).
- [ ] A number can't be computed (no previous period, a division by zero, a missing rate, mixed currencies). Never `NaN`, never a fake 0.

**Empty**
- [ ] Empty because nothing has ever existed (first-ever use).
- [ ] Empty for this period or this view, while other periods have data.
- [ ] Empty because of the person's search or filters.
- [ ] One region empty while others have data (no gifts this month, no one left).
- [ ] Exactly one item (plurals, layouts that expect more). Many items (500+: paging, counts, totals that grow wide).

**Freshness and connection**
- [ ] Stale data: the source is behind (a sync is late, an outside service is delayed). Say how old it is.
- [ ] An outside service isn't connected or is down (PayPal, email provider).
- [ ] Offline: what stays readable, what is disabled, what waits.
- [ ] Reconnecting: the connection is back and the page catches up.
- [ ] Session expired mid-task: unsaved work survives.

**Access**
- [ ] Page not found (a bad link, a deleted record in the URL).
- [ ] No permission for the page; read-only for the page; one action not allowed.

**Actions**
- [ ] Saving: in flight for a few seconds. No double submit, no layout jump.
- [ ] Save failed: input kept, retry offered.
- [ ] Validation error from the server, on the field.
- [ ] Someone else changed it first.
- [ ] Too many requests.
- [ ] Undo works; undo fails; undo expired.

**Content and size**
- [ ] Long names, emails, tier names and amounts (`$1,234,567`). Nothing overlaps or pushes a control off screen.
- [ ] 360px wide: every state, not only the happy one.
- [ ] Dark mode: status colours and skeletons still read.

**URL**
- [ ] Every state above, and every view (tab, range, filters, open dialog), can be opened from a link (`AGENTS.md` rule 9). A bad value in the URL falls back to the default instead of breaking the page.

## Rules

These come from how Outbox, Automatic emails, People (the member directory) and the kit already handle states. Follow them; if a state needs something they don't cover, ask before inventing a new pattern.

### Layout

1. **Every state keeps the layout.** A region that is loading, empty, failed or unavailable keeps the size and position it has with data, so nothing jumps when the data arrives or a retry works. Cards keep their height; tables keep their header; charts keep their plot area.
2. **A part failing never blanks the page.** Only the region that failed shows the failure. The header, the range picker, the tabs and every other region keep working. A whole-page failure is only for when nothing on the page can be shown.
3. **Loaded content stays on screen while it refreshes.** A filter, range, sort or page change keeps the current content in place, dimmed and marked busy (`Table`'s `busy`, `aria-busy`), until the new content arrives. Skeletons are for the first load only.
4. **Skeletons mirror the real thing.** The page title and controls render for real; placeholder bars sit where the values will be, at the same row rhythm (`PageLoading`). No spinners in the middle of the page. Skeletons are `aria-hidden`; the loading region has `aria-busy` and one visually hidden `role="status"` that says "Loading {thing}" once.
4a. **Slow is the same loading, plus one line.** After about 4 seconds (`useLabLoad`'s `takingLonger`), add the muted line "Still loading. This is taking longer than usual." inside the loading region, and change the hidden status to the same words. Nothing else changes; the rest of the page stays usable.
5. **The way out sits where the problem is.** Retry goes inside the failed region; Clear filters goes inside the filtered-empty table; an inline save error goes next to the thing being saved.

### Numbers

6. **Never render `NaN`, `undefined`, `null`, `Infinity` or `[object Object]`.** Format every number through one helper that returns `null` for anything that isn't a finite number, and design what `null` shows.
7. **A number that can't be computed is unavailable, not 0.** 0 is a real answer ("no gifts this month"); unavailable is "we don't know". Show an em dash (`—`) in the number's place, keep the label, and put the reason one tap away (a short line under it, or a tooltip on the dash) when it isn't obvious. Screen readers hear "Not available", not "dash".
8. **Changes need a real base.** Hide a change mark ("▲ $120") when there is no previous period, the previous value is 0, or either side is unavailable. Never show "+Infinity%" or a change against a period with no data.
9. **Partial numbers say they are partial.** If a total is missing some of its parts (a delayed sync, a failed page of data), show the number with a short note ("Up to Nov 18"), or show it as unavailable. Never show a smaller number as if it were complete.
10. **Counts and plurals are right at 0, 1 and many.** "1 person", "2 people", "No people". Long numbers keep their thousands separators and don't break the layout.

### Failure

11. **Say what couldn't load, in the region, in one line, with Try again.** "Couldn't load payments" plus a `Try again` button: always `$variant="outline" $size="sm"` with a 16px `RotateCw` icon, the same everywhere (not ghost, not secondary, never "Retry"). Add a second line only when it changes what people do ("Everything else here still works", "If it keeps happening, tell an SDC admin"). Never show a raw error, a code or a stack.
    - A list, table or tab body that fails: the kit `EmptyState` with `CircleAlert` inside a `role="alert"` wrapper, header and title kept (Outbox, Automatic emails, People all do this).
    - A small region that fails (a card, a filter's options): a danger-coloured line with `CircleAlert`, the message and Try again, inside the region's frame. Where the line must fit a value's own height (a number card), Try again is the same outline button with only the `RotateCw` icon, `aria-label="Try again"` and a "Try again" tooltip, so the card doesn't grow.
12. **Retry works in place.** Try again turns the region back to its loading state at the same size; success fills it, a second failure shows the same message again. Don't reload the page.
13. **Failures are announced once.** The failure message uses `role="alert"` (or a polite live region for non-blocking ones), and focus stays where it was. Never move focus to an error the person didn't cause.
14. **An outside service problem names the service and the effect.** "PayPal is behind. Payments after Nov 18 aren't here yet." Name who can fix it if it isn't this person.

### Empty

15. **Three kinds of empty, three treatments.**
    - *Never had any* (first use): `EmptyState` with what goes here and the first step. This is the only empty state that may carry a call to action that isn't Clear.
    - *None in this view or period*: plain, no call to action. "No payments in Oct 2026". The controls that would change the view (the range picker) stay visible and usable.
    - *Filtered or searched to nothing*: `listEmptyCopy` from `ListPage`: echo the search, name the filters, and offer Clear search / Clear filters in place.
16. **An empty region is still a region.** A card with nothing to show keeps its frame and label and says so in a few words ("No gifts", "No one left"); a chart with no data keeps its axes and says "No payments in this period" inside the plot.
17. **A real 0 is a value, not an empty state.** "$0 raised" with its label reads as an answer. Use the empty treatment only when there are no rows to count.

### Freshness, connection and access

18. **Stale data shows its age, quietly.** One muted line near what is stale ("Updated 3 hours ago"), with a way to refresh when one exists. Don't hide the data.
19. **Offline keeps content readable and makes actions wait.** A persistent info-tone bar under the page header (`role="status"`, `WifiOff` icon, never danger: nothing is broken): "You're offline. You can still look around, but you'll need to reconnect to make changes". Loaded content stays. Actions that need the server are disabled through `DisabledReason` ("You're offline. Reconnect to {verb}"); anything typed is kept.
19a. **Reconnecting, then one toast.** While catching up, the same bar reads "Reconnecting. Loading the latest changes…" with `RefreshCw`. When the page has caught up, the bar goes and one toast says "Back online". Not two toasts.
20. **Session expired keeps the work.** "You've been signed out. Sign in again in another tab, then try again. Your changes are still here." Actions are disabled with that reason until then.
21. **No permission, not found and read-only replace only what they must.** Not found and no permission replace the page body with an `EmptyState` ("Page not found", "You don't have access to Payments"). Read-only keeps everything visible and disables actions with a reason.

### Actions

22. **In flight: the button shows progress, the rest stays calm.** The button keeps its width and shows a spinner or a progress label ("Matching…"), is `aria-busy`, and ignores repeat clicks; other controls in the dialog are locked. The dialog doesn't jump or close early.
23. **A failure with something to keep is inline; a one-click failure is a toast.** If the person typed or chose something (a dialog, a form, an edit), the dialog stays open and a `role="alert"` note above its buttons says "Couldn't {verb}. Your changes are still here" with Try again. If nothing was typed (a one-click action from the page, like Restore), a toast "Couldn't {verb} {thing}" with a Try again action is fine, because nothing is lost if it's missed.
24. **Success is a toast that names the thing**, past tense, no full stop ("Matched $25 to Ben Khan"), with Undo when the action can be undone. Undoable changes need no confirmation dialog.
25. **Undo has its own failures.** Undo failing: "Couldn't undo. {Thing} is still {state}". Undo expired: "Couldn't undo because the change was already saved", plus what to do instead when there is a way.
25a. **Someone else changed it** is never called a conflict. Say who and what ("Another admin changed this tier's cost to $10"), then two buttons: "Use their version" and "Keep my version".
25b. **Too many requests** is a toast that says when: "Too many changes at once. Try again in 30 seconds".

### Copy

26. **Plain words, no instructions, few full stops.** One line per state. Titles, labels, toasts and one-sentence errors have no full stop. Use the screen's own words ("payments", "people", "spreadsheet"); never "data", "records", "CSV", "error occurred", "something went wrong" or "please".
27. **The same thing has the same words everywhere.** "Couldn't load {thing}", "Try again", "Still loading. This is taking longer than usual.", "No {things} in {period}", "Clear filters", "You're offline", "Back online", "Your changes are still here", "Page not found", "You don't have access to {page}". Check `docs/design/*-copy.md` for the screen's copy file and add new strings to it.
28. **Missing fields get a fallback, never a blank.** "No name" (or the email as the name), "No email", "Deleted person", "Deleted tier". Cut-off text gets a tooltip on the cut-off line itself.

### Where screens disagree today

Outbox, Automatic emails and People grew these patterns separately. Where they differ, the rules above pick one; follow the rules, not the older screen:

- Retry button: outline, small, `RotateCw`, "Try again" (People's ghost and secondary retries and Automatic emails' "Retry" are the odd ones).
- Reconnecting: People's "Reconnecting. Loading the latest changes…" and one "Back online" toast (Outbox shows two toasts).
- Offline: Outbox's way, disabling actions with a reason up front, instead of letting people try and fail.
- Failed saves: inline when there's input to keep, toast only for one-click actions.
- Full stops: none on toasts, titles and one-sentence messages (several Outbox and Automatic emails strings still have them).

The kit has no skeleton or inline alert component yet: Outbox, Automatic emails and People each have their own. Until one lands in `src/components/ui/` (ask the design-system owner), build them from tokens in the screen's folder, matching the rules above, and don't invent a third look.

## Using the lab in code

```tsx
import { useLabLoad, useLabDelay, SAVING_FOR, useStateLab } from "../../_state-lab/useStateLab";

const lab = useStateLab({
  data: [{ id: "numbers-failed", label: "Couldn't load numbers", description: "The numbers fail; the list works." }],
  actions: [{ id: "match-failed", label: "Couldn't match" }],
  notApplicable: ["readOnly", "conflict"],
});

lab.loadFailed; // a general state (typed flags, listed below)
lab.is("numbers-failed"); // a screen state; only declared ids type-check

const load = useLabLoad(lab); // { loading, takingLonger }: Loading, or Slow loading playing a real ~10s delay
const inFlight = useLabDelay(SAVING_FOR, lab.saving); // true for 5s after Saving turns on
```

- **General states**, by group. Page: `loading`, `slowLoading`, `loadFailed`, `empty`, `notFound`, `noPermission`, `sessionExpired`, `offline`, `reconnecting`, `readOnly`. Section: `sectionFailed`, `sectionEmpty`, `partialData`, `staleData`, `manyItems`, `singleItem`, `longText`. Action: `saving`, `saveFailed`, `conflict`, `validationError`, `rateLimited`, `actionDenied`, `undoExpired`.
- **Screen states** (`data`, `actions`) are the ones only this screen has, found in step 1: a specific part failing, a value the backend leaves empty, a row kind that looks different, an RPC's own error, an outside service being down. Give each a short sentence-case label ("Couldn't load gifts") and a one-line description of what to design.
- **`notApplicable`** lists general states that can't happen here. The panel leaves them out, and their flags are always false. Most screens rule out more general states than they keep.
- `useLabDeferred(value, ms)` follows a value after a delay (`{ value, pending }`), for a search or filter that keeps the previous results while it runs (`SEARCH_FOR`, `SLOW_SEARCH_FOR`).
- **Map general states onto the screen.** `sectionFailed` and `sectionEmpty` should hit a real region of the screen (say, the first card), so the general switch does something visible.
- **Keep the lab out of the URL's other state.** The lab writes only `lab=`; the screen's own view state (tab, range, filters, open dialog) stays in its own params, so a link can combine both: `/design/payments?tab=transactions&lab=load-failed`.

The lab is dev only. `src/app/design/layout.tsx` mounts it for every design screen; its code is in `src/app/design/_state-lab/`.
