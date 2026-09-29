import type { ActionState } from "@/lib/forms";

/**
 * Contract between the Opportunities UI (admin and partner portals) and the backend.
 * See docs/backend/opportunities.md.
 */

export type OpportunityKind = "event" | "petition" | "volunteer" | "job" | "other";

/** Stored status: Draft, Published, Closed. `closed` covers a manual close, an automatic end and partner removal; see `closedReason`. */
export type OpportunityStatus = "draft" | "published" | "closed";
/**
 * Why a listing is closed. `ended`: its date passed on its own. `closed`: a person closed it.
 * `partner_removed`: its organization's portal access was removed (shown as "Partner access removed"; see
 * format.ts effectiveStatus). Reinstating the organization reopens these (service.ts reopenListingsForOrganization).
 */
export type ClosedReason = "ended" | "closed" | "partner_removed";

/** List tabs. `closed` includes ended listings and those of removed partners. */
export type OpportunityTab = "published" | "drafts" | "closed";

export type TopicId =
  | "housing"
  | "food"
  | "income"
  | "newcomers"
  | "environment"
  | "health"
  | "accessibility"
  | "arts"
  | "civic"
  | "youth"
  | "seniors";

export type EventFormat = "in_person" | "online" | "hybrid";
export type VolunteerFormat = "in_person" | "remote" | "hybrid";
export type Workplace = "on_site" | "remote" | "hybrid";
export type EmploymentType = "full_time" | "part_time" | "contract" | "temporary" | "internship";

/** Where it happens, as a matchable value: Waterloo Region's municipalities, or online. Labels in catalog.ts AREAS. */
export type Area =
  | "kitchener"
  | "waterloo"
  | "cambridge"
  | "north_dumfries"
  | "wellesley"
  | "wilmot"
  | "woolwich"
  | "online";

/** Volunteer time commitment, as a matchable value. Labels in catalog.ts TIME_COMMITMENTS. */
export type TimeCommitment = "under_2" | "2_to_5" | "5_plus" | "one_time";

/** Volunteer skills from a small fixed list, so they can be matched. Labels in catalog.ts SKILLS. */
export type SkillId = "no_experience" | "driving" | "languages" | "tech" | "childcare" | "cooking" | "writing" | "event_setup";

/** Event accessibility features people can filter on. Labels in catalog.ts ACCESSIBILITY_FEATURES. */
export type AccessibilityFeature = "step_free" | "accessible_washroom" | "asl" | "childcare" | "quiet_space";

export interface EventDetails {
  /** yyyy-mm-dd, local to Waterloo Region. */
  date: string;
  /** HH:mm, 24-hour. */
  startTime: string;
  endTime?: string;
  format: EventFormat;
  /**
   * Required to publish when people attend in person or hybrid; "online" for online events. Events keep
   * no street address (the area is what members are matched on; the venue is on the event page).
   */
  area: Area;
  cost: "free" | "paid";
  /**
   * Paid events: whole dollars. One price is `priceMin` alone; a range adds `priceMax`. Matched against
   * the budget range members give.
   */
  priceMin?: number;
  priceMax?: number;
  accessibility?: AccessibilityFeature[];
  /** Anything the checkboxes don't cover, e.g. "ASL with one week's notice". */
  accessibilityNote?: string;
}

export interface PetitionDetails {
  /** Who the petition is addressed to, e.g. "Region of Waterloo Council". */
  target: string;
  /** yyyy-mm-dd */
  deadline?: string;
  signatureGoal?: number;
}

export interface VolunteerDetails {
  /** Required to publish. "One-time" replaced the old one-time/ongoing Commitment field. */
  timeCommitment: TimeCommitment;
  format: VolunteerFormat;
  /** Required to publish. */
  area: Area;
  /** yyyy-mm-dd */
  startDate?: string;
  skills?: SkillId[];
  minimumAge?: number;
  /** yyyy-mm-dd */
  applyBy?: string;
}

export interface JobDetails {
  employmentType: EmploymentType;
  workplace: Workplace;
  /** Required to publish. */
  area: Area;
  /** Free text, e.g. "$22–25 an hour". */
  pay?: string;
  /** yyyy-mm-dd */
  applyBy?: string;
  qualifications?: string;
}

