/**
 * Pure helpers for Add member / Import members, shared by the server actions and the dialog.
 * Parsing is forgiving so common admin mistakes still land where they meant them to:
 * mixed separators, capitals, "mailto:", trailing punctuation, "Name <email>" and
 * "Name email" lines, repeated addresses and spreadsheet exports.
 */

import type { ImportEntry, ImportPreview } from "../_data/types";

export const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:".]{2,}$/;

export interface ParsedInput {
  /** Valid, distinct addresses in input order; the first name given for an address wins. */
  entries: ImportEntry[];
  /** Addresses that appeared more than once. */
  duplicates: string[];
  /** Entries that aren't email addresses, as typed. */
  invalid: string[];
}

/** Strips "mailto:", wrapping quotes/brackets and trailing punctuation, and lowercases. */
export function cleanAddress(token: string): string {
  return token
    .trim()
    .replace(/^mailto:/i, "")
    .replace(/^[<("'[]+|[>)"'\].,;:]+$/g, "")
    .toLowerCase();
}

const cleanName = (name: string) => name.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, " ").trim() || undefined;

/** "Name <email>" pairs, with optional quotes around the name (as email clients copy them). */
const ANGLE = /(?:"([^"]*)"|((?:(?<![^\s,;])[^\s<>,;"@]+[ \t]+)*))[ \t]*<([^<>\n]*)>/g;

export function parseInput(raw: string): ParsedInput {
  const found: ImportEntry[] = [];
  const invalid: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const rest = line.replace(ANGLE, (_m, quoted: string | undefined, bare: string | undefined, address: string) => {
      const email = cleanAddress(address);
      if (EMAIL.test(email)) found.push({ email, name: cleanName(quoted ?? bare ?? "") });
      else invalid.push(address.trim() || line.trim());
      return ",";
    });

    for (const chunk of rest.split(/[,;\t]+/)) {
      const tokens = chunk.trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) continue;
      const addresses = tokens.filter((t) => t.includes("@"));
      const words = tokens.filter((t) => !t.includes("@"));
      if (addresses.length === 0) {
        invalid.push(chunk.trim());
        continue;
      }
      // "Ada Lovelace ada@example.org": one address with words around it, so the words are its name.
      const name = addresses.length === 1 ? cleanName(words.join(" ")) : undefined;
      if (addresses.length > 1) invalid.push(...words);
      for (const token of addresses) {
        const email = cleanAddress(token);
        if (EMAIL.test(email)) found.push({ email, name });
        else invalid.push(token);
      }
    }
  }

  const byEmail = new Map<string, ImportEntry>();
  const duplicates = new Set<string>();
  for (const entry of found) {
    const existing = byEmail.get(entry.email);
    if (!existing) byEmail.set(entry.email, { ...entry });
    else {
      duplicates.add(entry.email);
      existing.name ??= entry.name;
    }
  }
  return { entries: [...byEmail.values()], duplicates: [...duplicates], invalid: [...new Set(invalid)] };
}

/** Splits CSV text into rows of cells, honouring quoted cells. */
function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  rows.push(row);
  return rows.map((r) => r.map((v) => v.trim())).filter((r) => r.some(Boolean));
}

/**
 * Turns an uploaded CSV into one "Name <email>" (or bare email) line per row, for the text box,
 * so the admin sees and can edit what was loaded. Finds the email column by its header
 * ("Email", "E-mail address"…) or, without a header, by the cell that contains "@".
 */
export function csvToLines(text: string): string[] {
  const rows = csvRows(text.replace(/^﻿/, ""));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.toLowerCase());
  const emailCol = header.findIndex((h) => /e-?mail/.test(h) && !h.includes("@"));
  const nameCol = header.findIndex((h) => h === "name" || h === "full name");
  const firstCol = header.findIndex((h) => h.startsWith("first"));
  const lastCol = header.findIndex((h) => h.startsWith("last") || h === "surname");
  const body = emailCol >= 0 ? rows.slice(1) : rows;

  return body
    .map((cells) => {
      const email = emailCol >= 0 ? (cells[emailCol] ?? "") : (cells.find((c) => c.includes("@")) ?? cells.join(" "));
      const name =
        emailCol < 0
          ? cells.length === 2 && email.includes("@")
            ? cells.find((c) => c !== email)
            : undefined
          : nameCol >= 0
            ? cells[nameCol]
            : [cells[firstCol] ?? "", cells[lastCol] ?? ""].filter(Boolean).join(" ");
      // Commas and angle brackets in names would split the line when it's parsed again.
      const safeName = name?.replace(/[,;<>"]/g, " ").replace(/\s+/g, " ").trim();
      return safeName && email ? `${safeName} <${email}>` : email;
    })
    .filter(Boolean);
}

export interface PreviewSummary {
  /** Records that will change on confirm. */
  changes: number;
  /** Emails that will be sent on confirm. */
  emails: number;
}

/** What confirming will do, given the preview and whether admin-unsubscribed people are resubscribed. */
export function summarizePreview(p: ImportPreview, resubscribe: boolean): PreviewSummary {
  const adminConverts = p.unsubscribedAdmin.filter((e) => e.willConvert).length;
  return {
    changes:
      p.added.length +
      p.converted.length +
      p.unsubscribedSelf.filter((e) => e.willConvert).length +
      (resubscribe ? p.unsubscribedAdmin.length : adminConverts),
    // Resubscribing sends no welcome; a resubscribed person who's converted gets the Paying membership added email.
    emails: p.added.length + p.converted.length + (resubscribe ? adminConverts : 0),
  };
}
