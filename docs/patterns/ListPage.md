# ListPage

The layout for a portal section that is mostly one list: a compact header row (title, search, actions), then the tabs, then the table. Used by Opportunities, Partners and Community (admin), and Opportunities (partner). The partner Organization page uses the header only.

## Use when / Don't use when
- A top-level section whose main job is scanning, searching and opening items in a list or table.
- A form or settings page: use your own column, but you can still use `ListPageHeader` so page titles match across the portal.
- Don't nest a second `ListPage` inside a sheet or dialog.

## API
```tsx
import {
  ListPage, ListPageHeader, ListPageToolbar, ListEmptyState, listEmptyCopy, useListParams, useListSearch, useListSort,
} from "@/components/patterns/ListPage";
```
- `ListPage`: the page body. Full width, **no `max-width`**, so tables use wide monitors. Padding `--space-5`/`--space-6` (`--space-4` under 768px); 16px (`--space-4`) between the header and each block (owner: 16px max, product-wide).
- `ListPageHeader({ title, search?, actions?, results? })`: an `h1` in `--text-lg` medium on the left; on the right, `search` (a `SearchField`) at a fixed `--search-width` (280px) just left of the `actions`. When the header is narrower than 640px, the search wraps to its own full-width row under the title and actions. No description: what the section is for lives in the sidebar item's `description` tooltip. `results: { query, count, pending }` (the server's `q`, the rows it matched in the current view, and `useListSearch`'s `pending`) adds a polite live region that announces "{n} results" or "No results" once a search settles. Nothing is announced on first load or while the search is loading.
- `ListPageToolbar({ tabs, results? })`: the tabs only, full width. Render it inside `<Tabs>` and pass the `TabsList`. `results` works as on the header; pass it in one place. Its `search` prop is deprecated and ignored.
- **Why search is in the header:** search filters the whole page across tabs (tab counts follow it, and `ListEmptyState` points to matches in other tabs), so it belongs with the page, not with one tab's toolbar.
- `ListEmptyState(props)`: the list's empty state, tailored to why it's empty. Pass it as the `Table`'s `empty`. See below.
- `listEmptyCopy`: every string the pattern writes itself (no-results titles, bodies, button labels, announcements). The owner edits them there.
- `useListParams()`: `{ setParams(next), pending }`. Replaces URL params with `router.replace` inside a transition and keeps every param it isn't given. `undefined` or `""` removes a param.
- `useListSearch(q)`: `{ value, setValue, search, pending }` for the page's `SearchField`, where `q` is the server's current search. `search` writes `?q=`, removes `?page=` (back to page 1) and keeps the rest. If `q` changes from outside (back/forward, "Clear filters") the field follows it; a result for an older search never overwrites newer typing.
- `useListSort(fallback?)`: `{ sort, setSort, pending }` for the page's `Table` (pass them as `sort` and `onSortChange`). Reads the `sort` (a column's `sortKey`) and `dir` (`asc` | `desc`) URL params; `setSort` writes both with `router.replace`, removes `?page=` (back to page 1) and keeps the rest. `fallback` is the server's default order: it shows as active when the URL has no sort, and choosing it removes the params. The server reads the same two params, checks `sort` against its own list of sortable columns (ignore anything else) and sorts before paginating.

## Example
```tsx
const { setParams } = useListParams();
const search = useListSearch(q);
const { sort, setSort } = useListSort({ key: "name", direction: "asc" });

<ListPage>
  <ListPageHeader
    title="Partners"
    search={
      <SearchField
        aria-label="Search by name or email"
        placeholder="Search by name or email"
        value={search.value}
        onChange={(event) => search.setValue(event.target.value)}
        onSearch={search.search}
        pending={search.pending}
      />
    }
    results={{ query: q, count: rows.length, pending: search.pending }}
    actions={
      <Button type="button" onClick={openInvite}>
        <Icon icon={UserPlus} size={16} />
        Invite partner
      </Button>
    }
  />
  <Tabs value={tab} onValueChange={(next) => setParams({ tab: next })}>
    <ListPageToolbar tabs={<TabsList aria-label="Partner views">…</TabsList>} />
    <TabsContent value={tab}>
      <Table columns={columns} rows={rows} getRowId={(p) => p.id} sort={sort} onSortChange={setSort} />
    </TabsContent>
  </Tabs>
</ListPage>
```

## ListEmptyState

An empty or error state says what's empty, why, and the one action that fixes it. `ListEmptyState` picks one of five variants from its props, in this order:

