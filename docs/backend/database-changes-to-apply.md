# Database changes to apply

The open PRs add eight migrations that aren't in the database yet. Until they're applied, the pages that use them fail to load, even though the code is fine. Someone with access to the Supabase project needs to apply them, in the order below, when the matching PR merges (or before, on staging, to try the stack locally).

| Order | Migration | From | What it adds | What fails without it |
|---|---|---|---|---|
| 1 | `20261112000000_referrals.sql` | #65 (Jesse) | Referrals on the person token, `refer_friend`, and a new `submit_intake` | The refer-a-friend page |
| 2 | `20261121000000_tag_colors.sql` | #71 | `tags.color` and `set_tag_color` | Tag colours on People and Automatic emails |
| 3 | `20261121000100_automatic_email_description.sql` | #72 | `automatic_emails.description` | Automatic emails (`column automatic_emails.description does not exist`) |
| 4 | `20261121000200_send_to_unsubscribed.sql` | #73 | Sending to unsubscribed members | Automatic emails |
| 5 | `20261121000300_split_automatic_email.sql` | #74 | `split_automatic_email` | Splitting an email by a tag |
| 6 | `20261123000000_admin_notifications.sql` | #77 | `admin_notifications`, the triggers that create them, and the bell's functions | The notifications bell ("Notifications couldn't load") |
| 7 | `20261123000100_referral_names.sql` | #90 | `split_referred_name`, so a friend is thanked by first name | The redesigned referral page |
| 8 | `20261124000000_email_footer.sql` | #76 | `email_footer`, one footer for all of SDC | Settings ("We couldn't load this page") and every send that adds the footer |

## Be careful with the first one
`20261112000000_referrals.sql` drops and recreates `submit_intake`, the function the live intake form calls when someone submits. Apply it only after #65 is reviewed, and check the intake form straight after. It also shares its version number with `20261112000000_automatic_emails_editor.sql`, which is already on main, so Supabase will only record one of them. It needs a new version (for example `20261112000100`) before it's applied.

The other seven only add tables, columns and functions. They don't change existing rows when they run, and the notification triggers are written so a failure can never block a join.

## Applying them
With the CLI: `supabase db push` applies everything in `supabase/migrations` that the database hasn't recorded. Without it: paste each file into the SQL editor in order, inside `begin;` and `commit;`, then run `notify pgrst, 'reload schema';` so the API sees the new tables straight away.
