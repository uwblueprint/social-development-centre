import type { EmploymentType, EventFormat, OpportunityKind, TopicId, VolunteerFormat, Workplace } from "./types";

/** Display order everywhere (menus, filters). */
export const KINDS: OpportunityKind[] = ["event", "petition", "volunteer", "job", "other"];

export const KIND_LABEL: Record<OpportunityKind, string> = {
  event: "Event",
  petition: "Petition",
  volunteer: "Volunteer role",
  job: "Job",
  other: "Other",
};

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
export const COMMITMENT_LABEL = { one_time: "One-time", ongoing: "Ongoing" } as const;

export const LIMITS = { title: 100, summary: 280, customDetails: 5, customLabel: 40, customValue: 120 } as const;

/** SDC itself as a publisher; admins can post as SDC. */
export const SDC_ORG = { id: "sdc", name: "Social Development Centre" } as const;
