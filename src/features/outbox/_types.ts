import type { JSONContent } from "@tiptap/react";

/** The list's tabs. "failed" only exists while something couldn't send. */
export type PanelMode = "review" | "all" | "failed";

export type BulkKind = "approve" | "delete";

/** The email open in place of the calendar, with the edits typed so far. */
export interface OpenEmail {
  id: string;
  editing: boolean;
  /** The Email Editor's documents (TipTap JSON), not text: formatting is part of the edit. */
  draftSubject: JSONContent;
  draftBody: JSONContent;
}
