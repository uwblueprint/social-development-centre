import type { MomentType } from "../model";

/* Writing prompts: the placeholder of an empty message. Per moment; PM to confirm the wording (see docs/emails-prototype/flags-editor.md). */
export const PROMPT_BY_MOMENT: Record<MomentType, string> = {
  "join-any": "Thank them. Say what happens next.",
  "join-no-referral": "Thank them. Say what happens next.",
  "join-referral": "Thank them. Mention who referred them.",
  "refers-someone": "Thank them for spreading the word.",
  "referral-joins": "Tell them their referral joined.",
  "tag-added": "Say why they got this. Say what to do next.",
};

export const ONE_OFF_PROMPT = "What is new, and what should they do?";

export const copy = {
  subjectLabel: "Subject",
  messageLabel: "Message",
  jump: "Go to",
  insertVariable: "Insert variable",
  fallbackLabel: "If empty, show",
  testSent: "Test sent",
  missingMember: "Missing details",
} as const;
