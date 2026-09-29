/*
 * Dev stand-in for SDC's email log: which opportunities went out in which email, and how many clicks each
 * got from emails. Partners reads it to derive health and total clicks. Relative to now, like the other seeds.
 * Backend: replace `emailStatsFor` with a query over the real sends and click tracking; delete the seed.
 */

import { globalSingleton } from "@/lib/globalSingleton";

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();

interface EmailInclusion {
  opportunityId: string;
  sentAt: string;
  clicks: number;
}

function seed(): EmailInclusion[] {
  return [
    // Northside Food Bank: emailed, with clicks (no tag).
    { opportunityId: "opp_3", sentAt: iso(-25), clicks: 14 },
    { opportunityId: "opp_14", sentAt: iso(-35), clicks: 6 },
    // Riverbend Youth Collective: opp_7 (posted 15 days ago) was never emailed (Not emailed).
    // Eastside Newcomer Services: emailed, nobody clicked (No clicks).
    { opportunityId: "opp_5", sentAt: iso(-5), clicks: 0 },
    // SDC's own listings.
    { opportunityId: "opp_1", sentAt: iso(-9), clicks: 41 },
    { opportunityId: "opp_2", sentAt: iso(-16), clicks: 28 },
  ];
}

const inclusions = () => globalSingleton<EmailInclusion[]>("__partnerEmailStatsV2", seed);

export interface OpportunityEmailStats {
  /** The first email the opportunity was in; absent if it was never emailed. */
  firstEmailedAt?: string;
  /** Clicks from every email it was in. */
  clicks: number;
}

export function emailStatsFor(opportunityId: string): OpportunityEmailStats {
  const rows = inclusions().filter((r) => r.opportunityId === opportunityId);
  const firstEmailedAt = rows.map((r) => r.sentAt).sort()[0];
  return { firstEmailedAt, clicks: rows.reduce((sum, r) => sum + r.clicks, 0) };
}
