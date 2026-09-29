import type { ActionState } from "@/lib/forms";
import { normalizeWebAddress } from "@/lib/url";
import { dayOffset } from "./store";
import type { Area } from "./types";

/**
 * SPIKE: "Fill in details" from an Eventbrite link (docs/backend/opportunities.md#eventbrite-prefill).
 * Dev mock: any eventbrite.ca or eventbrite.com event link returns made-up details derived from its URL.
 * The real version reads the event from the Eventbrite API (GET /v3/events/{id}/?expand=venue) with SDC's
 * private token, server-side only. Each portal's actions.ts binds the session before calling this.
 */

/** What the form fills in. Every field is a value the form already takes (dates yyyy-mm-dd, times HH:mm). */
export interface EventbritePrefill {
  /** The normalized https link; the form uses it as the listing's Link when that's empty. */
  link: string;
  title: string;
  summary: string;
  date: string;
  startTime: string;
  endTime?: string;
  area: Area;
}

const EVENTBRITE_HOST = /(^|\.)eventbrite\.(ca|com)$/i;

/** "/e/community-potluck-tickets-123456" → "Community potluck". */
function titleFromPath(pathname: string): string {
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const words = slug
    .replace(/-tickets-\d+$/i, "")
    .replace(/-\d+$/, "")
    .split("-")
    .filter(Boolean)
    .join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Community event";
}

export async function prefillFromEventbrite(url: string): Promise<ActionState<EventbritePrefill>> {
  const link = normalizeWebAddress(url);
  let parsed: URL | null = null;
  try {
    parsed = link ? new URL(link) : null;
  } catch {
    parsed = null;
  }
  // NEW, NEEDS APPROVAL: both messages.
  if (!parsed || !EVENTBRITE_HOST.test(parsed.hostname)) {
    return { status: "error", message: "Enter an Eventbrite event link, like eventbrite.ca/e/…", fieldErrors: { eventbrite: "Enter an Eventbrite event link, like eventbrite.ca/e/…" } };
  }
  if (!/\/e\//.test(parsed.pathname)) {
    return { status: "error", message: "That's not an event page. Copy the link from your event on Eventbrite.", fieldErrors: { eventbrite: "That's not an event page. Copy the link from your event on Eventbrite." } };
  }

  // Simulates the API's latency so the button's busy state is visible in development.
  await new Promise((resolve) => setTimeout(resolve, 400));
  const title = titleFromPath(parsed.pathname);
  return {
    status: "success",
    message: "Filled in the title, description, date, time and place from Eventbrite. Check them here.",
    data: {
      link: parsed.toString(),
      title,
      summary: `Join us for ${title.toLowerCase()}. Free, and everyone is welcome.`,
      date: dayOffset(14),
      startTime: "18:00",
      endTime: "20:00",
      area: "kitchener",
    },
  };
}
