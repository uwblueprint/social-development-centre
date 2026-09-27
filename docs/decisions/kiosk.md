# Booth kiosk: decision log

Decisions and assumptions behind `/kiosk`, the tablet sign-up page for SDC booths. Each can be revisited. All kiosk copy is new and needs approval (see [portal.md, "Booth kiosk"](../ux/portal.md#booth-kiosk)).

## 1. Why a kiosk
- **Decision:** Booths (Kitchener Market and similar) are one of the main ways people join the email list ([community member](../users/community-member.md)). A tablet page lets people add themselves straight into Community, instead of a paper sheet an admin retypes or imports later.
- **Scope:** Name and Email only. It adds a general member; it is not a second SDC registration form for events, and it collects nothing beyond what the email list needs.

## 2. Where it lives and who can open it
- **Decision:** Route `/kiosk`, opened by an admin from Community in a new tab. It uses the admin session (`getCurrentAdmin`) and redirects to `/login` without one; the submit action checks again. No admin sidebar, so members at the booth can't reach admin pages from the screen.
- **Location:** `?location=Kitchener Market` is an optional label shown above the heading and passed to `addBoothSignup` so admins can see where someone signed up. Trimmed and capped at 80 characters.
- **Assumption:** The admin stays near the tablet. The page doesn't lock the browser; closing the tab or using the address bar still reaches the admin portal on that device.

## 3. When people meet it
- **Sign up:** one screen with a warm heading, one paragraph (about one email a month, local opportunities, unsubscribe anytime), Name, Email and **Sign me up**. Errors show inline under each field and keep what was typed.
- **Confirmation:** "You're in, {name}! Check your inbox for a welcome email." with **Next person**. Focus moves to the heading.
- **Reset:** after 20 seconds, shown as "Starting over in 20s". Any touch or keypress pauses the countdown (WCAG 2.2.1, timing adjustable); **Next person** then resets. After a reset, focus goes to Name.
- **Sizing:** 19px text (`--text-lg`) and 48px targets (`--space-7`), portrait and landscape (two columns on wide landscape tablets), down to 360px wide.

## 4. Privacy
- **No membership disclosure:** an email that's already on the list gets the same confirmation, and nothing new is saved or sent. The next person in line can't learn who is a member.
- **Nothing lingers:** each reset remounts the form, clearing the last person's name and email from the page. Inputs set `autocomplete="off"` so the browser doesn't suggest the previous person's details.
- **Only what email needs:** name, email, booth location and sign-up time. The intro says what the details are used for.

## Open questions
- Should a booth signup that matches someone who unsubscribed themselves resubscribe them? The assumption is no: they see the same confirmation and stay unsubscribed until they resubscribe by email link. Confirm with SDC.
- The kit's largest control is 44px with 16px text; the kiosk scales kit components with tokens. If other touch screens appear, consider an `xl` Button and Input size in the kit (design-system owner).
