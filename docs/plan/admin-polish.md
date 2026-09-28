# Plan: admin polish from owner review (26 Sep)

## Decisions
| Area | Decision | Why |
|---|---|---|
| Page header | A compact row: h1 on the left, actions (with icons) on the right. **No page description.** The description moves to a delayed tooltip on the sidebar item. | Optimize for the 10th use. Plain, Shopify and Klaviyo on Mobbin all do this. |
| Toolbar | One row: **tabs on the left, search on the right.** Tab counts reflect the current search. | Plain "Companies" pattern. Search scopes the list, so it sits beside the tabs it filters. |
| Width | Page content fills the available width. No `max-width` on list pages. | Tables use the space on wide monitors. |
| Search | Results update as you type, **300ms after the last keystroke.** Enter searches immediately and × clears. A spinner replaces the search icon while loading. No search button. The URL is updated with `replace` (no history spam). Stale requests are ignored. | NN/g and Algolia guidance for server-backed search. The old inline submit icon looked decorative. |
| Search label | Placeholder "Search by name or email", plus an `aria-label`. No visible label or hint. | Owner decision. The search icon and placeholder are the recognized pattern. AGENTS.md rule 4 gets a search-field exception. |
| Icons | Every button and every menu item gets an icon. A menu's items either all have icons or none do. Tabs and table text have no icons. | NN/g: pair icons with labels on actions; consistency within a menu. |
| Menu separators | 2px above and below. | Owner: the current gap is too large. |
| Tags/badges | Less horizontal padding and `--text-xs`. Pending/warning uses the `-subtle` background with warning text. | Owner: too prominent. |
| General members | The count and table cover **subscribed people only**, paying included. Unsubscribed people are hidden from the list and counts. Search still finds them, marked "Unsubscribed", so admins can answer "why isn't X getting emails?" The tab tooltip: includes paying members, excludes unsubscribed. | Owner: 899 and that's it. The search fallback is an assumption. |
| Member panel | One scrolling view, no tabs. The header shows name, email (copy), status and date added. No avatar. No primary action; actions sit in the ⋯ menu. Emails are listed expanded, each with subject and sent date only, and each body loads when scrolled into view. | Owner: an audit trail of what they received, simplified. |
| Partners IA | Tabs: **Organizations · People · Invitations · Removed.** Pending invitations move to Invitations, with sent and expiry dates, delivery problems, and Resend/Cancel. People shows active contacts only, and the Invitation column is removed. | Invitations are a work queue, and keeping them apart keeps the other lists clean. People blank in 90% of rows don't need a column. |
| Export | "Export members". | Say what is exported. |
