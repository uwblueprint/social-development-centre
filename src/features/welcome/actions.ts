"use server";

import { requireMember } from "@/features/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const pageVisitLeaveVias = new Set(["next", "back", "close", "submit"]);
const maxPageVisitBytes = 64 * 1024;

type PageVisitPayload = {
  page_key: string;
  total_ms: number;
  active_ms: number;
  first_answer_ms: number | null;
  last_answer_ms: number | null;
  left_via: string;
  answers: Array<{
    question_key: string;
    value: Json;
    ms_since_enter: number;
    ms_since_prev: number;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isJson(value: unknown, depth = 0): value is Json {
  if (depth > 20) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((item) => isJson(item, depth + 1));
  return isRecord(value) && Object.values(value).every((item) => isJson(item, depth + 1));
}

function isPageVisitPayload(value: unknown): value is PageVisitPayload {
  if (!isRecord(value)) return false;
  if (typeof value.page_key !== "string" || value.page_key.length === 0 || value.page_key.length > 128) return false;
  if (!isNonNegativeInteger(value.total_ms) || !isNonNegativeInteger(value.active_ms)) return false;
  if (value.first_answer_ms !== null && !isNonNegativeInteger(value.first_answer_ms)) return false;
  if (value.last_answer_ms !== null && !isNonNegativeInteger(value.last_answer_ms)) return false;
  if (typeof value.left_via !== "string" || !pageVisitLeaveVias.has(value.left_via)) return false;
  if (!Array.isArray(value.answers) || value.answers.length > 200) return false;

  return value.answers.every((answer) =>
    isRecord(answer) &&
    typeof answer.question_key === "string" &&
    answer.question_key.length > 0 &&
    answer.question_key.length <= 128 &&
    isNonNegativeInteger(answer.ms_since_enter) &&
    isNonNegativeInteger(answer.ms_since_prev) &&
    isJson(answer.value),
  );
}

export async function recordPageVisit(input: unknown): Promise<void> {
  if (!isPageVisitPayload(input)) return;
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > maxPageVisitBytes) return;

  try {
    const member = await requireMember();
    const supabase = await createClient();
    const { error } = await supabase.from("page_visits").insert({
      person_id: member.id,
      key_id: member.email,
      page_key: input.page_key,
      total_ms: input.total_ms,
      active_ms: input.active_ms,
      first_answer_ms: input.first_answer_ms,
      last_answer_ms: input.last_answer_ms,
      left_via: input.left_via,
      answers: input.answers,
    });

    if (error) console.error("page_visits insert failed:", error.message);
  } catch (error) {
    console.error("Could not record page visit:", error);
  }
}
