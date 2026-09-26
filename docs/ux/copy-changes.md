# Copy changes for review

Open questions from the audit of user-facing strings in `src/app/**` and `src/features/**` against the copy principles: familiar words that describe the action, no technical terms admins wouldn't know, and one term per person, object, action and status across both portals. Each needs an owner decision.

## Open questions

- **"People" tab and "Add person" vs "Contacts".** Admin Partners uses three names for the same people: the **People** tab, the **Contacts** section and column, and the **Add person** button. The partner portal calls them its **Team**, which is fine from their side. "People" and "Add person" come from decisions/partners.md #4, so renaming them (e.g. to **Contacts** and **Add contact**) is a product decision.
- **"Create" in the organization picker.** The invite dialog says "Search or create an organization…" and the kit's `CreatableCombobox` offers `Create "<name>"`. The owner prefers "Add" over "Create". Changing it means editing the kit component's copy, which needs the design-system owner.
- **"the feed".** "Closed. It won't appear in emails or the feed." No screen explains what the feed is. Partner removal says "stop being recommended" for what may be the same thing. One term is needed.
- **"expire" vs what Opportunities shows.** The Remove access confirmation, its toast and the Reinvite confirmation say a removed partner's opportunities "expire". Opportunities shows the same listings as **No longer emailed**, and then **Partner removed** under Closed (`removedPartner` in `src/features/opportunities/copy.ts`). Its other statuses are **Ended** and **Closed**. Nothing on screen says "expired". Pick one word for this state and use it in both places.
- **"Upgrade" email.** The action is **Convert to paying member**, but its toast says "Upgrade email sent." and docs/emails names it **Upgrade**. Align it if one verb should cover both.
- **"Bounced"** badge in the member panel's Emails list. This is email jargon. "Not delivered" is plainer if admins don't know "bounced", and admin Partners now uses **Not delivered** for a failed invitation email.
- **Login email field** uses a placeholder with `aria-label` instead of a visible label (hard rule 4). This isn't a copy change. `Field` is a client render-prop component, so the fix needs a small client form component.
- `docs/decisions/partners.md` still says "Pending badge" in decisions #2 and #5. The badge now says **Invitation pending**.
