/* STATE LAB (disposable): the checklist of designed states, grouped by area. */
import type { LabFlag } from "./state";

export const FLAG_INFO: Record<LabFlag, { label: string; detail: string }> = {
  slowLoad: { label: "Slow loading", detail: "Pages take 2.5s to load, so loading screens show." },
  loadError: { label: "Data fails to load", detail: "Lists and the Organization page throw, so error pages show." },
  empty: { label: "No data", detail: "No opportunities, partners or members, so empty states show." },
  longText: { label: "Very long text", detail: "Titles and names get very long, to check wrapping and truncation." },
  slowSave: { label: "Slow saves", detail: "Every save takes 2.5s, so pending buttons show." },
  saveError: { label: "Saves fail", detail: "Every save throws a server error." },
  signedOut: { label: "Signed out while editing", detail: "Saves act as if the session ended (blocked notices, sign-in prompts)." },
  offline: { label: "Offline", detail: "The browser reports no connection: the offline toast shows, and links and submits show the goose." },
  eventbriteTimeout: { label: "Eventbrite too slow", detail: "Fill in details never answers in time, so it times out after 5s." },
  eventbriteError: { label: "Eventbrite fails", detail: "Fill in details returns an error." },
};

export interface LabCase {
  title: string;
  /** Where to go. */
  href?: string;
  /** Switches to turn on first (everything else turns off). */
  flags?: LabFlag[];
  /** What to do once there, when a click isn't enough. */
  how?: string;
  /** A downloadable test image, for the image field's checks. */
  image?: { width: number; height: number };
}

