import type { AdminNotification, Cents, PersonRef } from "./types";

/*
 * One template per type. Every notification follows the same shape:
 * - title: what happened, person or count first.
 * - body (optional): only when it changes what the admin does or knows, e.g. where someone came from.
 * Clicking the row opens `href`, the page where the next step happens. Each name in the title is its own
 * link to that person in the member directory (`people`, in the order they appear).
 */
export interface NotificationCopy {
  /** The section it belongs to, shown before the time. */
  area: "Outbox" | "Payments" | "People";
  title: string;
  /** People named in the title; the panel links each name to them in the member directory. */
  people?: PersonRef[];
  body?: string;
  href: string;
}

/* Where each action goes: the admin portal's pages. Their filters (?status=, ?person=, ?tab=) get read once
 * Outbox, Payments and People land. */
const OUTBOX = "/admin/outbox";
const PAYMENTS = "/admin/payments";
const PEOPLE = "/admin/members";
/** A person in the member directory. */
export const personHref = (p: PersonRef) => `${PEOPLE}?person=${p.id}`;
const person = personHref;
/** Cancels and pauses change who counts as a member, so the next step is the updated member list. */
const MEMBER_LIST = `${PEOPLE}?download=members`;

export function describe(n: AdminNotification): NotificationCopy {
  switch (n.type) {
    case "outboxWaiting":
      return {
        area: "Outbox",
        title: `${plural(n.data.count, "email is", "emails are")} waiting for your review`,
        href: OUTBOX,
      };
    case "outboxPastDue": {
      const one = n.data.count === 1;
      return {
        area: "Outbox",
        title: `${plural(n.data.count, "email", "emails")} missed ${one ? "its" : "their"} send day`,
        body: `Approve ${one ? "it" : "them"} to send the next morning.`,
        href: OUTBOX,
      };
    }
    case "outboxFailed":
      return {
        area: "Outbox",
        title: `${plural(n.data.count, "email", "emails")} couldn't send`,
        href: `${OUTBOX}?tab=couldnt-send`,
      };
    case "paymentDeclined":
      return {
        area: "Payments",
        title: `${n.data.person.name}'s card was declined`,
        people: [n.data.person],
        body: "PayPal will try again.",
        href: `${PAYMENTS}?status=declined`,
      };
    case "paymentsStopped":
      return {
        area: "Payments",
        title: `${n.data.person.name}'s payments stopped`,
        people: [n.data.person],
        body: "Their card was declined twice. Ask them to update it in PayPal.",
        href: `${PAYMENTS}?person=${n.data.person.id}`,
      };
    case "paymentUnmatched":
      return {
        area: "Payments",
        title: `A ${money(n.data.amount)} payment isn't linked to anyone`,
        body: "Choose who it's from so it counts toward their membership.",
        href: `${PAYMENTS}?payment=${n.data.paymentId}`,
      };
    case "refunds":
      return {
        area: "Payments",
        title: `${n.data.person.name}'s ${money(n.data.amount)} payment was ${n.data.kind === "refund" ? "refunded" : "reversed"}`,
        people: [n.data.person],
        body:
          n.data.kind === "reversal" ? "They disputed it with PayPal or their bank, and the money went back to them." : undefined,
        href: `${PAYMENTS}?person=${n.data.person.id}`,
      };
    case "paymentReceived":
      return {
        area: "Payments",
        title: `${n.data.person.name} paid ${money(n.data.amount)}`,
        people: [n.data.person],
        href: PAYMENTS,
      };
    case "memberJoins":
      return {
        area: "People",
        title: `${n.data.person.name} joined`,
        people: [n.data.person],
        body: n.data.source ? `From the ${n.data.source} signup link.` : undefined,
        href: person(n.data.person),
      };
    case "referralJoins":
      return {
        area: "People",
        title: `${n.data.person.name} joined from ${n.data.referrer.name}'s referral`,
        people: [n.data.person, n.data.referrer],
        href: person(n.data.person),
      };
    case "cancels":
      return {
        area: "People",
        title: `${n.data.person.name} cancelled their membership`,
        people: [n.data.person],
        body: n.data.reason ? `Their reason: ${n.data.reason}` : undefined,
        href: MEMBER_LIST,
      };
    case "pausesOrTierChanges":
      return n.data.change === "paused"
        ? {
            area: "People",
            title: `${n.data.person.name} paused their membership`,
            people: [n.data.person],
            body: `Until ${longDate(n.data.until)}.`,
            href: MEMBER_LIST,
          }
        : {
            area: "People",
            title: `${n.data.person.name} moved to ${n.data.tier}`,
            people: [n.data.person],
            href: person(n.data.person),
          };
    case "unsubscribes":
      return {
        area: "People",
        title: `${n.data.person.name} unsubscribed from emails`,
        people: [n.data.person],
        href: person(n.data.person),
      };
  }
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}


function money(cents: Cents) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
}

/** yyyy-mm-dd → "22 February" */
function longDate(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", { day: "numeric", month: "long" });
}


/** "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago", then "14 Nov". */
export function relativeTime(iso: string, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const days = daysAgo(iso, now);
  if (days <= 0) {
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-CA", { day: "numeric", month: "short" });
}

export function fullTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysAgo(iso: string, now: Date) {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Splits a title around the named people, in order, so each name can be rendered as a link. */
export function titleParts(title: string, people: PersonRef[] = []): (string | PersonRef)[] {
  const parts: (string | PersonRef)[] = [];
  let rest = title;
  for (const p of people) {
    const at = rest.indexOf(p.name);
    if (at < 0) continue;
    if (at > 0) parts.push(rest.slice(0, at));
    parts.push(p);
    rest = rest.slice(at + p.name.length);
  }
  if (rest) parts.push(rest);
  return parts;
}
