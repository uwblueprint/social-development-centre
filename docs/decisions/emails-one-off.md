# One-off emails: decision log

## 1. Where it lives: one sidebar item, Drafts and Sent as tabs
- **Decision (design):** **One-off emails** is a sidebar item. **Drafts** and **Sent** are tabs with one `Table` each, a ⋯ menu per row (Duplicate; Delete on drafts). Compose is its own page, `/one-off/[id]`; a sent email opens read-only on the same route.
- **Page:** One-off emails.

## 2. Rewrite: one page, three blocks, almost no sentences
- **Decision (product owner):** The first build explained too much, stacked everything on one level and used the wrong components. Rewritten to `docs/emails-prototype/ux-rules.md` plus: a value on screen is edited where it is shown, and no heading repeats a field label.
- **Compose page:** top bar (back, **Draft**, **Saved**, **Preview**, **Send test**, **Send to N members**, ⋯ for Delete draft), then one column: **To**, the editor (subject and message, no heading), and a one-line monthly-limit warning only when it applies.
- **Removed from the page:** the sender panel, "Before you send", the recipient table, the "Removed" and "Won't get this email" tables, the help sentences, the Summary box on sent emails, **View insights** and the demo link to "Email this member" (the route still exists).

## 3. IA decision: the recipient list is behind the count
- **Decision (design):** **To** is a `ToggleGroup` (**Everyone**, **A group**, **Pick people**). **A group** reveals the conditions builder; **Pick people** reveals a searchable `Select`. The live count (**14 members**) opens a `Sheet` with the full list (25 per page, filter), a remove icon per row, and two folded sections: **Removed** (add back) and **Not included (N)** (reason per person; they can't be added back). The monthly-limit line's **View** opens the same sheet showing only those members.
- **Why:** The list answers "who exactly?", which is rarely the question. One click away beats 120 rows under the editor.
- **Unchanged:** zero recipients disables **Send** with a lock-icon reason; removals apply to this send only; changing the kind clears removals; the audience is fixed at send.

## 4. Confirmation and after Send
- **Decision (design):** `AlertDialog` titled **Send to 14 members?**, one line (subject and audience in four words: **All members**, **Tag: Board**, **3 people**), **Cancel** and **Send**. A save failure shows in that line.
- **After Send:** a toast with **Undo**, and the Sent tab opens. The kit toast takes one action, so **Update email** sits in a one-line banner (with **Undo** and a countdown) on the Sent tab and sent page for the 1-minute window. Ask the design-system owner for a second toast action.

## 5. Sent emails are read-only
- **Decision (PRD):** Header (subject, date, audience, count), a recipients `Table` with a **Sent**, **Sending** or **Not sent** badge and a quiet reason, **Not included (N)** folded below, and **Duplicate** as the only action. Selecting a person opens their email in a `Sheet`. Removals aren't copied by Duplicate (flagged).

## 6. Email this member
- **Decision (PRD):** `/one-off/new?member=<id>` creates a draft with that person picked. No link to the stand-in page appears in the UI.
