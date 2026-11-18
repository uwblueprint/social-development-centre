/*
 * Demo data for the referral page: the same component as /refer/<token>, with this function standing in
 * for the server action. The real rules live in `refer_friend` (supabase/migrations/20261112000000_referrals.sql).
 *
 * Try these in the email field:
 * - amara@example.org: the referrer's own address (refused)
 * - sam@example.org: already referred on Nov 3 (never a second email, so you get the message instead)
 * - lee@example.org: already a member. Looks exactly like a new referral, so a referral link can't be
 *   used to find out who is a member.
 * - limit@example.org: the daily limit (ten new referrals)
 * - anything else: a new referral
 * Open /design/referrals?link=unknown for a link with a bad or missing token.
 */
import { copy } from "@/features/referrals/copy";
import { friendLinkPath, type ReferralResult, type ReferralValues } from "@/features/referrals/types";

export const REFERRER = { firstName: "Amara", email: "amara@example.org" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const link = (id: string) => `https://sdc.example.org${friendLinkPath(id)}`;

export async function demoReferFriend(values: ReferralValues): Promise<ReferralResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();

  const fieldErrors: { name?: string; email?: string } = {};
  if (!name) fieldErrors.name = copy.nameRequired;
  else if (/[<>/\\:@]/.test(name)) fieldErrors.name = copy.nameInvalid;
  if (!EMAIL.test(email)) fieldErrors.email = copy.emailInvalid;
  else if (email === REFERRER.email) fieldErrors.email = copy.ownEmail;
  if (fieldErrors.name || fieldErrors.email) return { status: "invalid", fieldErrors };
  if (email === "limit@example.org") return { status: "limit" };

  const friendName = name.split(/\s+/)[0];
  if (email === "sam@example.org") return { status: "message", friendName, link: link("3f9c2a00-0000-4000-8000-000000000000"), referredOn: "Nov 3" };
  if (values.delivery === "email") return { status: "emailed", friendName };
  return { status: "message", friendName, link: link("8b41de00-0000-4000-8000-000000000000") };
}
