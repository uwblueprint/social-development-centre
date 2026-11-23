import { getCurrentAdmin } from "@/app/admin/_data/session";
import { getSearchIndex } from "@/features/search/queries";

/**
 * The search palette's people and automatic emails. A route handler, not a server action: this Next
 * version runs server actions one at a time, and a read the palette may cancel shouldn't queue behind
 * a save. Checks the admin on every call, like the pages do.
 */
export async function GET() {
  if (!(await getCurrentAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getSearchIndex(), { headers: { "Cache-Control": "private, no-store" } });
}