export const CASES: { area: string; cases: LabCase[] }[] = [
  {
    area: "Everywhere",
    cases: [
      { title: "Page not found (404)", href: "/partner/this-page-does-not-exist" },
      { title: "Dark mode", how: "Click Dark mode in the sidebar footer, then revisit the other cases." },
      { title: "Phone width (360px)", how: "Open devtools (F12), turn on the device toolbar and set the width to 360." },
      { title: "Keyboard only", how: "Put the mouse away: Tab, Shift+Tab, Enter, Space, arrows and Escape should reach everything." },
      { title: "Offline", href: "/partner/opportunities", flags: ["offline"], how: "A toast says you're offline and the page stays readable. Click a sidebar link or submit a form to see the goose. Turn Offline off: a toast says you're back." },
      { title: "Mistyped section URL", href: "/admin/communit", how: "Redirects to Community. /admin/xyz stays a 404." },
      { title: "404 inside a portal", href: "/admin/opportunities/a/b/c", how: "The sidebar stays, nothing highlighted." },
      { title: "Unsaved form restored", href: "/partner/opportunities/new", how: "Type a link, reload the page: the form comes back with a toast offering Discard." },
    ],
  },
  {
    area: "Opportunities (partner)",
    cases: [
      { title: "Loading", href: "/partner/opportunities", flags: ["slowLoad"] },
      { title: "Couldn't load", href: "/partner/opportunities", flags: ["loadError"] },
      { title: "No opportunities yet", href: "/partner/opportunities", flags: ["empty"] },
      { title: "No drafts", href: "/partner/opportunities?tab=drafts", flags: ["empty"] },
      { title: "Long titles on cards", href: "/partner/opportunities", flags: ["longText"] },
      { title: "Card without an image", href: "/partner/opportunities", how: "Any card without an image shows its type's colour and icon." },
      { title: "Closed tab (table)", href: "/partner/opportunities?tab=closed" },
      { title: "No search matches", href: "/partner/opportunities?q=zzzz" },
    ],
  },
  {
    area: "Opportunity form",
    cases: [
      { title: "Missing fields (error summary)", href: "/partner/opportunities/new", how: "Choose a type, click Next without a link. Then fix the field: the error clears as you type." },
      { title: "Eventbrite: fill in details", href: "/partner/opportunities/new", how: "Choose Event, paste eventbrite.ca/e/community-dinner-123 as the Link and click Fill in details." },
      { title: "Eventbrite: not an event link", href: "/partner/opportunities/new", how: "Choose Event and paste eventbrite.ca/o/some-organizer-123." },
      { title: "Eventbrite: times out", href: "/partner/opportunities/new", flags: ["eventbriteTimeout"], how: "Choose Event, paste an eventbrite.ca/e/… link and click Fill in details." },
      { title: "Eventbrite: fails", href: "/partner/opportunities/new", flags: ["eventbriteError"], how: "Choose Event, paste an eventbrite.ca/e/… link and click Fill in details." },
      { title: "Topics at the limit", href: "/partner/opportunities/new", how: "On Details, choose 3 topics: the rest can't be chosen until you unselect one." },
      { title: "Character counters", href: "/partner/opportunities/new", how: "Type a long title: the count appears in the last quarter and turns red in the last 10%." },
      { title: "Image too wide (10:1)", href: "/partner/opportunities/new", image: { width: 2000, height: 200 }, how: "Download it, then drop it on Add an image." },
      { title: "Image too tall (1:10)", href: "/partner/opportunities/new", image: { width: 200, height: 2000 }, how: "Download it, then drop it on Add an image." },
      { title: "Tall image (9:16) with bars", href: "/partner/opportunities/new", image: { width: 900, height: 1600 }, how: "Download it, drop it on Add an image, then publish and see the card." },
      { title: "Wrong file type", href: "/partner/opportunities/new", how: "Drop a PDF or GIF on Add an image." },
      { title: "Slow publish", href: "/partner/opportunities/new", flags: ["slowSave"], how: "Fill the form and click Publish: the button shows it's working." },
      { title: "Publish fails", href: "/partner/opportunities/new", flags: ["saveError"], how: "Fill the form and click Publish." },
      { title: "Signed out before publishing", href: "/partner/opportunities/new", flags: ["signedOut"], how: "Fill the form and click Publish." },
    ],
  },
  {
    area: "Organization (partner)",
    cases: [
      { title: "Required name missing", href: "/partner/organization", how: "Clear Organization name and click Save changes." },
      { title: "Signed out while saving", href: "/partner/organization", flags: ["signedOut"], how: "Click Save changes." },
      { title: "Save fails", href: "/partner/organization", flags: ["saveError"], how: "Click Save changes." },
      { title: "Couldn't load", href: "/partner/organization", flags: ["loadError"] },
      { title: "Invite a colleague", href: "/partner/organization", how: "Under Team, click Invite colleague, submit empty, then with a bad email." },
    ],
  },
  {
    area: "Admin",
    cases: [
      { title: "Opportunities loading", href: "/admin/opportunities", flags: ["slowLoad"] },
      { title: "Opportunities empty", href: "/admin/opportunities", flags: ["empty"] },
      { title: "Opportunity panel", href: "/admin/opportunities?opportunity=opp_1" },
      { title: "Opportunity that doesn't exist", href: "/admin/opportunities?opportunity=opp_missing" },
      { title: "Partners empty", href: "/admin/partners", flags: ["empty"] },
      { title: "Partners couldn't load", href: "/admin/partners", flags: ["loadError"] },
      { title: "Partner panel", href: "/admin/partners?org=org_1" },
      { title: "Long partner and member names", href: "/admin/community", flags: ["longText"] },
      { title: "Community empty", href: "/admin/community", flags: ["empty"] },
      { title: "Community couldn't load", href: "/admin/community", flags: ["loadError"] },
      { title: "Member panel", href: "/admin/community?member=m_1" },
      { title: "Add members: file import errors", href: "/admin/community", how: "Add members, Import from a file, then drop a file with a bad email row." },
    ],
  },
  {
    area: "Sign-in and kiosk",
    cases: [
      { title: "Sign-in error", href: "/login", how: "Submit with an empty or wrong email." },
      { title: "Signed-out goodbye", href: "/login?signedOut=1&name=Amara" },
      { title: "Kiosk validation", href: "/kiosk", how: "Submit empty." },
      { title: "Kiosk success and countdown", href: "/kiosk", how: "Fill it in and submit." },
    ],
  },
];