export interface CustomDetail {
  label: string;
  value: string;
}

export interface OtherDetails {
  /** The button text people see, e.g. "Take the survey". */
  callToAction: string;
  /** yyyy-mm-dd */
  deadline?: string;
  /** Up to 5. */
  details: CustomDetail[];
}

export interface DetailsByKind {
  event: EventDetails;
  petition: PetitionDetails;
  volunteer: VolunteerDetails;
  job: JobDetails;
  other: OtherDetails;
}

export interface OrganizationRef {
  id: string;
  name: string;
}

/** An option in the admin list's Organization filter. Removed partners stay filterable, labelled "{name} (removed)". */
export interface OrganizationFilterOption extends OrganizationRef {
  removed?: boolean;
}

export interface Editor {
  name: string;
  role: "admin" | "partner";
}

interface OpportunityBase {
  id: string;
  title: string;
  /** Up to 280 characters; written for email. */
  summary: string;
  /** The listing's image, 16:9 works best. Shown on partner cards, in the panel and in emails. Optional. */
  imageUrl?: string;
  topics: TopicId[];
  /** Where people take action. Stored normalized to https (src/lib/url.ts normalizeWebAddress). Required to publish. */
  link: string;
  organization: OrganizationRef;
  status: OpportunityStatus;
  closedReason?: ClosedReason;
  createdAt: string;
  updatedAt: string;
  updatedBy: Editor;
  publishedAt?: string;
  /** Email reach. Absent on drafts and before the first send. Backend: docs/backend/opportunities.md "Performance". */
  performance?: OpportunityPerformance;
}

export interface OpportunityPerformance {
  /** Distinct people whose SDC email included this opportunity. */
  sentTo: number;
  /** Distinct people who clicked it in those emails. */
  clicks: number;
  /** When it last went out; ISO. Absent if it hasn't been sent yet. */
  lastSentAt?: string;
}

/** Drafts may have partial details; everything else is complete. */
export type Opportunity = {
  [K in OpportunityKind]: OpportunityBase & { kind: K; details: Partial<DetailsByKind[K]> };
}[OpportunityKind];

/** Sortable list columns; the URL's `sort` param. */
export type OpportunitySortKey = "title" | "organization" | "date" | "updated" | "sentTo" | "clicks";

export interface OpportunitySort {
  key: OpportunitySortKey;
  direction: "asc" | "desc";
}

export interface OpportunityFilters {
  tab: OpportunityTab;
  /** Any of these types; empty or missing means all. */
  kinds?: OpportunityKind[];
  /** Admin only; ignored for partners. Any of these organizations; empty or missing means all. */
  organizationIds?: string[];
  q?: string;
  /** Missing: the tab's default order (published: soonest date first; drafts and closed: most recently updated first). */
  sort?: OpportunitySort;
}

/** How many listings in the current tab have each value, for the column filters' counts. */
export interface OpportunityFilterCounts {
  kinds: Partial<Record<OpportunityKind, number>>;
  organizations: Record<string, number>;
}

export interface SaveResult {
  id: string;
  /** The list tab the listing now belongs in, after its effective status (an ended listing moved to a future date is published again). */
  tab: OpportunityTab;
}

export type OpportunityCounts = Record<OpportunityTab, number>;

/** Who is acting. The backend derives this from the session, never from the client. */
export type Actor =
  | { role: "admin"; name: string }
  | { role: "partner"; name: string; organizationId: string };

/**
 * The server actions a portal hands to the shared UI. Each portal binds its own actor
 * server-side (src/app/admin/opportunities/_data/actions.ts, src/app/partner/opportunities/_data/actions.ts).
 */
export interface OpportunityActions {
  /** Create or update. FormData fields: see docs/backend/opportunities.md. Success returns the id and the list tab it now belongs in. */
  save: (prev: ActionState<SaveResult>, fd: FormData) => Promise<ActionState<SaveResult>>;
  close: (id: string) => Promise<ActionState>;
  reopen: (id: string) => Promise<ActionState>;
  duplicate: (id: string) => Promise<ActionState<{ id: string }>>;
  remove: (id: string) => Promise<ActionState>;
}
