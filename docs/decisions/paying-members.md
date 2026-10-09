# Paying members: product decisions

Decisions behind the interim Paying members page (`/admin/community`). When the full Community page lands, its [decisions](https://github.com/uwblueprint/social-development-centre/blob/stack/10-community/docs/decisions/community.md) take over; the rules below match them so the data carries over.

## 1. Adding a paying member emails a sign-in link
- **Decision (Jesse, 8 Oct 2026):** **Add paying member** sends the standard "Your SDC sign-in link" email (valid 1 hour; they can ask for another on the sign-in page).
- **Why:** it's the only email we can send today. It stands in for the designed "Paying membership added" and paying welcome emails, which need the Send Email Hook (see [../auth.md](../auth.md#not-built-yet)).
- **Page:** Admin → Paying members → Add a paying member.

## 2. One form adds or upgrades
- **Decision (8 Oct 2026, follows Community decisions 2 and 8):** the form takes **Full name** (optional) and **Email address**. A new address joins SDC's list as a paying member; a general member becomes paying; someone already paying gets "This person is already a paying member." and nothing changes. An existing name is never overwritten.

## 3. Removing paying access keeps them on the list
- **Decision (8 Oct 2026, follows Community "Remove paying access"):** **Remove** asks "Remove paying access for {name}?" and makes them a general member. They stay on SDC's list and lose the members' area on their next page load. No email yet (the designed "Paying access removed" email needs the Send Email Hook).

## 4. Rows show sign-in status, not Community status
- **Decision (assumption, 8 Oct 2026):** like Admins, each row shows **Invited** (hasn't signed in yet, with **Resend link**) or **Active** (has signed in). The Community page's statuses, where Active means "clicked recently", replace these when it lands.
- **No search yet:** about 150 paying members fit on one A–Z page. Revisit if the list outgrows that.
