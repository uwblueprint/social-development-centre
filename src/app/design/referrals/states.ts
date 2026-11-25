/*
 * Every state the referral page can be in, declared for the State lab (docs/design/state-lab.md). Each one
 * comes from the backend (refer_friend in supabase/migrations/20261120000000_referrals.sql, the referFriend
 * server action) or the browser. A switch doesn't jump to a screen: it changes what the demo's referFriend
 * answers (or what the browser does), so you walk the flow and meet the state where a member would.
 *
 * Left out on purpose:
 * - A broken or incomplete page link (`unknown_link`): it should open the join page; not designed yet (PM, Nov 23).
 * - A friend who joins with another email, or through a passed-on link: admin side, later (PM, Nov 23).
 * - Page loading, empty, not found, access, read-only, session, conflicts, undo: the page is public, has
 *   nothing to load after the server renders it, and saves nothing that can be edited or undone.
 */
export const REFER_LAB = {
  actions: [
    {
      id: "name-refused",
      label: "Server refuses the name",
      description: "refer_friend: invalid_name (a link, @ or / that got past the page). Back to step 1, error on the name.",
    },
    {
      id: "own-email",
      label: "Their own email",
      description: "refer_friend: own_email. Stays on step 2, error on the email.",
    },
    {
      id: "already-referred",
      label: "Already referred by this member",
      description: "refer_friend: message with referred_on. No second email; the thank-you note and their link.",
    },
    {
      id: "not-emailed",
      label: "Already a member, unsubscribed or invited by someone else",
      description: "refer_friend: emailed, but no email goes out. Must look exactly like a new referral.",
    },
    {
      id: "copy-blocked",
      label: "Browser blocks the copy",
      description: "Safari can refuse a copy after a network wait. The link shows, selected, to copy by hand.",
    },
  ],
  notApplicable: [
    "loading",
    "slowLoading",
    "loadFailed",
    "empty",
    "notFound",
    "noPermission",
    "sessionExpired",
    "reconnecting",
    "readOnly",
    "sectionFailed",
    "sectionEmpty",
    "partialData",
    "staleData",
    "manyItems",
    "singleItem",
    "conflict",
    "actionDenied",
    "undoExpired",
  ],
} as const;

/*
 * The general states kept, and what they mean here:
 * - saving: Send invite or Copy link takes a few seconds ("Sending…", "Getting link…").
 * - saveFailed: the connection fails ("We couldn't send that…"), what's typed stays.
 * - validationError: the server refuses the email (invalid_email), on the email field.
 * - rateLimited: the daily limit, ten referrals today (limit).
 * - offline: actions that need the server wait; typing and Next still work.
 * - longText: a long name and email.
 */

/** A long name and email, for the longText switch. */
export const LONG_VALUES = {
  name: "Dr. Maria-Fernanda Rodríguez-Montenegro de la Cruz",
  email: "maria.fernanda.rodriguez-montenegro@universidad-de-la-comunidad.example.org",
};
