const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed and lowercased, or null if it isn't an email address. */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}
