import { ACTIVE_WINDOW_DAYS } from "./types";
import type { MemberRecord, MemberStatus, SentEmail } from "./types";

/**
 * What the send log says about one person. Pure: the backend can keep this as is and feed it
 * from the real send log. Only primary-action (CTA) clicks count towards status; shares are
 * counted separately and opens never count.
 */
export interface MemberActivity {
  status: MemberStatus;
  /** Delivered emails only. */
  emailsReceived: number;
  ctaClicks: number;
  /** CTA clicks on opportunities whose action is signing up. */
  signups: number;
  shares: number;
  lastClickAt?: string;
  lastEmail?: { subject: string; sentAt: string };
}

/**
 * One status per person, first match wins:
 * 1. Unsubscribed. 2. Invited (onboarding not started). 3. Onboarding incomplete.
 * 4. Active (a CTA click in the last 60 days). 5. Inactive (no CTA click in the last 60 days,
 * including people who have never clicked; owner, 28 Sep: "Never clicked" folded into Inactive).
 */
export function deriveStatus(m: Pick<MemberRecord, "subscribed" | "onboarding">, lastClickAt: string | undefined, now: number): MemberStatus {
  if (!m.subscribed) return "unsubscribed";
  if (m.onboarding === "not_started") return "invited";
  if (m.onboarding === "in_progress") return "onboarding_incomplete";
  if (!lastClickAt) return "inactive";
  return now - new Date(lastClickAt).getTime() <= ACTIVE_WINDOW_DAYS * 86_400_000 ? "active" : "inactive";
}

/** `emails` is the person's send log, newest first. */
export function summarizeActivity(m: MemberRecord, emails: SentEmail[], now: number): MemberActivity {
  let ctaClicks = 0;
  let signups = 0;
  let shares = 0;
  let lastClickAt: string | undefined;
  for (const email of emails) {
    for (const opp of email.opportunities) {
      for (const action of opp.actions) {
        if (action.type === "share") {
          shares++;
          continue;
        }
        ctaClicks++;
        if (opp.cta === "sign_up") signups++;
        if (!lastClickAt || action.at > lastClickAt) lastClickAt = action.at;
      }
    }
  }
  const [latest] = emails;
  return {
    status: deriveStatus(m, lastClickAt, now),
    emailsReceived: emails.filter((e) => e.status === "delivered").length,
    ctaClicks,
    signups,
    shares,
    lastClickAt,
    lastEmail: latest && { subject: latest.subject, sentAt: latest.sentAt },
  };
}
