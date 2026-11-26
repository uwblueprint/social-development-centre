# Email prototype: UX rules (binding for every screen)

The first pass explained too much, put everything on one level and used the wrong components. These rules replace it. If a screen breaks one, fix the screen.

## 1. Text budget
- A page is a title and one primary action. No paragraph under a heading. No "what this page is".
- Labels are short nouns or verbs. Hints only where a mistake is likely, 8 words or fewer, under the field.
- Definitions go in a `Tooltip` on an info icon, never inline.
- Empty states: one line and one action.
- Rules the system enforces (one send per occurrence, re-checks, unsubscribe wins) are never explained up front. They show only at the moment they change an outcome, as a count ("3 emails need approval again"), not a paragraph.
- Row summaries fit one line and truncate with a tooltip. No second line of explanation under a row.
- If a sentence repeats what the control already says, delete it.

## 2. Information architecture
Sidebar, in this order: **Outbox** (home; count badge for waiting for review), **Automatic emails**, **One-off emails**. Nothing else. The email editor is never a destination: it lives inside the three flows. Flags and the editor sandbox live in the State lab panel under "Prototype".
- Outbox answers "what is going out and does anything need me?". Sections inside the list: Waiting for you, Today, Tomorrow, then dates.
- Automatic emails: tabs **Live**, **Drafts**, **Trash** (one list per tab, not three stacked groups).
- One-off emails: tabs **Drafts**, **Sent**. Compose is a separate page.

## 3. Progressive disclosure
Show the next decision, hide the rest one click away.
- Outbox: the PRD specifies an accordion, so use the kit Accordion. Each batch is a collapsed row (name, recipients, one status Badge, one primary action, a ⋯ menu). Expanding lists the recipients inline as compact rows; selecting a recipient shows the exact email inline beneath it, with Edit, Approve and Don't send. No Sheet, no extra navigation.
- Automatic email builder: one page with a vertical stack of step cards: **When** (moment) → **Wait** (delay) → **Who** (defaults to "Everyone", **Add condition** reveals the builder) → **Email** → **Send mode**. Each card is one summary line; click opens its editor in a right-hand panel or inline expand. Advanced stuff (conflicts, scheduled-members list, recipients) sits behind the cards or in tabs on the published view. Top bar: back, name, status, Preview, Save state, Publish. Like Klaviyo, HoneyBook and Squarespace automations.
- One-off compose: one page, three blocks: **To** (segmented control: Everyone / A group / Pick people, with a live count chip that opens the recipients in a `Sheet`), **Subject and message** (editor), and a sticky footer bar: Preview, Send test, **Send to N members**. Like Sweatpals, Resend's "Ready to send" and Kit's draft bar.
- Warnings (monthly limit, conflicts) appear as one inline line next to the thing that causes them, expandable to details. Never a stacked block of notices.
- Confirmations: one `AlertDialog`, title is the action, body is counts only, two buttons.

## 4. Components for the job
| Need | Use |
|---|---|
| Views of the same list | `Tabs` |
| Scannable records with columns | `Table` |
| Detail of a row, without losing the list | `Sheet` |
| Confirm an irreversible or outward action | `AlertDialog` |
| Short form or picker that blocks | `Dialog` |
| Small setting on a control (a fallback, one condition) | `Popover` |
| Secondary row actions | `DropdownMenu` (⋯). At most one visible primary button per row |
| 2 to 4 visible exclusive options | `ToggleGroup` or `RadioGroup` |
| 5+ exclusive options | `Select` |
| On/off that applies now | `Switch` |
| Pick tags or people | `TagInput` / `CreatableCombobox` |
| Result, with Undo | `Toast` |
| Status | `Badge` with icon and text |
| Advanced or rare options | `Collapsible` |
| Definitions | `Tooltip` |

## 5. Mobbin references
- Scheduled emails master-detail: [Wrangle](https://mobbin.com/screens/5abdd0f7-426f-46b9-9ddf-4d322886b3a8) · review banner and scheduled list: [Klaviyo campaigns](https://mobbin.com/screens/789caeb6-0875-4f29-9ce6-a9abbf9d2671) · queue with detail pane: [Reddit](https://mobbin.com/screens/72baf793-48c1-4ca7-a3f7-5c865ae141d2)
- Automation list grouped by Live and Draft: [Attio](https://mobbin.com/screens/43367c26-02e3-4779-8234-cfb28f666eb6) · "when this happens, do this" table: [Calendly](https://mobbin.com/screens/5eb78647-4f06-4ce6-9f25-1965a7a85fe5)
- Step-card builder with side panel: [Klaviyo flow](https://mobbin.com/screens/2933756c-7261-43b3-b7b4-d392abd832ea) · [HoneyBook](https://mobbin.com/screens/72f7d0f4-2412-40dc-930e-c1d4c7ac9e84) · [Squarespace delay panel](https://mobbin.com/screens/b4c60d9b-ae62-4851-89f6-f9d4d2a4e7d6) · [Flodesk](https://mobbin.com/screens/d6c3660f-0ba2-41cd-b137-fd85e7b3fd2f)
- Compose with audience and live count: [Sweatpals](https://mobbin.com/screens/367996a2-7d21-40b8-beeb-3c651dece725) · [Resend ready to send](https://mobbin.com/screens/12b8c6f4-1edb-4e82-a67b-e2873dcbd7c6) · [Kit draft bar](https://mobbin.com/screens/283ab44e-c502-434c-ad63-147c6cb28f35) · [Podia recipients row](https://mobbin.com/screens/a15b4924-974b-4b36-bc14-803d53e02edf)

## 6. Added by the product owner
- The reminder email is a design deliverable for the PM, not a screen the admin uses. Remove every link to it from the Outbox. It stays reachable only from the State lab under "Prototype".
- No tag chips in lists. Tags show as one line of muted plain text, truncated ("Volunteer, Board"), or not at all in rows where they aren't the decision. The full set of tags shows once, in the recipient detail. (The Outbox PRD says every recipient row shows all tags; flag that this is overwhelming at 20+ recipients.)
- Count of anything repeated (chips, badges, buttons per row) is a smell. One status per row, one primary action per row.
