/*
 * Small CSV helpers for the member import dialog: parse, detect columns, check rows, write CSV.
 * Frontend only. The real import validates again on the server (docs/backend/member-directory.md, "Bulk import").
 */

export type ImportField = "email" | "firstName" | "lastName" | "tags" | "skip";

/** Most rows one import takes. The server enforces the same limit. */
export const MAX_IMPORT_ROWS = 1000;

/** Parses CSV text into rows of cells. Handles a BOM, CRLF or CR line endings, quoted fields, "" escapes and commas or line breaks inside quotes. Blank lines are dropped. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") endCell();
    else if (ch === "\n") endRow();
    else if (ch === "\r") {
      if (src[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  if (cell !== "" || row.length) endRow();
  return rows;
}

/** Writes rows as CSV (CRLF). Cells that start like a spreadsheet formula get a leading apostrophe so Excel doesn't run them. */
export function toCsv(rows: string[][]): string {
  const cell = (raw: string) => {
    const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Saves text as a file in the browser (the real feature does the same client-side). */
export function downloadCsv(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const GUESSES: Record<Exclude<ImportField, "skip">, string[]> = {
  email: ["email", "emailaddress", "mail", "email1"],
  firstName: ["firstname", "first", "givenname", "given", "forename"],
  lastName: ["lastname", "last", "surname", "familyname"],
  tags: ["tags", "tag", "groups", "labels"],
};

/** Guesses a field per header, case-insensitively. A field is used once: the first matching column wins. */
export function detectFields(headers: string[]): ImportField[] {
  const used = new Set<ImportField>();
  return headers.map((h) => {
    const key = norm(h);
    const hit = (Object.keys(GUESSES) as (keyof typeof GUESSES)[]).find((f) => GUESSES[f].includes(key));
    if (!hit || used.has(hit)) return "skip";
    used.add(hit);
    return hit;
  });
}

export const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/** Tags are separated by ; or |. Blanks and repeats are dropped; a name matching a known tag (any case) takes that tag's spelling. */
export function splitTags(raw: string, known: string[]): string[] {
  const byLower = new Map(known.map((t) => [t.toLowerCase(), t]));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[;|]/)) {
    const name = part.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(byLower.get(key) ?? name);
  }
  return out;
}

export type RowIssue = "missing" | "invalid" | "duplicate" | "existing";

export interface CheckedRow {
  /** 1-based row number in the file, counting the header as row 1 (what a spreadsheet shows). */
  line: number;
  raw: string[];
  firstName: string;
  lastName: string;
  email: string;
  tags: string[];
  issue?: RowIssue;
}

/** Applies the column mapping to the data rows and flags each row's issue. `existingEmails` is compared case-insensitively. */
export function checkRows(
  data: string[][],
  fields: ImportField[],
  existingEmails: Set<string>,
  knownTags: string[],
): CheckedRow[] {
  const col = (f: ImportField) => fields.indexOf(f);
  const get = (r: string[], f: ImportField) => (col(f) < 0 ? "" : (r[col(f)] ?? "").trim());
  const existing = new Set([...existingEmails].map((e) => e.toLowerCase()));
  const seen = new Set<string>();
  return data.map((raw, i) => {
    const email = get(raw, "email");
    const key = email.toLowerCase();
    let issue: RowIssue | undefined;
    if (!email) issue = "missing";
    else if (!validEmail(email)) issue = "invalid";
    else if (seen.has(key)) issue = "duplicate";
    else if (existing.has(key)) issue = "existing";
    if (email && validEmail(email)) seen.add(key);
    return {
      line: i + 2,
      raw,
      firstName: get(raw, "firstName"),
      lastName: get(raw, "lastName"),
      email,
      tags: splitTags(get(raw, "tags"), knownTags),
      issue,
    };
  });
}

export const TEMPLATE_CSV = toCsv([
  ["Email", "First name", "Last name", "Tags"],
  ["alex@example.com", "Alex", "Rivera", "Ride for Refuge; Volunteer"],
  ["sam@example.com", "Sam", "Chen", "Ride for Refuge"],
]);
