# PM prototypes

One folder per idea: `src/app/prototypes/<name>/page.tsx`, open at `/prototypes/<name>` in `pnpm dev`. Hidden in production builds.

- For scoping and testing ideas with the team and the client. Throwaway: the design isn't final and nothing here ships.
- Never import from this folder in `src/app/admin/` or `src/app/design/`. Copy what's useful instead.
- Demo data only.
- Delete a prototype once its feature is built.
