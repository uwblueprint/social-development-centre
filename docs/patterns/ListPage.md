# ListPage

The layout for a portal section that is mostly one list: a compact header row, then tabs and search in one toolbar row, then the table. Used by Opportunities, Partners and Community (admin), and Opportunities (partner). The partner Organization page uses the header only.

## Use when / Don't use when
- A top-level section whose main job is scanning, searching and opening items in a list or table.
- A form or settings page: use your own column, but you can still use `ListPageHeader` so page titles match across the portal.
- Don't nest a second `ListPage` inside a sheet or dialog.

## API
```tsx
import {
  ListPage, ListPageHeader, ListPageToolbar, useListParams, useListSearch,
} from "@/components/patterns/ListPage";
```
- `ListPage`: the page body. Full width, **no `max-width`**, so tables use wide monitors. Padding `--space-5`/`--space-6` (`--space-4` under 768px).
- `ListPageHeader({ title, actions? })`: an `h1` in `--text-lg` medium on the left, `actions` on the right. No description: what the section is for lives in the sidebar item's `description` tooltip.
- `ListPageToolbar({ tabs, search? })`: tabs on the left, search on the right, one row with one line under both. Render it inside `<Tabs>` and pass the `TabsList` and a `SearchField`. When the toolbar is narrower than 560px (360px phones, or a crowded tab list), the search wraps to its own full-width row under the tabs.
- `useListParams()`: `{ setParams(next), pending }`. Replaces URL params with `router.replace` inside a transition and keeps every param it isn't given. `undefined` or `""` removes a param.
- `useListSearch(q)`: `{ value, setValue, search, pending }` for the page's `SearchField`, where `q` is the server's current search. `search` writes `?q=`, removes `?page=` (back to page 1) and keeps the rest. If `q` changes from outside (back/forward, "Clear filters") the field follows it; a result for an older search never overwrites newer typing.

## Example
```tsx
const { setParams } = useListParams();
const search = useListSearch(q);

<ListPage>
  <ListPageHeader
    title="Partners"
    actions={
      <Button type="button" onClick={openInvite}>
        <Icon icon={UserPlus} size={16} />
        Invite partner
      </Button>
    }
  />
  <Tabs value={tab} onValueChange={(next) => setParams({ tab: next })}>
    <ListPageToolbar
      tabs={<TabsList aria-label="Partner views">…</TabsList>}
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
    />
    <TabsContent value={tab}>…</TabsContent>
  </Tabs>
</ListPage>
```

## Rules
- Every header button has a leading icon and a verb label ("Add members", "Export members", "Invite partner", "New opportunity").
- Tab counts reflect the current search: compute them on the server with the same `q` as the rows.
- Filters beyond search (type, organization) go in a row at the top of the tab content, with visible `Field` labels.
- One primary button per header at most; others are `secondary`.

## Accessibility
- One `h1` per page, from `ListPageHeader`.
- The search field is a `role="search"` landmark with an `aria-label`; the tabs keep their `aria-label`.
- Visual order matches focus order at every width: tabs, then search.
