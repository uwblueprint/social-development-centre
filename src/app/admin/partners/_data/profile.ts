import type { ActionState } from "@/lib/forms";
import { orgs } from "./store";
import { ORGANIZATION_DESCRIPTION_MAX } from "./types";

/*
 * Organization profile rules shared by the admin (Partners) and partner (/partner/organization) actions,
 * so both portals validate name, website and description the same way.
 * FormData fields: name, website, description. A field that isn't in the FormData is left unchanged,
 * so a form can edit a subset (the admin panel saves the name separately from the profile).
 */

type StoredOrg = ReturnType<typeof orgs>[number];

export interface ProfileChanges {
  name?: string;
  website?: string;
  description?: string;
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Validates the profile fields present in `fd`. Returns the changes, or field errors keyed by field name. */
export function readOrganizationProfile(
  org: StoredOrg,
  fd: FormData,
): { changes: ProfileChanges; fieldErrors?: undefined } | { changes?: undefined; fieldErrors: Record<string, string> } {
  const changes: ProfileChanges = {};
  const fieldErrors: Record<string, string> = {};

  if (fd.has("name")) {
    const name = String(fd.get("name") ?? "").trim();
    if (!name) fieldErrors.name = "Enter the organization's name.";
    else if (orgs().some((o) => o !== org && o.name.toLowerCase() === name.toLowerCase())) {
      fieldErrors.name = "Another organization already has this name.";
    } else changes.name = name;
  }

  if (fd.has("website")) {
    const website = String(fd.get("website") ?? "").trim();
    if (website && !isHttpsUrl(website)) fieldErrors.website = "Enter a web address that starts with https://, like https://example.org.";
    else changes.website = website;
  }

  if (fd.has("description")) {
    const description = String(fd.get("description") ?? "").trim();
    if (description.length > ORGANIZATION_DESCRIPTION_MAX) {
      fieldErrors.description = `Shorten the description to ${ORGANIZATION_DESCRIPTION_MAX} characters or fewer.`;
    } else changes.description = description;
  }

  return Object.keys(fieldErrors).length ? { fieldErrors } : { changes };
}

export function applyOrganizationProfile(org: StoredOrg, changes: ProfileChanges) {
  if (changes.name !== undefined) org.name = changes.name;
  if (changes.website !== undefined) org.website = changes.website || undefined;
  if (changes.description !== undefined) org.description = changes.description || undefined;
}

export const profileFieldsError = (fieldErrors: Record<string, string>): ActionState => ({
  status: "error",
  message: Object.keys(fieldErrors).length === 1 ? "Check the highlighted field." : "Check the highlighted fields.",
  fieldErrors,
});
