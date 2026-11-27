import type { JSONContent } from "@tiptap/react";

/**
 * The editor's document as plain data. ProseMirror builds each node's and mark's `attrs` with no prototype
 * (Object.create(null)), and React sends such objects to a server action as unreadable references, so a
 * document with a chip, a link, a heading or an image couldn't be saved. A JSON round trip makes them
 * ordinary objects.
 */
export const plainJson = <T extends JSONContent>(doc: T): T => JSON.parse(JSON.stringify(doc)) as T;
