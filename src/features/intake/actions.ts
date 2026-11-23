"use server";

import type { ActionState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { intakeCopy } from "./copy";
import { EMAIL_PATTERN, isIntakeFormSource, type IntakeSubmission } from "./submit";

/**
 * Saves the intake form through `submit_intake`, which upserts one `intake_submissions` row keyed on
 * `submissionId`. The form is open to anyone, so the details come from the browser: they are trimmed,
 * lowercased and re-validated here, and `submit_intake` checks them again before storing anything.
 *
 * Takes the submission as an argument rather than FormData: the form is a multi-step flow that keeps
 * its answers in React state, so there is no single form post to read.
 *
 * Returns an ActionState and does not redirect, because the flow shows its own confirmation step
 * before ending. On `error` it keeps the answers so the person can try again; the retry is safe
 * because `submit_intake` upserts on `submissionId` rather than inserting a second row.
 */
export async function submitIntake(submission: IntakeSubmission): Promise<ActionState> {
  const firstName = submission.firstName.trim();
  const lastName = submission.lastName.trim();
  const email = submission.email.trim().toLowerCase();

  // The flow validates these on the details step; reaching here invalid means the payload was built
  // some other way, so say which step to fix rather than blaming the connection.
  if (!firstName || !lastName || !EMAIL_PATTERN.test(email) || !isIntakeFormSource(submission.formSource)) {
    return { status: "error", message: intakeCopy.submitInvalidDetails };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_intake", {
    p_submission_id: submission.submissionId,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
    p_form_source: submission.formSource,
    p_answers: {
      submittedAt: submission.submittedAt,
      topics: submission.topics,
      topicsOther: submission.topicsOther,
      ways: submission.ways,
      waysOther: submission.waysOther,
      location: submission.location,
      timeAvailable: submission.timeAvailable,
      hopes: submission.hopes,
    },
  });

  if (error) {
    console.error("submit_intake failed:", error.message);
    return { status: "error", message: intakeCopy.submitFailed };
  }
  return { status: "success" };
}
