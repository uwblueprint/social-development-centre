import type { ActionState } from "@/lib/forms";

/**
 * Contract between the Opportunities UI (admin and partner portals) and the backend.
 * See docs/backend/opportunities.md and docs/plan/opportunities-and-partner-portal.md.
 */

export type OpportunityKind = "event" | "petition" | "volunteer" | "job" | "other";

/** Stored status. `closed` covers both a manual close and an automatic end; see `closedReason`. */
export type OpportunityStatus = "draft" | "live" | "closed";
/**
 * `ended`: its date passed on its own. `closed`: a person closed it.
 * `partner_removed`: its organization was removed and the visibility cutoff passed (derived; see format.ts effectiveStatus).
 */
export type ClosedReason = "ended" | "closed" | "partner_removed";

/** List tabs. `closed` includes ended listings. */
export type OpportunityTab = "live" | "drafts" | "closed";

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

export interface EventDetails {
  /** yyyy-mm-dd, local to Waterloo Region. */
  date: string;
  /** HH:mm, 24-hour. */
  startTime: string;
  endTime?: string;
  format: EventFormat;
  /** Required unless format is online. */
  location?: string;
  cost: "free" | "paid";
  /** e.g. "$10, pay what you can". Shown when cost is paid. */
  costDetails?: string;
  accessibility?: string;
}

export interface PetitionDetails {
  /** Who the petition is addressed to, e.g. "Region of Waterloo Council". */
  target: string;
  /** yyyy-mm-dd */
  deadline?: string;
  signatureGoal?: number;
}

export interface VolunteerDetails {
  commitment: "one_time" | "ongoing";
  format: VolunteerFormat;
  /** Required unless format is remote. */
  location?: string;
  /** yyyy-mm-dd */
  startDate?: string;
  /** Free text, e.g. "3 hours a week". */
  timeCommitment?: string;
  skills?: string;
  minimumAge?: number;
  /** yyyy-mm-dd */
  applyBy?: string;
}

export interface JobDetails {
  employmentType: EmploymentType;
  workplace: Workplace;
  /** Required unless workplace is remote. */
  location?: string;
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

/** An option in the admin list's Organization filter. Removed partners stay filterable. */
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
  topics: TopicId[];
  /** External https link where people take action. Required to publish. */
  link: string;
  organization: OrganizationRef;
  status: OpportunityStatus;
  closedReason?: ClosedReason;
  /**
   * Derived, never stored. Set on a live listing whose organization was removed: it's no longer emailed or
   * recommended, and people who already got it can see it until `visibleUntil`, the earlier of its own end
   * and removal + 30 days (REMOVED_PARTNER_VISIBLE_DAYS). After that it reads as closed with `partner_removed`.
   */
  emailsStopped?: true;
  /** ISO timestamp; present with `emailsStopped`. */
  visibleUntil?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: Editor;
  publishedAt?: string;
}

/** Drafts may have partial details; everything else is complete. */
export type Opportunity = {
  [K in OpportunityKind]: OpportunityBase & { kind: K; details: Partial<DetailsByKind[K]> };
}[OpportunityKind];

export type OpportunityOf<K extends OpportunityKind> = Extract<Opportunity, { kind: K }>;

export interface OpportunityFilters {
  tab: OpportunityTab;
  kind?: OpportunityKind;
  /** Admin only; ignored for partners. */
  organizationId?: string;
  q?: string;
}

export interface SaveResult {
  id: string;
  /** Where the listing now appears, after automatic expiry (an ended listing moved to a future date is live again). */
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
