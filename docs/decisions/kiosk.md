# Booth kiosk: decision log

Decisions and assumptions behind `/kiosk`, the tablet sign-up page for SDC booths. Each can be revisited. All kiosk copy is new and needs approval.

## 1. Why a kiosk
- **Decision:** Booths (Kitchener Market and similar) are one of the main ways people join the email list ([community member](../users.md#community-member-subscriber)). A tablet page lets people add themselves straight into Community, instead of a paper sheet an admin retypes or imports later.
- **Scope:** Name and Email only. It adds a general member; it is not a second SDC registration form for events, and it collects nothing beyond what the email list needs.

## 2. Where it lives and who can open it
- **Decision:** Route `/kiosk`, opened by an admin from Community in a new tab. It uses the admin session (`getCurrentAdmin`) and redirects to `/login` without one; the submit action checks again. No admin sidebar, so members at the booth can't reach admin pages from the screen.
- **Location:** `?location=Kitchener Market` is optional, set in the **Open sign-up kiosk** dialog, and passed to `addBoothSignup` so admins can see where someone signed up (Members export only). Trimmed and capped at 80 characters. **Changed 27 Sep:** it's no longer shown on the page; the "Social Development Centre · {location}" line above the heading is gone.
- **Assumption:** The admin stays near the tablet. The page doesn't lock the browser; closing the tab or using the address bar still reaches the admin portal on that device.

## 3. When people meet it
- **Sign up:** one screen with a short heading ("Get involved with your community") and one muted paragraph, then Name, Email and **Sign me up**. **Changed 27 Sep:** the intro is shorter and set smaller (heading 19px medium, body 16px muted) so the form leads; "about one email a month" is dropped. Errors show inline under each field and keep what was typed.
- **Confirmation:** "You're in, {first name}! Check {email} for a welcome email." with **Next person**. Focus moves to the heading. **Changed 27 Sep:** the layout doesn't change: the intro stays and the confirmation takes the form's place (two columns on wide landscape tablets, one column otherwise, as before). The whole screen tints to `--color-success-subtle`, with a check icon and the text, so success never relies on color alone.
- **Reset:** after 20 seconds, shown as "Starting over in 20s". Any touch or keypress pauses the countdown (WCAG 2.2.1, timing adjustable); **Next person** then resets. After a reset, focus goes to Name.
- **Sizing:** 19px text (`--text-lg`) and 48px targets (`--space-7`), portrait and landscape (two columns on wide landscape tablets), down to 360px wide. On phones the content starts at the top so both fields are visible without scrolling; tablets center it.
- **On-screen keyboard (27 Sep):** the page uses `dvh` and is never scroll-locked. The viewport sets `interactive-widget=resizes-content`, and a focused field is scrolled to the middle of the screen (`scrollIntoView({ block: "center" })`) on focus and again once the keyboard has opened, so the keyboard never hides it.

## 4. Privacy
- **No membership disclosure:** an email that's already on the list gets the same confirmation, and nothing new is saved or sent. The next person in line can't learn who is a member.
- **Nothing lingers:** each reset remounts the form, clearing the last person's name and email from the page. Inputs set `autocomplete="off"` so the browser doesn't suggest the previous person's details.
- **Only what email needs:** name, email, booth location and sign-up time. The intro says what the details are used for.

## 5. Greeting by first name
- **Decision (27 Sep):** the confirmation greets people by first name, worked out from what they typed in Name (`src/app/kiosk/firstName.ts`, tested in `tests/kiosk-first-name.spec.ts`): trim; "Last, First" reads as First; skip leading honorifics, any case, with or without a period (Mr, Mrs, Ms, Mx, Miss, Dr, Prof, Rev, Sir, Madam, Fr, Sr); take the first remaining word; capitalize its first letter only if the whole name was typed in lowercase. If nothing is left, use the full name as typed. The full name is still what's saved.

| Typed | Greeting |
|---|---|
| `  Jane Smith  ` | Jane |
| Smith, Jane | Jane |
| Dr. Jane Smith | Jane |
| dr jane smith | Jane |
| MRS. Amara Okafor | Amara |
| Prof Rev Kim Lee | Kim |
| Okafor, Mx. Sam | Sam |
| jean-luc | Jean-luc |
| de la Cruz | de (not all lowercase, so left as typed) |
| JANE | JANE |
| Smith, | Smith |
| Dr. | Dr. (nothing left, so the full input) |
| Madame Curie | Madame (only the listed titles are skipped) |

## Open questions
- Should a booth signup that matches someone who unsubscribed themselves resubscribe them? The assumption is no: they see the same confirmation and stay unsubscribed until they resubscribe by email link. Confirm with SDC.
- The kit's largest control is 44px with 16px text; the kiosk scales kit components with tokens. If other touch screens appear, consider an `xl` Button and Input size in the kit (design-system owner).

## Poster layout (28 Sep 2026)
**What:** The heading sits in a large solid block, left of the form on screens 900px or wider (any orientation) and above it on narrower ones. The fields don't show "(required)": both are required, and the error says so.
**Why:** People pass the kiosk in a busy space; the ask has to land in about two seconds.
Below 900px (owner, 28 Sep): no poster. A plain heading and a shorter, muted intro sit in the form's column, then a 48px gap, then the fields.
Success (owner, 28 Sep): its own centred screen (no sign-up heading) on the success tint, with a confetti burst in token colors; skipped for reduced motion.
Wide kiosk (owner, 28 Sep): the poster is full height and the heading uses --text-xl, not the display size. Both intros say people can unsubscribe at any time.
