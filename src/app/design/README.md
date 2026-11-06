# Designers' screens

One folder per feature, open at `/design/<feature>` in `pnpm dev`. Hidden in production builds. Admin screens go in `(admin)/<feature>/page.tsx`; member-facing screens (no nav, one centered column) go in `(member)/<feature>/page.tsx`. The group names aren't part of the URL.

- Admin screens: the `(admin)` layout draws a blank block where the sidebar will go. Design inside the space that's left; don't add your own navigation. Navigation is always a left sidebar, no top nav. Member pages have no nav at all.
- Same rules as the product (`AGENTS.md`): kit components, tokens, labels, accessibility. `pnpm check` scans these pages too.
- Demo data only, behind typed contracts in the feature's folder. No server actions or database calls.
- Devs build the real feature in `src/app/admin/` by moving code from here, then delete the design copy.
