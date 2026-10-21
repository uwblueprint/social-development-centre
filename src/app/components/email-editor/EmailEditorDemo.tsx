"use client";

import * as React from "react";
import type { JSONContent } from "@tiptap/react";
import { EmailEditor } from "@/features/email-editor";

const chip = (id: string): JSONContent => ({ type: "personalizedText", attrs: { id } });
const p = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });
const t = (text: string, marks?: JSONContent["marks"]): JSONContent => ({ type: "text", text, ...(marks ? { marks } : {}) });

const subject: JSONContent = { type: "doc", content: [p(t("Welcome to SDC, "), chip("first_name"))] };

const body: JSONContent = {
  type: "doc",
  content: [
    p(t("Hi "), chip("first_name"), t(",")),
    p(t("Thank you for joining the Social Development Centre. "), chip("referrer_first_name"), t(" told us you'd be a great fit, and we're glad you're here.")),
    { type: "heading", attrs: { level: 1 }, content: [t("What happens next")] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [p(t("You'll get our member update on the first Monday of each month."))] },
        {
          type: "listItem",
          content: [p(t("Volunteer shifts open two weeks ahead. "), t("See this month's shifts", [{ type: "link", attrs: { href: "https://example.org/sdc/volunteer" } }]))],
        },
      ],
    },
    { type: "blockquote", content: [p(t("The first time I came, I only meant to drop off a form. I stayed for three hours."))] },
    p(t("If anything is unclear, just reply to this email. It comes straight to me.")),
    p(t("Suhanya")),
  ],
};

/** Saves "draft" a second after typing stops, the way a page using the editor should. */
export function EmailEditorDemo() {
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle");
  const [fallbacks, setFallbacks] = React.useState<Record<string, string>>({});
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <EmailEditor
      moment="joins_referral"
      initialSubject={subject}
      initialBody={body}
      footer={{ sender: "Suhanya at SDC", address: "Social Development Centre Waterloo Region · mailing address to come" }}
      fallbacks={fallbacks}
      onFallbackChange={(id, value) => setFallbacks((f) => ({ ...f, [id]: value }))}
      saveState={saveState}
      onChange={() => {
        setSaveState("saving");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setSaveState("saved"), 1000);
      }}
    />
  );
}
