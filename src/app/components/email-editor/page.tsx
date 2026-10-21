import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/admin/_components/PlaceholderPage";
import { EmailEditorDemo } from "./EmailEditorDemo";

export const metadata: Metadata = { title: "Email editor" };

export default function EmailEditorPage() {
  return (
    <div>
      <PlaceholderPage
        title="Email editor"
        description="Subject, message and attachments, as used for automatic emails, one-off emails and Outbox edits. Sample content; nothing is saved or sent."
      />
      <div style={{ padding: "0 var(--space-6) var(--space-7)" }}>
        <EmailEditorDemo />
      </div>
    </div>
  );
}
