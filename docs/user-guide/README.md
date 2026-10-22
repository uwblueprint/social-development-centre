# User guide

How to get things done in the Social Development Centre product, organized by task. This is the source for end-user documentation.

**Frozen until just before launch.** The product is still changing, so guides would go stale and cost time to maintain. Don't add or edit guides for now; the Documentation tab stays empty. Before launch, write the guides once from the finished screens and run `pnpm docs:screenshots` (point the script at the new pages first).

## Writing rules
- One section per task, titled as the goal: "Invite a partner", not "Invite dialog".
- Numbered steps naming exactly what to click, using the on-screen labels in **bold**.
- Say what happens after, and what the person will see if something goes wrong.
- Plain language, no internal terms. Mention who can do it if it's limited (e.g. SDC admins only).
- Screenshots in `img/` are generated with `pnpm docs:screenshots`; rerun it after UI changes (run it locally for the production font, since some sandboxes block Fontshare and fall back to Geist).

## Members and supporters
- [Fill in the intake form](./intake-form.md)
