/** After any send, Resend waits 60 seconds (Figma annotation on member screen 7; partners too). */
export const RESEND_COOLDOWN_MS = 60_000;

/**
 * Where to go after signing in (member screen 11: back to the shared opportunity). Only same-site paths
 * survive, so a crafted link can't send someone to "//evil.example" or "/\evil.example".
 */
export function safeReturnPath(next: string | undefined): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return undefined;
  return next;
}
