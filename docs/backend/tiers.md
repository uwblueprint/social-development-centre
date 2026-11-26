# Membership tiers: backend

Migration: `supabase/migrations/20261117000000_membership_tiers.sql`. Code: `src/features/tiers/`.

- **`tiers`**: `id`, `name`, `price_cad` (whole dollars, above 0), `position` (display order), `archived_at`/`archived_by` (soft delete). Unique name among rows where `archived_at is null`. No cap on the number of tiers. Seeded with Gold 50, Silver 25, Bronze 10.
- **`memberships.tier_id`** (nullable, no cascade) and `tier_chosen_at`.
- Writes go through `security definer` functions: `add_tier`, `update_tier`, `archive_tier`, `reorder_tiers`, `tier_members` (admins only, `42501` otherwise) and `list_offered_tiers`, `my_tier_id`, `choose_tier` (members). Admins read `tiers` directly through RLS.
- `choose_tier` returns `chosen`, `already_chosen` or `unavailable`. A member picks once.
- Server actions: `addTier`, `updateTier`, `deleteTier`, `reorderTiers`, `getTierMembers` (admin) and `chooseTier` (member).

- Choosing a tier writes a `tier_chosen` row to `member_events` (with `tier_id` and `tier_name`, kept so history reads right after a rename or delete). It appears on the member timeline with the tier's name in `body`. Automatic Emails ignores it for now.
- Reordering in Settings uses the `SortableList` kit component (numbered rows; drag by the handle, or Up/Down on the focused handle).

## Not built yet
- A tier is not yet shown on the member's page in the directory, and nothing charges it.
