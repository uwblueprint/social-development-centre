import { conversion, signupLinkUrl, type SignupLink } from "./data";

/** One CSV field: quoted when it holds a comma, quote or line break, with quotes doubled. */
function field(value: string | number): string {
  let text = String(value);
  // Spreadsheets run a cell that starts with these as a formula; a leading apostrophe keeps it text.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Name, Link, Clicks, Joins and Conversion (blank when nobody has clicked), CRLF-separated, with a UTF-8 BOM so Excel reads accents. */
export function signupLinksCsv(links: SignupLink[]): string {
  const rows = [
    ["Name", "Link", "Clicks", "Joins", "Conversion"],
    ...links.map((l) => [l.name, signupLinkUrl(l.slug), l.clicks, l.joins, l.clicks === 0 ? "" : conversion(l)]),
  ];
  return "﻿" + rows.map((row) => row.map(field).join(",")).join("\r\n") + "\r\n";
}

/** The local date as YYYY-MM-DD. */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function downloadSignupLinksCsv(links: SignupLink[]) {
  const url = URL.createObjectURL(new Blob([signupLinksCsv(links)], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `signup-links-${today()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
