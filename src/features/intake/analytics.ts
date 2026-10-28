import { normalizeEmail } from "@/lib/email";
import { INTAKE_FORM_SOURCES, type IntakeFormSource } from "./copy";

export const INTAKE_PAGE_KEYS = ["welcome", "contact", "topics", "ways", "location", "time", "hopes"] as const;
export const INTAKE_VISIT_EXITS = ["next", "skip", "back", "submit", "not_interested", "exit"] as const;

export type IntakePageKey = (typeof INTAKE_PAGE_KEYS)[number];
export type IntakeVisitExit = (typeof INTAKE_VISIT_EXITS)[number];
export type IntakeTopicRanking = { rank: number; topic: string };
export type IntakeVisitAnswer = { field: string; value: string | string[] | IntakeTopicRanking[] };

export interface IntakePageVisitPayload {
  person_id: string;
  from: IntakeFormSource;
  key_id: string | null;
  page_key: IntakePageKey;
  total_ms: number;
  active_ms: number;
  first_answer_ms: number | null;
  last_answer_ms: number | null;
  left_via: IntakeVisitExit;
  answers: IntakeVisitAnswer[];
}

const pageFields: Record<IntakePageKey, readonly string[]> = {
  welcome: [],
  contact: [],
  topics: ["topics", "topicsOther"],
  ways: ["ways", "waysOther"],
  location: ["location"],
  time: ["timeAvailable"],
  hopes: ["hopes"],
};

const maximumDurationMs = 30 * 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isIntakePageKey(value: unknown): value is IntakePageKey {
  return typeof value === "string" && INTAKE_PAGE_KEYS.some((pageKey) => pageKey === value);
}

function isIntakeVisitExit(value: unknown): value is IntakeVisitExit {
  return typeof value === "string" && INTAKE_VISIT_EXITS.some((exit) => exit === value);
}

function isDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maximumDurationMs;
}

function isTopicRanking(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 9) return false;
  const ranks = new Set<number>();
  return value.every((item) => {
    if (!isRecord(item) || Object.keys(item).length !== 2 || typeof item.rank !== "number" || !Number.isInteger(item.rank) || typeof item.topic !== "string") return false;
    if (item.rank < 1 || item.rank > 9 || item.topic.length > 120 || ranks.has(item.rank)) return false;
    ranks.add(item.rank);
    return true;
  });
}

function isAnswer(value: unknown, pageKey: IntakePageKey): value is IntakeVisitAnswer {
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 2 ||
    typeof value.field !== "string" ||
    !pageFields[pageKey].includes(value.field) ||
    !("value" in value)
  ) return false;
  if (typeof value.value === "string") return value.value.length <= 600;
  if (pageKey === "topics" && value.field === "topics") return isTopicRanking(value.value);
  return Array.isArray(value.value) && value.value.length <= 8 && value.value.every((item) => typeof item === "string" && item.length <= 120);
}

export function isIntakePageVisitPayload(value: unknown): value is IntakePageVisitPayload {
  if (!isRecord(value)) return false;
  if (Object.keys(value).some((key) => !["person_id", "from", "key_id", "page_key", "total_ms", "active_ms", "first_answer_ms", "last_answer_ms", "left_via", "answers"].includes(key))) return false;
  if (!isUuid(value.person_id)) return false;
  if (typeof value.from !== "string" || !INTAKE_FORM_SOURCES.some((source) => source === value.from)) return false;
  if (value.key_id !== null && (typeof value.key_id !== "string" || value.key_id.length > 254 || normalizeEmail(value.key_id) !== value.key_id)) return false;
  if (!isIntakePageKey(value.page_key) || !isIntakeVisitExit(value.left_via)) return false;
  if (!isDuration(value.total_ms) || !isDuration(value.active_ms) || value.active_ms > value.total_ms) return false;

  const firstAnswerMs = value.first_answer_ms;
  const lastAnswerMs = value.last_answer_ms;
  if (firstAnswerMs !== null && (!isDuration(firstAnswerMs) || firstAnswerMs > value.total_ms)) return false;
  if (lastAnswerMs !== null && (!isDuration(lastAnswerMs) || lastAnswerMs > value.total_ms)) return false;
  if ((firstAnswerMs === null) !== (lastAnswerMs === null)) return false;
  if (firstAnswerMs !== null && lastAnswerMs !== null && firstAnswerMs > lastAnswerMs) return false;
  if (!Array.isArray(value.answers) || value.answers.length > 8) return false;

  const pageKey = value.page_key;
  return value.answers.every((answer) => isAnswer(answer, pageKey));
}
