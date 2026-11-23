/** Every screen in the sign-in prototype, in flow order. Open one with /prototypes/sign-in?state=<id>. */
export const stateGroups = [
  {
    title: "Sign in",
    states: [
      { id: "sign-in", label: "Enter email" },
      {
        id: "welcome-back",
        label: "Welcome back (email remembered on this device, no name)",
      },
      { id: "session-ended", label: "Signed out after 7 days" },
      { id: "signed-out", label: "Signed out on purpose" },
      { id: "sign-in-empty", label: "Error: no email" },
      { id: "sign-in-invalid", label: "Error: not an email" },
      { id: "sign-in-typo", label: "Typo in the domain: offer the fix" },
      { id: "sign-in-rate-limited", label: "Error: too many links" },
      { id: "sign-in-offline", label: "Error: offline" },
    ],
  },
  {
    title: "Check your email",
    states: [
      { id: "check-email", label: "Sent, resend waiting" },
      {
        id: "check-email-work",
        label: "Sent, resend ready",
      },
      { id: "check-email-resent", label: "Sent again" },
      { id: "signed-in-elsewhere", label: "Link opened in another tab" },
    ],
  },
  {
    title: "The email",
    states: [{ id: "email-sign-in", label: "Sign-in link" }],
  },
  {
    title: "Opening the link",
    states: [
      { id: "link-expired", label: "Link expired or already used" },
      { id: "link-broken", label: "Link cut off or changed" },
      { id: "access-removed", label: "No longer an admin" },
      { id: "error", label: "Something went wrong" },
    ],
  },
] as const;

export type StateId = (typeof stateGroups)[number]["states"][number]["id"];

export const stateIds: readonly string[] = stateGroups.flatMap((group) =>
  group.states.map((state) => state.id),
);

export const isStateId = (value: unknown): value is StateId =>
  typeof value === "string" && stateIds.includes(value);
