import { currentContacts, orgs, statusOf } from "@/app/admin/partners/_data/store";
import type { PartnerUser } from "./types";

/**
 * Backend: return the signed-in partner contact and their organization, or null if the user
 * isn't an active contact of a current (not removed) partner organization. The layout then
 * redirects to /login. Every partner action must re-check this; see docs/backend/opportunities.md.
 */
export async function getCurrentPartner(): Promise<PartnerUser | null> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("getCurrentPartner is not implemented: add the partner role check before shipping.");
  }
  // Dev: sign in as the first active contact of the first active organization (Amara at Northside Food Bank).
  const org = orgs().find((o) => statusOf(o) === "active");
  const contact = org && currentContacts(org).find((c) => c.status === "active");
  if (!org || !contact) return null;
  const initials = contact.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return { name: contact.name, email: contact.email, initials, organization: { id: org.id, name: org.name } };
}
