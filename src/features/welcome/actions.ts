"use server";

import { requireMember } from "@/features/auth/session";
import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { surveyCopy } from "./copy";
import type { SurveySubmission } from "./submit";

/**
 * Saves the survey through `submit_welcome`, which sets `people.full_name` and upserts the person's
 * `welcome_answers` row. Identity is `current_person_id()` inside that function, resolved from the
 * session — the browser never says who it is.
 *
 * Takes the submission as an argument rather than FormData: the survey is a multi-step flow that
 * keeps its answers in React state, so there is no single form post to read.
 *
 * Returns an ActionState and does not redirect, because the flow shows its own confirmation step
 * (with the name the person gave) before leaving. On `error` it keeps the answers so the person can
 * try again; the retry is safe because `submit_welcome` upserts rather than inserting.
 */
export async function submitSurvey(submission: SurveySubmission): Promise<ActionState> {
  await requireMember();

  const { name, ...answers } = submission;
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_welcome", {
    p_full_name: name,
    p_answers: answers,
  });

  if (error) {
    console.error("submit_welcome failed:", error.message);
    return { status: "error", message: surveyCopy.submitFailed };
  }
  return { status: "success" };
}
