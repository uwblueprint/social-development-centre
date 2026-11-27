/*
 * Demo data for the admin side of Referrals, shown on one member's profile in the Member Directory
 * (PM notes, Nov 2026). Backend needs: docs/backend/referrals.md, "Admin: referring for a member".
 */

export type ReferralStatus = "emailed" | "link" | "joined";

export interface MemberReferral {
  id: string;
  friendName: string;
  friendEmail: string;
  /** Display date, e.g. "Nov 3". Real data is a UTC timestamp. */
  referredOn: string;
  /** Who made it: the member from their email, or an admin on their behalf. */
  by: "member" | "admin";
  status: ReferralStatus;
  joinedOn?: string;
  /**
   * Set when the person who joined through this referral's link isn't the one invited by name and email:
   * the friend signed up with another address, or the link was passed on to someone else. The member is
   * still credited (the link's code decides); the row shows who actually joined.
   */
  joinedAs?: { name: string; email: string; why: "other-email" | "forwarded" };
}

export interface Activity {
  id: string;
  text: string;
  on: string;
}

export const MEMBER = {
  firstName: "Maya",
  fullName: "Maya Patel",
  email: "maya.patel@example.org",
  joinedOn: "Sep 12, 2026",
  referredBy: "Priya Shah",
  /** Maya's own Refer a friend page, from the footer of her emails (/refer/<person token>). */
  referPageLink: "https://sdc.example.org/refer/5c1e9a00-0000-4000-8000-000000000000",
};

export const SEED_REFERRALS: MemberReferral[] = [
  { id: "r3", friendName: "Sam Okafor", friendEmail: "sam@example.org", referredOn: "Nov 3", by: "member", status: "emailed" },
  { id: "r2", friendName: "Ana Ruiz", friendEmail: "ana.ruiz@example.org", referredOn: "Oct 28", by: "admin", status: "link" },
  {
    id: "r5",
    friendName: "Dana Wright",
    friendEmail: "dana.w@example.org",
    referredOn: "Oct 30",
    by: "member",
    status: "joined",
    joinedOn: "Nov 14",
    joinedAs: { name: "Dana Wright", email: "dana@wrightfamily.ca", why: "other-email" },
  },
  {
    id: "r4",
    friendName: "Kai Moreno",
    friendEmail: "kai.moreno@example.org",
    referredOn: "Oct 25",
    by: "member",
    status: "joined",
    joinedOn: "Nov 12",
    joinedAs: { name: "Rosa Moreno", email: "rosa.m@example.org", why: "forwarded" },
  },
  {
    id: "r1",
    friendName: "Lee Chen",
    friendEmail: "lee@example.org",
    referredOn: "Oct 20",
    by: "member",
    status: "joined",
    joinedOn: "Nov 10",
  },
];

export const SEED_ACTIVITY: Activity[] = [
  { id: "a4", text: "Referred Sam Okafor", on: "Nov 3" },
  { id: "a3", text: "Lee Chen joined through Maya's referral", on: "Nov 10" },
  { id: "a2", text: "Referred Ana Ruiz (added by an admin)", on: "Oct 28" },
  { id: "a1", text: "Joined via referral by Priya Shah", on: "Sep 12" },
];

/** The line under a Joined referral when someone other than the invited address joined. */
export function joinedAsText(r: MemberReferral) {
  if (!r.joinedAs) return null;
  return r.joinedAs.why === "other-email"
    ? `Joined with another email: ${r.joinedAs.email}`
    : `Link passed on: ${r.joinedAs.name} (${r.joinedAs.email}) joined with it`;
}

export const STATUS_LABEL: Record<ReferralStatus, string> = {
  emailed: "Invite emailed",
  link: "Link shared",
  joined: "Joined",
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The friend's link, as `refer_friend` returns it: the members' intake form carrying the referral. */
export function demoFriendLink(id: string) {
  return `https://sdc.example.org/intake-form/sdc-members?r=${id}`;
}
