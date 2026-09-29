# PageLoading

A route's loading state: the page title (or a bar when it isn't known) above placeholder rows, marked `aria-busy` with a polite "Loading" status.

## Use when
- Every route that reads data gets a `loading.tsx` returning `<PageLoading title={…} />`. Without one, Next keeps the old page on screen until the new one is ready, so a sidebar click looks ignored.
- `narrow` for centred 640px pages (Organization). The title uses the real `ListPageHeader`, so it sits exactly where the loaded page puts it.

## Where
- `src/app/admin/loading.tsx` and `src/app/partner/loading.tsx` cover any page without its own.
- Community, Partners, Organization and both Opportunities lists have titled ones.
