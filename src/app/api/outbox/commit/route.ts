import type { NextRequest } from "next/server";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { OutboxChange, OutboxCommitResult } from "@/features/outbox/commit";

/**
 * Saves the Outbox's changes once their Undo has run out (the screen holds them until then, see
 * features/outbox/commit.ts). A route rather than a server action because a change still held when the tab
 * closes is sent with `fetch(..., { keepalive: true })`, which server actions can't do. The admin's own
 * session makes each call; every function checks is_admin itself.
 */
export async function POST(request: NextRequest) {
  let changes: OutboxChange[];
  try {
    const body = (await request.json()) as { changes?: unknown };
    if (!Array.isArray(body.changes)) throw new Error("no changes");
    changes = body.changes as OutboxChange[];
  } catch {
    return Response.json({ error: "Expected a list of changes" }, { status: 400 });
  }

  // What came in, for the server log: "approve ×1, edit ×1". No member details.
  console.info(
    "[outbox] commit:",
    changes.map((c) => `${c.kind} ×${c.kind === "edit" ? 1 : c.items.length}`).join(", "),
  );

  const supabase = await createClient();
  const results: OutboxCommitResult[] = [];
  for (const change of changes) {
    if (change.kind === "approve" || change.kind === "remove") {
      const { data, error } = await supabase.rpc(change.kind === "approve" ? "approve_sends" : "remove_sends", {
        p_items: change.items as unknown as Json,
      });
      if (error) return failed(error);
      results.push({ kind: change.kind, gone: data.filter((r) => r.result === "gone").length });
    } else if (change.kind === "edit") {
      const { error } = await supabase.rpc("edit_send", {
        p_occurrence_id: change.occurrence_id,
        p_person_id: change.person_id,
        p_subject: change.subject,
        p_body: change.body as Json,
      });
      // 55000: the send left the Outbox (sent, removed, or the email was unpublished) before the edit landed.
      if (error && error.code !== "55000") return failed(error);
      results.push({ kind: "edit", gone: error ? 1 : 0 });
    }
  }
  return Response.json({ results });
}

function failed(error: { code?: string; message: string }) {
  console.error("[outbox] commit failed:", error.code, error.message);
  const status = error.code === "42501" ? 403 : 500;
  return Response.json({ error: status === 403 ? "Only admins can change the Outbox" : "Couldn't save" }, { status });
}