| Variant | When | Title | Body | Button |
|---|---|---|---|---|
| Matches elsewhere | `query`, and `elsewhere.count` > 0 | No {items} match “{query}” | {n} matches in {scope} | Show in {scope} |
| Search plus filters | `query` and `filtered` | No {filtered} match “{query}” | Searched {searchedFields} with these filters on. Check the spelling, or clear the search and filters. | Clear search and filters |
| No matches anywhere | `query` | No {items} match “{query}” | Searched {searchedFields}. Check the spelling, or clear the search. | Clear search |
| Filters hide everything | `filtered` | No {filtered} | Nothing matches these filters. | Clear filters |
| Truly empty | none of the above | the caller's `empty.title` | `empty.description` | `empty.action` (optional) |

Props:
- `items`: what the list holds, plural and lowercase as it reads mid-sentence ("members", "paying members").
- `query`: the server's current `q`. `searchedFields`: what search looks in ("names and emails").
- `elsewhere?: { count, scope, onShow }`: the same search's matches in another tab or view. Use the per-tab counts the page already computes with the search; `scope` is the other tab's label. Optional `body` replaces "{n} matches in {scope}" when the page knows more: Community's Paying tab says when its only matches are unsubscribed people at the end of General members.
- `filtered?`: the active filters described as the items they'd show, e.g. "closed jobs from Northside Food Bank". Omit it when no filter is on.
- `onClearSearch`, `onClearFilters`, `onClearSearchAndFilters`: each clears in one URL update (`setParams({ q: undefined, page: undefined })` and so on). Clearing both needs its own handler, because two `setParams` calls in a row overwrite each other.
- `empty: { icon, title, description?, action? }`: the truly empty state, in the caller's words.

The buttons remove the empty state, so the caller moves focus somewhere sensible after them (Community focuses the search field).

```tsx
<Table
  …
  empty={
    <ListEmptyState
      items={tab === "paying" ? "paying members" : "members"}
      query={q}
      searchedFields="names and emails"
      onClearSearch={clearSearch}
      elsewhere={tab === "paying" ? { count: counts.general, scope: "General members", onShow: showGeneral } : undefined}
      empty={{ icon: UsersRound, title: "No paying members yet", description: "…", action: addMemberButton }}
    />
  }
/>
```

## Error boundaries

Each portal section has an `error.tsx` that renders `RouteError` (`src/components/patterns/RouteError.tsx`). It is centred vertically and horizontally in the content area, like the 404: an alert icon (where the 404 has its illustration), an `h1` "We couldn't load {section}.", "Your data is safe; this is a loading problem.", and an escalation sentence for when it keeps happening, in the same paragraph, then **Try again** (Next's `retry`, which fetches the segment again). Admins see "If it keeps happening, email {BSF_SUPPORT_EMAIL}." (`src/lib/contact.ts`); partners see "If it keeps happening, tell an SDC admin." The boundary requires `escalation`, so a new section can't ship without one. It never shows the raw error. Strings live in the area's copy file (Community: `communityCopy.loadError`) or in `src/lib/errorCopy.ts`.

Opportunity edit pages call `notFound()` for a missing id, which renders `[id]/not-found.tsx` with a 404 status.

## Rules
- Every header button has a leading icon and a verb label ("Add members", "Export members", "Invite partner", "New opportunity").
- Tab counts reflect the current search: compute them on the server with the same `q` as the rows.
- Filters beyond search (type, organization) go in a row at the top of the tab content, with visible `Field` labels.
- One primary button per header at most; others are `secondary`.
- Sort on the server with the same `sort`/`dir` as the rows, then paginate. Changing the sort goes back to page 1; the search, tab and filters stay.

## Accessibility
- One `h1` per page, from `ListPageHeader`.
- The search field is a `role="search"` landmark with an `aria-label`; the tabs keep their `aria-label`.
- Focus order is title area, search, actions, then tabs. At full width the visual order matches; below 640px the search sits on its own row under the actions, the one place visual order and focus order differ (search is still the first control).
- Search results are announced politely through `ListPageHeader`'s (or `ListPageToolbar`'s) `results`, not by moving focus.
- `ListEmptyState` is plain text plus one button with a leading or trailing icon and a verb label; the icon above the title is decorative.

Motion: everything under the header animates in (`contentIn`: fade plus an 8px rise) when the page mounts after its loading state. The header stays put so the title never moves; `PageLoading` (aria-busy) doesn't animate.
