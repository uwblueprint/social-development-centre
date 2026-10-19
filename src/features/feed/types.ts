import type { AccessibilityFeature, Area, Opportunity, OpportunityKind, TopicId } from "@/features/opportunities/types";

/** The signed-in paying member. Backend: src/app/member/_data/session.ts. */
export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  /** Topics chosen at onboarding; they drive For you. Edited from the account menu or For you. */
  interests: TopicId[];
}

/**
 * Whether a listing someone opened can still be acted on. `open`: still published. `ended`: its date passed.
 * `closed`: the organizer or SDC closed it (also a removed partner's listing, for 30 days).
 * `unavailable`: a removed partner's listing after that grace period; see docs/backend/opportunities.md#removed-partners.
 */
export type Availability = "open" | "ended" | "closed" | "unavailable";

export interface KnownOpportunity {
  opportunity: Opportunity;
  availability: Availability;
}

/** One opportunity someone opened from the feed. The backend stores these per member. */
export interface YoursEntry {
  id: string;
  /** ISO timestamp of the first open. */
  openedAt: string;
}

export type WhenFilter = "any" | "week" | "month";
export type SortKey = "best" | "soonest" | "newest";

export interface ExploreFilters {
  q: string;
  kinds: OpportunityKind[];
  topics: TopicId[];
  areas: Area[];
  when: WhenFilter;
  /** Hides paid events. Every other type is unaffected. */
  freeOnly: boolean;
  /** Events that offer all of these. Other types don't list accessibility, so they drop out while this is set. */
  accessibility: AccessibilityFeature[];
  sort: SortKey;
}
