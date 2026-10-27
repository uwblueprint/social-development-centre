import { redirect } from "next/navigation";

/**
 * The front door. Everything a signed-in person can do lives in the admin portal, so `/` only
 * forwards there: `/admin` decides whether they belong (`getCurrentAdmin`), and the proxy has
 * already sent anyone without a session to `/login`.
 *
 * The public intake form at `/intake-form` is reached by its own link, not from here.
 */
export default function Home() {
  redirect("/admin");
}
