# Members: product decisions

Decisions behind the interim Members page (`/admin/community`). The Member Directory replaces it; its
decisions are in [directory.md](directory.md).

## 1. One kind of member, no paid tier
- **Decision (Jesse, 21 Oct 2026, following the Decision Log of 6 Oct: "Membership and email subscription are separate states"):** there is no general/paying split. Everyone with a membership is a member and can sign in at `/login`. The **Paying members** page became **Members**.
- **Why:** the platform doesn't take or track payments (Auth Requirements), and complimentary Ride for Refuge members are members too. Donors are tagged instead ("$1,000+", "Paid 2026"), which Automatic Emails can read. Email subscription is its own state and never ends a membership.
- **Data:** existing general members stay members.
- **Status:** the Decision Log marks this "Needs validation" with SDC. If SDC wants a paid tier back, it returns as a tag or a column, not a second kind of member.

## 2. Adding a member emails a sign-in link
- **Decision (Jesse, 8 Oct 2026):** **Add member** sends the standard "Your SDC sign-in link" email (valid 1 hour; they can ask for another on the sign-in page).
- **Why:** it's the only email we can send today. It stands in for a designed welcome email, which needs the Send Email Hook (see [../auth.md](../auth.md#not-built-yet)).
- **Page:** Admin → Members → Add a member.

## 3. One form adds
- **Decision (8 Oct 2026):** the form takes **Full name** (optional) and **Email address**. A new address joins SDC's list as a member; someone already a member gets "This person is already a member." and nothing changes. An existing name is never overwritten.

## 4. Removing a member keeps them on the list
- **Decision (21 Oct 2026):** **Remove** asks "Remove {name} as a member?" and ends their membership. They stay on SDC's list with their tags, tag history and email subscription, and lose the members' area on their next page load. Adding them again starts a new membership with a new join date. No email yet.

## 5. Rows show sign-in status
- **Decision (assumption, 8 Oct 2026):** like Admins, each row shows **Invited** (hasn't signed in yet, with **Resend link**) or **Active** (has signed in). The Member Directory's own columns replace these when it lands.
- **No search yet:** about 150 members fit on one A–Z page. Revisit if the list outgrows that.
