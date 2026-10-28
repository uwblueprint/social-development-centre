# Designers' screens

One folder per feature: `src/app/design/<feature>/page.tsx`, open at `/design/<feature>` in `pnpm dev`. Hidden in production builds.

- The layout here draws a blank block where the sidebar will go. Design inside the space that's left; don't add your own navigation.
- Same rules as the product (`AGENTS.md`): kit components, tokens, labels, accessibility. `pnpm check` scans these pages too.
- Demo data only, behind typed contracts in the feature's folder. No server actions or database calls.
- Devs build the real feature in `src/app/admin/` by moving code from here, then delete the design copy.

## State lab

Every `/design/*` screen has a floating **State lab** button at the bottom left. It opens a panel of switches for edge cases. The lab changes nothing on the page: each switch only sets a flag, and your screen reads the flag and decides what that state looks like. Active states are stored in the URL (`?lab=offline,empty`), so a combination can be shared as a link.

Groups, in this order, on every screen:

- **Connection:** Offline
- **Data:** Loading, Empty, Couldn't load, Long text, then the screen's own data states
- **Actions:** the screen's own action states (hidden when there are none)
- **Access:** Page not found, No permission

Declare the screen's own edge cases with the hook (in a client component):

```tsx
const lab = useStateLab({
  data: [{ id: "numbers-failed", label: "Couldn't load numbers" }],
  actions: [{ id: "create-failed", label: "Couldn't create link" }],
});

lab.offline; lab.loading; lab.empty; lab.loadFailed; lab.longText; lab.notFound; lab.noPermission;
lab.is("create-failed"); // only ids you declared type-check
```

Import it from `../_state-lab/useStateLab`. A screen that doesn't call the hook still shows the general states.

**Rule:** every design screen declares its page-specific edge cases and designs every state it lists. List the smallest set that can really happen on that screen, not every possible one. Write each label as a short sentence-case name ("Couldn't create link").
