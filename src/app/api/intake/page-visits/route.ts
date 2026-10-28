import { createClient } from "@/lib/supabase/server";
import { isIntakePageVisitPayload } from "@/features/intake/analytics";

const maximumRequestLength = 8_192;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Origin not allowed" }, { status: 403 });
  }

  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return Response.json({ error: "Expected application/json" }, { status: 415 });
  }

  const body = await request.text();
  if (body.length > maximumRequestLength) {
    return Response.json({ error: "Request is too large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isIntakePageVisitPayload(payload)) {
    return Response.json({ error: "Invalid page visit" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_intake_page_visit", {
    p_person_id: payload.person_id,
    p_from: payload.from,
    p_key_id: payload.key_id?.trim().toLowerCase() ?? null,
    p_page_key: payload.page_key,
    p_total_ms: payload.total_ms,
    p_active_ms: payload.active_ms,
    p_first_answer_ms: payload.first_answer_ms,
    p_last_answer_ms: payload.last_answer_ms,
    p_left_via: payload.left_via,
    p_answers: payload.answers,
  });

  if (error) {
    console.error("record_intake_page_visit failed:", error.message);
    return Response.json({ error: "Could not record page visit" }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
