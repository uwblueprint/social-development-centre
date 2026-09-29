import type {
  AccessibilityFeature,
  Area,
  EmploymentType,
  EventFormat,
  OpportunityKind,
  SkillId,
  TimeCommitment,
  TopicId,
  VolunteerFormat,
  Workplace,
} from "./types";

/** Display order everywhere (menus, filters). */
export const KINDS: OpportunityKind[] = ["event", "petition", "volunteer", "job", "other"];

export const KIND_LABEL: Record<OpportunityKind, string> = {
  event: "Event",
  petition: "Petition",
  volunteer: "Volunteer role",
  job: "Job",
  other: "Other",
};

/**
 * The Type tag's color in the table: Badge `$category` 1–5, one per kind, always with the kind's icon and
 * label (never color alone).
 */
export const KIND_CATEGORY: Record<OpportunityKind, 1 | 2 | 3 | 4 | 5> = { event: 1, petition: 2, volunteer: 3, job: 4, other: 5 };

/** Lower-case noun for sentences and headings: "New volunteer role", "Delete this petition?" */
export const KIND_NOUN: Record<OpportunityKind, string> = {
  event: "event",
  petition: "petition",
  volunteer: "volunteer role",
  job: "job",
  other: "opportunity",
};

/** Placeholder taxonomy until the 29 September session; ids are stable, labels may change. */
export const TOPICS: { id: TopicId; label: string }[] = [
  { id: "housing", label: "Housing and homelessness" },
  { id: "food", label: "Food security" },
  { id: "income", label: "Income and poverty" },
  { id: "newcomers", label: "Newcomers and refugees" },
  { id: "environment", label: "Environment and climate" },
  { id: "health", label: "Health and wellbeing" },
  { id: "accessibility", label: "Accessibility and disability" },
  { id: "arts", label: "Arts and culture" },
  { id: "civic", label: "Civic participation" },
  { id: "youth", label: "Youth" },
  { id: "seniors", label: "Seniors" },
];
export const TOPIC_LABEL = Object.fromEntries(TOPICS.map((t) => [t.id, t.label])) as Record<TopicId, string>;
export const MAX_TOPICS = 3;

export const EVENT_FORMAT_LABEL: Record<EventFormat, string> = { in_person: "In person", online: "Online", hybrid: "Hybrid" };
export const VOLUNTEER_FORMAT_LABEL: Record<VolunteerFormat, string> = { in_person: "In person", remote: "Remote", hybrid: "Hybrid" };
export const WORKPLACE_LABEL: Record<Workplace, string> = { on_site: "On-site", remote: "Remote", hybrid: "Hybrid" };
export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
};

/*
 * Structured values for matching. The option lists and labels are proposals until SDC confirms its tags.
 * Ids are stable; labels may change.
 */
export const AREAS: { id: Area; label: string }[] = [
  { id: "kitchener", label: "Kitchener" },
  { id: "waterloo", label: "Waterloo" },
  { id: "cambridge", label: "Cambridge" },
  { id: "north_dumfries", label: "North Dumfries" },
  { id: "wellesley", label: "Wellesley" },
  { id: "wilmot", label: "Wilmot" },
  { id: "woolwich", label: "Woolwich" },
  { id: "online", label: "Online / remote" },
];
export const AREA_LABEL = Object.fromEntries(AREAS.map((a) => [a.id, a.label])) as Record<Area, string>;

export const TIME_COMMITMENTS: { id: TimeCommitment; label: string }[] = [
  { id: "under_2", label: "Under 2 hours a week" },
  { id: "2_to_5", label: "2–5 hours a week" },
  { id: "5_plus", label: "5+ hours a week" },
  { id: "one_time", label: "One-time" },
];
export const TIME_COMMITMENT_LABEL = Object.fromEntries(TIME_COMMITMENTS.map((t) => [t.id, t.label])) as Record<TimeCommitment, string>;

export const SKILLS: { id: SkillId; label: string }[] = [
  { id: "no_experience", label: "No experience needed" },
  { id: "driving", label: "Driving" },
  { id: "languages", label: "Languages" },
  { id: "tech", label: "Tech" },
  { id: "childcare", label: "Childcare" },
  { id: "cooking", label: "Cooking" },
  { id: "writing", label: "Writing" },
  { id: "event_setup", label: "Event setup" },
];
export const SKILL_LABEL = Object.fromEntries(SKILLS.map((t) => [t.id, t.label])) as Record<SkillId, string>;

export const ACCESSIBILITY_FEATURES: { id: AccessibilityFeature; label: string }[] = [
  { id: "step_free", label: "Step-free access" },
  { id: "accessible_washroom", label: "Accessible washroom" },
  { id: "asl", label: "ASL on request" },
  { id: "childcare", label: "Childcare" },
  { id: "quiet_space", label: "Quiet space" },
];
export const ACCESSIBILITY_LABEL = Object.fromEntries(ACCESSIBILITY_FEATURES.map((t) => [t.id, t.label])) as Record<
  AccessibilityFeature,
  string
>;

export const LIMITS = { title: 100, summary: 280, accessibilityNote: 200, customDetails: 5, customLabel: 40, customValue: 120 } as const;

/** SDC itself as a publisher; admins can post as SDC. */
export const SDC_ORG = { id: "sdc", name: "Social Development Centre" } as const;
