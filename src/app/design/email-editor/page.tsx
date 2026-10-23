import type { Metadata } from "next";
import { styled } from "next-yak";
import { PlaceholderPage } from "@/app/admin/_components/PlaceholderPage";
import { EmailEditorDemo } from "./EmailEditorDemo";

export const metadata: Metadata = { title: "Email editor" };

const Content = styled.div`
  max-width: 880px;
  padding: 0 var(--space-6) var(--space-7);

  @media (max-width: 767px) {
    padding: 0 var(--space-4) var(--space-6);
  }
`;

export default function EmailEditorPage() {
  return (
    <div>
      <PlaceholderPage
        title="Email editor"
        description="Subject and message, as used for automatic emails, one-off emails and Outbox edits. Sample content; nothing is saved or sent."
      />
      <Content>
        <EmailEditorDemo />
      </Content>
    </div>
  );
}
