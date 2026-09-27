import { listPublishedHistory } from "@/features/opportunities/queries";
import { emailStatsFor } from "./emailStats";
import { currentContacts, statusOf, type StoredOrg } from "./store";
import type { PartnerHealthTag } from "./types";

/*
 * Partner health: one tag per organization with access, first match wins (docs/backend/partners.md).
 * Server-side only. Backend: keep the rules and thresholds; compute them in the query or a nightly job.
 */

const DAY = 86_400_000;
/** No post for this long, since joining or since the last post: No recent posts. */
export const NO_RECENT_POSTS_DAYS = 60;
/** A published opportunity should be in an email within this many days of posting: Not emailed. */
export const EMAIL_WITHIN_DAYS = 14;

export interface OrganizationActivity {
  health?: PartnerHealthTag;
  lastPostedAt?: string;
  totalClicks: number;
}

export function activityOf(org: StoredOrg, now = Date.now()): OrganizationActivity {
  const posts = listPublishedHistory(org.id).map((p) => ({ ...p, email: emailStatsFor(p.id) }));
  const lastPostedAt = posts.map((p) => p.publishedAt).sort().at(-1);
  const emailed = posts.filter((p) => p.email.firstEmailedAt);
  const totalClicks = emailed.reduce((sum, p) => sum + p.email.clicks, 0);
  return { health: healthOf(org, posts, lastPostedAt, now), lastPostedAt, totalClicks };
}

function healthOf(
  org: StoredOrg,
  posts: { publishedAt: string; status: string; email: { firstEmailedAt?: string; clicks: number } }[],
  lastPostedAt: string | undefined,
  now: number,
): PartnerHealthTag | undefined {
  if (statusOf(org) === "removed") return undefined;

  // 1. Nobody has accepted an invitation.
  if (!currentContacts(org).some((c) => c.status === "active")) return { tag: "notOnboarded" };

  // 2. No opportunity posted in the 60 days since joining, or since the last post.
  const since = lastPostedAt ?? org.joinedAt ?? org.createdAt;
  if (now - Date.parse(since) > NO_RECENT_POSTS_DAYS * DAY) {
    return { tag: "noRecentPosts", since: lastPostedAt ? "lastPost" : "joined" };
  }

  // 3. A published opportunity wasn't in any email within 14 days of posting (only once those 14 days have passed).
  const window = EMAIL_WITHIN_DAYS * DAY;
  const missed = posts.some((p) => {
    if (p.status !== "published") return false;
    const posted = Date.parse(p.publishedAt);
    if (now - posted <= window) return false;
    return !p.email.firstEmailedAt || Date.parse(p.email.firstEmailedAt) - posted > window;
  });
  if (missed) return { tag: "notEmailed" };

  // 4. Its emailed opportunities got zero clicks.
  const emailed = posts.filter((p) => p.email.firstEmailedAt);
  if (emailed.length > 0 && emailed.every((p) => p.email.clicks === 0)) return { tag: "noClicks" };

  return undefined;
}
