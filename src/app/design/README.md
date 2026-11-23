# Designers' screens

One folder per feature: `src/app/design/<feature>/page.tsx`, open at `/design/<feature>` in `pnpm dev`. Hidden in production builds.

- Admin screens go in `(admin)/<feature>/` and sit inside the real admin sidebar. Design inside the space that's left; don't add your own navigation. A dev adds your screen to the sidebar. Member-facing screens go outside `(admin)` and have no sidebar.
- Same rules as the product (`AGENTS.md`): kit components, tokens, labels, accessibility. `pnpm check` scans these pages too.
- Demo data only, behind typed contracts in the feature's folder. No server actions or database calls.
- Devs build the real feature in `src/app/admin/` by moving code from here, then delete the design copy.
