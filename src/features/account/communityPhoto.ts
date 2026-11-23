/*
 * Community Photos on demo data. Nothing here touches a server: uploads stay in this browser and are gone on reload.
 * The backend this stands in for is in docs/backend/settings.md ("Community Photos").
 */

/** The photo at the top of the referral page, and its alt text. */
export interface CommunityPhoto {
  /** Where the browser loads it from. Demo: an object URL for the picked file. */
  url: string;
  fileName: string;
  alt: string;
}

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const ALT_MAX_LENGTH = 250;

/** Demo: no photo has been uploaded yet. */
export const initialCommunityPhoto: CommunityPhoto | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Uploads the file so it can be previewed; it only replaces the live photo on Save.
 * Demo: takes a second, and fails for any file whose name contains "fail", so that state can be tried.
 */
export async function uploadCommunityPhoto(file: File, url: string): Promise<{ ok: true; url: string } | { ok: false }> {
  await wait(1000);
  return /fail/i.test(file.name) ? { ok: false } : { ok: true, url };
}

/** Makes the uploaded photo and its alt text live, or removes the photo when given `null`. Demo: always works. */
export async function saveCommunityPhoto(
  photo: CommunityPhoto | null,
): Promise<{ ok: true; photo: CommunityPhoto | null }> {
  await wait(400);
  return { ok: true, photo };
}
