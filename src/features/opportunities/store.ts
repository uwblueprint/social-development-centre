import type { Opportunity } from "./types";

/*
 * In-memory stand-in for the backend so both portals work end to end in development.
 * Resets on server restart. Backend: replace queries.ts and service.ts; delete this file.
 */

const DAY = 86_400_000;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY);
/** yyyy-mm-dd, offset from today. */
export const dayOffset = (offsetDays: number) => {
  const d = at(offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const iso = (offsetDays: number) => at(offsetDays).toISOString();

let seq = 1000;
export const nextOpportunityId = () => `opp_${++seq}`;

const org = {
  sdc: { id: "sdc", name: "Social Development Centre" },
  northside: { id: "org_1", name: "Northside Food Bank" },
  riverbend: { id: "org_2", name: "Riverbend Youth Collective" },
  eastside: { id: "org_4", name: "Eastside Newcomer Services" },
  greenway: { id: "org_6", name: "Greenway Community Gardens" },
};
const admin = { name: "Admin User", role: "admin" as const };
const amara = { name: "Amara Okafor", role: "partner" as const };
const omar = { name: "Omar Haddad", role: "partner" as const };
const priya = { name: "Priya Nair", role: "partner" as const };

function stamp(createdDaysAgo: number, updatedDaysAgo = createdDaysAgo) {
  return { createdAt: iso(-createdDaysAgo), updatedAt: iso(-updatedDaysAgo), publishedAt: iso(-createdDaysAgo) };
}

function seed(): Opportunity[] {
  return [
    {
      id: "opp_1", kind: "event", status: "published", organization: org.sdc, updatedBy: admin, ...stamp(12, 2),
      title: "Film night: Housing for people, not profit",
      summary: "A free screening of Dr. Brian Doucet's documentary on affordable housing, followed by a panel and Q&A with local tenants and organizers.",
      topics: ["housing", "civic"], link: "https://www.eventbrite.ca/e/sdc-film-night",
      details: { date: dayOffset(9), startTime: "18:30", endTime: "21:00", format: "in_person", area: "kitchener", address: "Civic Hub, 97 Victoria St N", cost: "free", accessibility: ["step_free", "accessible_washroom", "asl"], accessibilityNote: "ASL with one week's notice." },
    },
    {
      id: "opp_2", kind: "petition", status: "published", organization: org.sdc, updatedBy: admin, ...stamp(20, 5),
      title: "Ask Regional Council for a safe tenting framework",
      summary: "Add your name to call on the Region of Waterloo to adopt a safe, dignified tenting framework before winter.",
      topics: ["housing", "civic"], link: "https://www.waterlooregion.org/petition-safe-tenting",
      details: { target: "Region of Waterloo Council", deadline: dayOffset(21), signatureGoal: 1500 },
    },
    {
      id: "opp_3", kind: "volunteer", status: "published", organization: org.northside, updatedBy: amara, ...stamp(30, 3),
      title: "Saturday food sorting crew",
      summary: "Sort and pack donated food for weekly hampers. No experience needed; we train on your first shift.",
      topics: ["food"], link: "https://forms.gle/northside-volunteer",
      details: { timeCommitment: "under_2", format: "in_person", area: "kitchener", address: "Northside Food Bank, 55 Bridge St", skills: ["no_experience"], minimumAge: 14 },
    },
    {
      id: "opp_4", kind: "event", status: "published", organization: org.northside, updatedBy: amara, ...stamp(6),
      title: "Community harvest dinner",
      summary: "Share a free meal made with donated produce, meet neighbours and hear how the food bank works.",
      topics: ["food", "health"], link: "https://lu.ma/northside-harvest",
      details: { date: dayOffset(4), startTime: "17:30", endTime: "19:30", format: "in_person", area: "kitchener", address: "St. John the Evangelist, 23 Water St N", cost: "free" },
    },
    {
      id: "opp_5", kind: "job", status: "published", organization: org.eastside, updatedBy: omar, ...stamp(8, 1),
      title: "Settlement worker (Arabic speaking)",
      summary: "Help newly arrived families find housing, register for school and connect with local services.",
      topics: ["newcomers", "housing"], link: "https://eastsidenewcomers.ca/careers/settlement-worker",
      details: { employmentType: "full_time", workplace: "hybrid", area: "kitchener", pay: "$24–27 an hour", applyBy: dayOffset(18), qualifications: "Fluent Arabic and English. Experience with settlement services is an asset." },
    },
    {
      id: "opp_6", kind: "event", status: "published", organization: org.eastside, updatedBy: omar, ...stamp(3),
      title: "Tenant rights workshop for newcomers",
      summary: "Learn your rights as a renter in Ontario, in plain language, with interpretation in Arabic, Dari and Spanish.",
      topics: ["newcomers", "housing"], link: "https://us02web.zoom.us/meeting/register/tenant-rights",
      details: { date: dayOffset(12), startTime: "19:00", endTime: "20:30", format: "online", area: "online", cost: "free" },
    },
    {
      id: "opp_7", kind: "volunteer", status: "published", organization: org.riverbend, updatedBy: priya, ...stamp(15, 15),
      title: "Homework club mentor",
      summary: "Support students in grades 6–9 with homework and study skills after school.",
      topics: ["youth"], link: "https://riverbendyouth.ca/volunteer",
      details: { timeCommitment: "2_to_5", format: "in_person", area: "cambridge", address: "Riverbend Community Centre", startDate: dayOffset(10), skills: ["tech", "writing"], minimumAge: 18, applyBy: dayOffset(7) },
    },
    {
      id: "opp_8", kind: "other", status: "published", organization: org.sdc, updatedBy: admin, ...stamp(10, 4),
      title: "Tell us what your neighbourhood needs",
      summary: "A 5-minute survey that shapes which issues SDC brings to Regional Council this year.",
      topics: ["civic"], link: "https://forms.gle/sdc-neighbourhood-survey",
      details: { callToAction: "Take the survey", deadline: dayOffset(25), details: [{ label: "Time needed", value: "About 5 minutes" }, { label: "Languages", value: "English, French, Arabic, Spanish" }] },
    },
    {
      id: "opp_9", kind: "event", status: "published", organization: org.riverbend, updatedBy: priya, ...stamp(2),
      title: "Youth voices on climate: open mic",
      summary: "Young people share poems, songs and stories about climate and the future of Waterloo Region.",
      topics: ["youth", "environment", "arts"], link: "https://www.eventbrite.ca/e/youth-voices-climate",
      details: { date: dayOffset(16), startTime: "18:00", format: "hybrid", area: "kitchener", address: "Kitchener Public Library, Central", cost: "paid", costDetails: "$5, or free for students" },
    },
    {
      id: "opp_10", kind: "job", status: "published", organization: org.sdc, updatedBy: admin, ...stamp(14, 6),
      title: "Civic Hub coordinator (maternity leave)",
      summary: "Coordinate Civic Hub partner requests, room bookings and the monthly opportunities newsletter.",
      topics: ["civic"], link: "https://www.waterlooregion.org/careers",
      details: { employmentType: "contract", workplace: "on_site", area: "kitchener", pay: "$52,000 a year, prorated", applyBy: dayOffset(11) },
    },
    // Drafts
    {
      id: "opp_11", kind: "event", status: "draft", organization: org.sdc, updatedBy: admin, createdAt: iso(-1), updatedAt: iso(-1),
      title: "Festival of Neighbourhoods kickoff", summary: "", topics: ["civic"], link: "",
      details: { format: "in_person", cost: "free" },
    },
    {
      id: "opp_12", kind: "petition", status: "draft", organization: org.northside, updatedBy: amara, createdAt: iso(-2), updatedAt: iso(0),
      title: "Raise Ontario Works rates to match inflation",
      summary: "Ask our MPPs to index social assistance rates to inflation so families can afford food and rent.",
      topics: ["income", "food"], link: "",
      details: { target: "Waterloo Region MPPs" },
    },
    {
      id: "opp_13", kind: "other", status: "draft", organization: org.eastside, updatedBy: omar, createdAt: iso(-4), updatedAt: iso(-3),
      title: "Conversation circle hosts", summary: "", topics: ["newcomers"], link: "",
      details: { callToAction: "Sign up to host", details: [] },
    },
    // Closed and ended
    {
      id: "opp_14", kind: "event", status: "published", organization: org.northside, updatedBy: amara, ...stamp(40, 30),
      title: "Fall food drive at Kitchener Market",
      summary: "Drop off non-perishables at our booth and learn how to get involved with the food bank.",
      topics: ["food"], link: "https://lu.ma/northside-food-drive",
      details: { date: dayOffset(-6), startTime: "08:00", endTime: "13:00", format: "in_person", area: "kitchener", address: "Kitchener Market, 300 King St E", cost: "free" },
    },
    {
      id: "opp_15", kind: "volunteer", status: "closed", closedReason: "closed", organization: org.riverbend, updatedBy: priya, ...stamp(60, 9),
      title: "Summer camp counsellor",
      summary: "Lead games and crafts for kids aged 6–12 at our free summer day camp.",
      topics: ["youth"], link: "https://riverbendyouth.ca/camp",
      details: { timeCommitment: "one_time", format: "in_person", area: "cambridge", address: "Riverbend Community Centre", skills: ["childcare"] },
    },
    {
      id: "opp_16", kind: "petition", status: "published", organization: org.greenway, updatedBy: admin, ...stamp(90, 40),
      title: "Protect the Victoria Park community garden",
      summary: "Ask the City of Kitchener to keep the Victoria Park garden plots in the new park plan.",
      topics: ["environment"], link: "https://greenwaygardens.org/petition",
      details: { target: "City of Kitchener", deadline: dayOffset(-15), signatureGoal: 800 },
    },
    {
      // Greenway was removed 20 days ago, so this reads as Closed: Partner access removed.
      id: "opp_17", kind: "volunteer", status: "published", organization: org.greenway, updatedBy: admin, ...stamp(45, 25),
      title: "Garden bed builders",
      summary: "Help build raised garden beds for the fall planting at three community gardens.",
      topics: ["environment"], link: "https://greenwaygardens.org/volunteer",
      details: { timeCommitment: "under_2", format: "in_person", area: "kitchener", address: "Victoria Park", skills: ["event_setup"] },
    },
  ];
}

// Versioned key: a store left over from an older shape (e.g. the "live" status, or free-text locations) is dropped on hot reload.
const globalStore = globalThis as unknown as { __opportunitiesStoreV3?: Opportunity[] };
export const opportunities = (): Opportunity[] => (globalStore.__opportunitiesStoreV3 ??= seed());
