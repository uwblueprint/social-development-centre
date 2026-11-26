import type { MemberRow } from "../types";
import { localDay } from "./dates";

const HEADER = ["First name", "Last name", "Email", "Joined", "Membership ends", "Subscribed", "Tags"];

/** The members on screen (filtered, or the selected rows) as a spreadsheet (client, 23 Oct). */
export function toCsv(rows: MemberRow[]): string {
  const cell = (value: string) => {
    // A leading = + - @ makes a spreadsheet run the cell as a formula; quote it as text instead.
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const body = rows.map((m) =>
    [
      m.firstName ?? "",
      m.lastName ?? "",
      m.email,
      localDay(m.joinedAt),
      m.endsAt,
      m.subscription === "subscribed" ? "Yes" : "No",
      m.tags.map((t) => t.name).join("; "),
    ]
      .map(cell)
      .join(","),
  );
  return [HEADER.map(cell).join(","), ...body].join("\r\n");
}
