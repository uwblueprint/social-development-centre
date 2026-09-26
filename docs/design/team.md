# How the team keeps the UI good

For designers, product owners and engineers. Evidence and sources: [research.md](./research.md).

## Ownership
- **Name one design-system owner** (can rotate each quarter). They review every change to `src/components/ui/`, `tokens.ts` and `docs/`. A system without an enforcer erodes within a few releases ([NN/g](https://www.nngroup.com/articles/design-system-enforcer/)).
- Every component has a named owner and a changelog entry when it changes.

## Decisions
- New component, new token, or a second way to do something that exists: bring it to the owner first. Default answer is "compose what we have."
- Write down the *why* for every constraint (why one accent, why small radii). Constraints without reasons get quietly undone.
- Product owners supply the copy AI agents must not invent: disabled reasons, error messages, empty states.

## Rituals
- **Weekly 30-minute design/product/eng sync** to unblock component and pattern decisions quickly (Ramp's "jam session" habit).
- **Critique against the checklist, not taste:** states covered (loading, empty, error, disabled), content rules, keyboard path, contrast, 360px width.
- **Monthly UI audit:** walk the live product, log inconsistencies, and fix the component or pattern, not just the screen.

## Working with AI agents
- Point agents at `AGENTS.md`; it's the contract. When an agent asks for a disabled reason or copy, answer it or explicitly say "skip."
- Review AI-built flows on `/components` and in the browser, not just in the diff. Try them with only the keyboard.
- When an agent keeps making the same mistake, fix the rule, the types or the lint config so it can't happen again. Don't just correct the output.

## Testing with real people
- Our users include first-time and occasional visitors, people on older phones, and people using assistive technology. Test with them each quarter; don't assume the fluency of tools like Linear.
