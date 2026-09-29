import type { ActionState } from "@/lib/forms";
import { normalizeWebAddress } from "@/lib/url";
import { orgs, type StoredOrg } from "./store";
import { ORGANIZATION_DESCRIPTION_MAX, ORGANIZATION_NOTES_MAX } from "./types";

/*
 * Organization profile rules shared by the admin (Partners) and partner (/partner/organization) actions,
 * so both portals validate name, website and description the same way and say the same thing.
 * FormData fields: name, website, description. A field that isn't in the FormData is left unchanged.
 */

export const profileMessages = {
  nameMissing: "Enter the organization's name.",
  nameTaken: "Another organization already has this name.",
  websiteInvalid: "Enter a valid website, like sdckw.ca.",
  descriptionTooLong: `Shorten the description to ${ORGANIZATION_DESCRIPTION_MAX} characters or fewer.`,
  /** Names what changed. */
  saved: (what: string) => `Changes to ${what} saved.`,
} as const;

/** Organization-level results on Partners (admin only). */
export const organizationMessages = {
  /** Toast after dismissing a health tag. */
  healthDismissed: (organization: string) => `Dismissed the warning for ${organization}. It comes back only if something else changes.`,
  chooseOrganization: "Choose an organization, or add a new one.",
  nameExists: "An organization with this name already exists. Choose it from the list.",
  removed: (organization: string) => `${organization} no longer has access. Its opportunities are closed.`,
  alreadyRemoved: "This organization's access was already removed.",
  missing: "This organization could not be found.",
  reinvited: (email: string, organization: string) => `Invitation sent to ${email}. ${organization} is awaiting a response.`,
} as const;

/** SDC notes on an organization (admin only). */
export const notesMessages = {
  saved: (organization: string) => `Notes for ${organization} saved.`,
  tooLong: `Shorten the notes to ${ORGANIZATION_NOTES_MAX.toLocaleString("en-CA")} characters or fewer.`,
} as const;

export interface ProfileChanges {
  name?: string;
  website?: string;
  description?: string;
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
    if (!name) fieldErrors.name = profileMessages.nameMissing;
    else if (orgs().some((o) => o !== org && o.name.toLowerCase() === name.toLowerCase())) {
      fieldErrors.name = profileMessages.nameTaken;
    } else changes.name = name;
  }

  if (fd.has("website")) {
    const website = String(fd.get("website") ?? "").trim();
    // "sdckw.ca", "www.sdckw.ca" and "https://sdckw.ca" are all fine; stored as https://.
    const normalized = website ? normalizeWebAddress(website) : "";
    if (normalized === null) fieldErrors.website = profileMessages.websiteInvalid;
    else changes.website = normalized;
  }

  if (fd.has("description")) {
    const description = String(fd.get("description") ?? "").trim();
    if (description.length > ORGANIZATION_DESCRIPTION_MAX) fieldErrors.description = profileMessages.descriptionTooLong;
    else changes.description = description;
  }

  return Object.keys(fieldErrors).length ? { fieldErrors } : { changes };
}

export function applyOrganizationProfile(org: StoredOrg, changes: ProfileChanges) {
  if (changes.name !== undefined) org.name = changes.name;
  if (changes.website !== undefined) org.website = changes.website || undefined;
  if (changes.description !== undefined) org.description = changes.description || undefined;
}

/** Field errors only: the form shows them inline and focuses the first one. No summary toast. */
export const profileFieldsError = (fieldErrors: Record<string, string>): ActionState => ({ status: "error", fieldErrors });
