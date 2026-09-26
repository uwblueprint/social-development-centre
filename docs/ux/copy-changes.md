# Copy changes for review

Audit of user-facing strings in `src/app/**` and `src/features/**` against the copy principles: familiar words that describe the action, no technical terms admins wouldn't know, and one term per person, object, action and status across both portals. Changes were kept to clear violations and inconsistencies. Nothing was reworded for taste.

## Changed

| # | Old | New | Where | Why |
|---|-----|-----|-------|-----|
| 1 | Open navigation (menu button's accessible name) | Open menu | `src/components/patterns/Sidebar.tsx` | Shell spec. "Menu" is the everyday word for this. |
| 2 | (none) | Close menu (new X button in the mobile drawer) | `src/components/patterns/Sidebar.tsx` | Shell spec: the drawer needs a visible close button. |
| 3 | "{n} new" (screen-reader name of the sidebar count badge) | the number only | `src/components/patterns/Sidebar.tsx` | "New" guessed what the count means. The section's page must now say what it counts. |
| 4 | Pending (organization badge on Organizations tab and in the side panel; person badge on People tab and under Contacts) | Invitation pending | `src/app/admin/partners/_components/PartnerRows.tsx`, `PartnerSheetContent.tsx`, `ContactRow.tsx` | The partner portal calls the same state "Invitation pending". The new wording also says what's pending. |
| 5 | "…returns {org} to the current list as Pending." (reinvite confirmation) | "…returns {org} to the current list, marked Invitation pending." | `src/app/admin/partners/_components/PartnerSheetContent.tsx` | Same status word as #4. |
| 6 | "{org} was reinvited. It shows as Pending until someone accepts." | "…It shows as Invitation pending until someone accepts." | `src/app/admin/partners/_data/actions.ts` | Same status word as #4. |
| 7 | "This is the organization's only contact. Remove the organization instead." (tooltip, screen-reader hint and server error) | "…Remove the organization's access instead." | `src/app/admin/partners/_components/ContactRow.tsx`, `src/app/admin/partners/_data/contacts.ts` | The action is labelled **Remove access** ("Remove {org}'s access?"). "Remove the organization" pointed to a button that doesn't exist. |
| 8 | "View subscribers and paying members, add people and manage their access." (Community page description) | "View general and paying members, add people and manage their access." | `src/app/admin/community/_copy.ts` | The tabs call these people "General members". "Subscribers" was a second name for them. |
| 9 | Restore email eligibility (disabled ⋯ menu item) | Resubscribe | `src/app/admin/community/_copy.ts` | "Eligibility" is system language. This is the opposite of **Unsubscribe**, and its own disabled reason already says "resubscribing". |
| 10 | Revoked (email type in a member's Emails tab) | Paying access removed | `src/app/admin/community/_copy.ts` | Owner's rule: "Remove access" over "Revoke". It matches the **Remove paying access** action that sends this email. |
| 11 | "Only subscribed general members can be given paying access." | "Only subscribed general members can be converted to paying members." | `src/app/admin/community/_data/actions.ts` | The action was renamed **Convert to paying member** (decisions/community.md). This error still used the old verb. |
| 12 | Raw Supabase error on the login page (e.g. "Signups not allowed for otp") | "We couldn't send a sign-in link. Check the email address, wait a minute, then try again." | `src/app/login/actions.ts`, `src/app/login/page.tsx` | Technical text people can't act on. The raw detail is still logged on the server. |

User guide updated to match #1–2, #4–7 and #9 (`admin-getting-around.md`, `partner-getting-started.md`, `admin-partners.md`, `admin-community.md`), plus `docs/patterns/SidebarLayout.md`.

## Flagged, not changed (needs an owner decision)

- **"People" tab and "Add person" vs "Contacts".** Admin Partners uses three names for the same people: the **People** tab, the **Contacts** section and column, and the **Add person** button. The partner portal calls them its **Team**, which is fine from their side. "People" and "Add person" come from decisions/partners.md #4, so renaming them (e.g. to **Contacts** and **Add contact**) is a product decision.
- **"Create" in the organization picker.** The invite dialog says "Search or create an organization…" and the kit's `CreatableCombobox` offers `Create "<name>"`. The owner prefers "Add" over "Create". Changing it means editing the kit component's copy, which needs the design-system owner.
- **"the feed".** "Closed. It won't appear in emails or the feed." No screen explains what the feed is. Partner removal says "stop being recommended" for what may be the same thing. One term is needed.
- **"expire" vs what Opportunities shows.** The Remove access confirmation, its toast and the Reinvite confirmation say a removed partner's opportunities "expire". Opportunities shows the same listings as **No longer emailed**, and then **Partner removed** under Closed (`removedPartner` in `src/features/opportunities/copy.ts`). Its other statuses are **Ended** and **Closed**. Nothing on screen says "expired". Pick one word for this state and use it in both places.
- **"Upgrade" email type.** The action is **Convert to paying member**, but its email is listed as **Upgrade** (and the toast says "Upgrade email sent."). This is left as the email's name in docs/emails. Align it if one verb should cover both.
- **"Bounced"** badge in a member's Emails tab. This is email jargon. "Not delivered" is plainer if admins don't know "bounced".
- **Login email field** uses a placeholder with `aria-label` instead of a visible label (hard rule 4). This isn't a copy change. `Field` is a client render-prop component, so the fix needs a small client form component.
- `docs/decisions/partners.md` still says "Pending badge" in decisions #2 and #5. It should now say **Invitation pending** if you accept #4.
- **Not copy, but blocks `pnpm check`:** the axe test fails on `/admin/opportunities/new?kind=event` (`aria-allowed-attr`). The kit's `Select` trigger is a `<button>` carrying `aria-required` (`src/components/ui/Select.tsx`, added in a2a126f). None of the changes above caused it. The fix is a kit change, which needs the design-system owner.
