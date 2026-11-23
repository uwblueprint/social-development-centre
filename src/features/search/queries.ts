import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DEMO_EMAILS, DEMO_PEOPLE } from "./demo";
import type { EmailHit, Loaded, PersonHit, SearchIndex } from "./types";

/** Like getCurrentAdmin: without Supabase credentials in dev, search runs on demo data. */
const demo = () => process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Everyone on the People page and every automatic email, for the palette to filter in the browser.
 * About 150 people, so one small list beats a query per keystroke (see docs/backend/command-k.md for
 * when to change that). Row-level security limits both tables to admins, on top of the route's check.
 */
export async function getSearchIndex(): Promise<SearchIndex> {
  if (demo()) return { people: { status: "ok", items: DEMO_PEOPLE }, emails: { status: "ok", items: DEMO_EMAILS } };

  const supabase = await createClient();
  const [people, emails] = await Promise.all([
    supabase.from("memberships").select("person:people!person_id(id, email, full_name)"),
    supabase.from("automatic_emails").select("id, name").order("created_at", { ascending: true }),
  ]);

  return {
    people: loaded(people, (rows) =>
      rows.map(({ person }): PersonHit => ({ id: person.id, name: person.full_name, email: person.email })),
    ),
    emails: loaded(emails, (rows): EmailHit[] => rows),
  };
}

function loaded<Row, T>(
  result: { data: Row[] | null; error: { message: string } | null },
  map: (rows: Row[]) => T[],
): Loaded<T> {
  if (result.error || !result.data) {
    console.error("[search]", result.error?.message);
    return { status: "error" };
  }
  return { status: "ok", items: map(result.data) };
}
