# Designers' screens

One folder per feature, open at `/design/<feature>` in `pnpm dev`. Hidden in production builds. Admin screens go in `(admin)/<feature>/page.tsx`; member-facing screens (reached from an email or a public link, no navigation) go at the top level, `<feature>/page.tsx`. The group name isn't part of the URL.

- Admin screens: the `(admin)` layout draws a blank block where the sidebar will go. Design inside the space that's left; don't add your own navigation. Member-facing pages have no nav at all.
- Same rules as the product (`AGENTS.md`): kit components, tokens, labels, accessibility. `pnpm check` scans these pages too.
- Demo data only, behind typed contracts in the feature's folder. No server actions or database calls.
- Devs build the real feature in `src/app/admin/` by moving code from here, then delete the design copy.
