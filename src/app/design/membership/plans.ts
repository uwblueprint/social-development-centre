/*
 * Placeholder plans for the membership join page. Names, prices and features are stand-ins until SDC
 * confirms them; the layout is what's under review. Backend needs: docs/backend/membership.md.
 */

export type PlanId = "supporter" | "member" | "sustainer";

export interface Plan {
  id: PlanId;
  name: string;
  /** Two short lines under the name in the comparison table. */
  summary: [string, string];
  /** Yearly price in dollars. */
  price: number;
  badge?: string;
}

export const PLANS: Plan[] = [
  { id: "supporter", name: "Supporter", summary: ["Placeholder line", "Placeholder line"], price: 5 },
  { id: "member", name: "Member", summary: ["Placeholder line", "Placeholder line"], price: 25 },
  { id: "sustainer", name: "Sustainer", summary: ["Placeholder line", "Placeholder line"], price: 60, badge: "Most support" },
];

/** A cell is either included (check), not included, or a short value. */
export type FeatureValue = boolean | string;

export interface Feature {
  label: string;
  description?: string;
  values: Record<PlanId, FeatureValue>;
}

export const FEATURES: Feature[] = [
  {
    label: "Feature with a description",
    description: "A sentence that explains this feature in a little more detail.",
    values: { supporter: "1", member: "2", sustainer: "6" },
  },
  { label: "Feature that differs", values: { supporter: false, member: true, sustainer: true } },
  { label: "Feature everyone gets", values: { supporter: true, member: true, sustainer: true } },
  {
    label: "Another feature with a description",
    description: "One more line of supporting text.",
    values: { supporter: true, member: true, sustainer: true },
  },
  { label: "Feature everyone gets", values: { supporter: true, member: true, sustainer: true } },
];

/**
 * How the person reached the page, read from the link: `/join?via=referral&ref=<code>`, `?via=event`
 * (the QR code at an SDC table), `?via=social`. Anything else, or nothing, is the website.
 */
export type Channel = "website" | "referral" | "event" | "social";

export function channelFrom(via: string | string[] | undefined): Channel {
  return via === "referral" || via === "event" || via === "social" ? via : "website";
}

/** Demo stand-ins for what the link would look up: the referrer's first name and the event's name. */
// Matches the member on the referral page (/design/referrals), whose invite link opens this page.
export const DEMO_REFERRER = "Amara";
export const DEMO_EVENT = "Housing Forum";

/** The welcome screen's heading and opening line for each channel. `{range}` is the price range. */
export const WELCOME: Record<Channel, { title: string; lede: string }> = {
  website: {
    title: "Your community, your say",
    lede: "SDC members shape local work on housing, poverty and climate. Join for {range}, whatever you can afford.",
  },
  referral: {
    title: `${DEMO_REFERRER} invited you to join SDC`,
    lede: `Members like ${DEMO_REFERRER} help decide what SDC works on in Waterloo Region, from housing and poverty to climate. Join for {range}, whatever you can afford.`,
  },
  event: {
    title: `Welcome to the ${DEMO_EVENT}`,
    lede: "Become an SDC member while you're here. Join for {range}, whatever you can afford.",
  },
  social: {
    title: "Saw us online? Make it official",
    lede: "SDC members shape local work on housing, poverty and climate. Join for {range}, whatever you can afford.",
  },
};
