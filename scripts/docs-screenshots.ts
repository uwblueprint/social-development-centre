/**
 * Screenshots for docs/user-guide. Run with `pnpm docs:screenshots`; rerun after UI changes.
 *
 * - Targets http://localhost:3000 and starts `pnpm dev` if nothing is listening there.
 * - Uses the seeded dev data. Dialogs, menus and confirmations are opened, never submitted.
 * - Each shot highlights the one control its step asks the reader to use (outline + glow, no layout shift)
 *   and is cropped to that part of the screen.
 * - Output: docs/user-guide/img/<guide>/<task-slug>.png, palette-compressed with sharp (from next).
 *
 * Only shoot one guide: `pnpm docs:screenshots admin-partners`.
 * Runs with Node's built-in TypeScript support (Node 22.6+), so there's nothing extra to install.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Browser, Locator, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "docs/user-guide/img");
const VIEWPORT = { width: 1280, height: 800 };
const MAX_BYTES = 200 * 1024;

if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync("/opt/pw-browsers")) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = "/opt/pw-browsers";
}

/** Outline + soft glow drawn outside the box, so nothing moves. Also hides the Next.js dev badge and the caret. */
const HIGHLIGHT_CSS = `
  [data-docs-highlight] {
    outline: 2px solid var(--color-accent) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-accent) 22%, transparent),
      0 0 18px 6px color-mix(in srgb, var(--color-accent) 28%, transparent) !important;
    position: relative;
    z-index: 1;
  }
  [data-docs-highlight="inset"] {
    outline-offset: -2px !important;
    box-shadow: inset 0 0 0 5px color-mix(in srgb, var(--color-accent) 22%, transparent) !important;
  }
  nextjs-portal { display: none !important; }
  * { caret-color: transparent !important; }
`;

type Region = Locator | "page" | "viewport";
type Shot = {
  guide: string;
  slug: string;
  url: string;
  /** Gets the page into the state the task is about. */
  act?: (p: Page) => Promise<void>;
  /** The control the step tells the reader to use. */
  target?: (p: Page) => Locator;
  /** What to crop to. Defaults to the target. */
  region?: (p: Page) => Region[];
  pad?: number;
  /** Draw the highlight inside the control, for ones in a clipped container like a table cell. */
  inset?: boolean;
  /** Leave the pointer where the last click was (for hover-only feedback like "Copied"). */
  keepPointer?: boolean;
};

// ---------- helpers for common states ----------

const btn = (p: Page, name: string | RegExp) => p.getByRole("button", { name, exact: typeof name === "string" });
const item = (p: Page, name: string | RegExp) => p.getByRole("menuitem", { name, exact: typeof name === "string" });
const dialog = (p: Page) => p.getByRole("dialog").last();
const alert = (p: Page) => p.getByRole("alertdialog").last();
const menu = (p: Page) => p.getByRole("menu").last();
const sidebar = (p: Page) => p.getByRole("navigation").first();

async function openAccountMenu(p: Page) {
  await btn(p, /^Open account menu for /).click();
  await menu(p).waitFor();
}
async function openAccountDialog(p: Page) {
  await openAccountMenu(p);
  await item(p, "My account").click();
  await dialog(p).waitFor();
}
async function openMoreActions(p: Page) {
  await dialog(p).getByRole("button", { name: "More actions" }).click();
  await menu(p).waitFor();
}
async function openFilter(p: Page, name: string | RegExp) {
  await btn(p, name).click();
  await p.getByRole("button", { name: "Apply", exact: true }).waitFor();
}
/** The filter popover: the Apply button's nearest dialog-ish container. */
const popover = (p: Page) =>
  p.locator("[data-radix-popper-content-wrapper], [role=dialog]").filter({ has: p.getByRole("button", { name: "Apply", exact: true }) }).last();
const firstRow = (p: Page) => p.locator("tbody tr").first();
const headerBar = (p: Page) => p.locator("main h1").first();

async function openCommunityPanel(p: Page, row = 0) {
  await p.locator("tbody tr").nth(row).locator("td").first().click();
  await dialog(p).waitFor();
}

// ---------- shots, one per task, in guide order ----------

function accountShots(guide: string, home: string): Shot[] {
  return [
    {
      guide, slug: "go-to-your-account-or-sign-out", url: home,
      act: openAccountMenu,
      target: (p) => item(p, "My account"),
      region: (p) => [menu(p), btn(p, /^Open account menu for /)],
    },
    {
      guide, slug: "change-your-name-or-profile-picture", url: home,
      act: openAccountDialog,
      target: (p) => dialog(p).getByRole("button", { name: "Save changes" }),
      region: (p) => [dialog(p)],
    },
    {
      guide, slug: "delete-your-account", url: home,
      act: async (p) => {
        await openAccountDialog(p);
        await dialog(p).getByRole("button", { name: "Delete account" }).click();
        await alert(p).waitFor();
      },
      target: (p) => alert(p).getByRole("button", { name: "Delete account" }),
      region: (p) => [alert(p)],
    },
  ];
}

function opportunityShots(guide: string, base: string, orgFilter: boolean): Shot[] {
  const newUrl = `${base}/new?kind=event`;
  const details = async (p: Page) => {
    await btn(p, "Next").click();
    await p.getByLabel("Title").first().waitFor();
  };
  const withMenu = (slug: string, url: string, itemName: string): Shot => ({
    guide, slug, url,
    act: openMoreActions,
    target: (p) => item(p, itemName),
    region: (p) => [menu(p), dialog(p).getByRole("button", { name: "More actions" })],
    pad: 24,
  });
  const firstPublished = orgFilter ? "opp_1" : "opp_4";
  const draft = orgFilter ? "opp_11" : "opp_12";
  return [
    {
      guide, slug: orgFilter ? "find-an-opportunity" : "find-your-opportunities", url: base,
      act: (p) => openFilter(p, "Filter Type"),
      target: (p) => btn(p, "Apply"),
      region: (p) => [headerBar(p), p.getByRole("searchbox").or(p.getByLabel("Search opportunities")).first(), popover(p), firstRow(p)],
    },
    {
      guide, slug: orgFilter ? "post-a-new-opportunity" : "post-an-opportunity", url: newUrl,
      target: (p) => btn(p, "Next"),
      region: () => ["viewport"],
    },
    ...(orgFilter
      ? [{
          guide, slug: "post-for-a-partner", url: newUrl,
          act: details,
          target: (p: Page) => p.getByLabel("Organization").first(),
          region: (p: Page) => [p.getByLabel("Organization").first(), p.getByLabel("Title").first()],
          pad: 48,
        }]
      : []),
    {
      guide, slug: "save-a-draft-and-finish-it-later", url: newUrl,
      act: details,
      target: (p) => btn(p, "Save as draft"),
      region: () => ["viewport"],
    },
    {
      guide, slug: orgFilter ? "edit-an-opportunity" : "change-an-opportunity", url: `${base}?opportunity=${firstPublished}`,
      target: (p) => dialog(p).getByRole("button", { name: "Edit", exact: true }),
      region: (p) => [dialog(p)],
    },
    withMenu(orgFilter ? "post-a-repeat-of-an-event-or-any-listing" : "post-the-same-event-again", `${base}?opportunity=${firstPublished}`, "Duplicate"),
    withMenu("close-an-opportunity", `${base}?opportunity=${firstPublished}`, "Close"),
    {
      guide, slug: orgFilter ? "reopen-a-closed-opportunity" : "reopen-an-opportunity", url: `${base}?tab=closed`,
      act: async (p) => {
        await firstRow(p).locator("td").first().click();
        await dialog(p).waitFor();
        await openMoreActions(p);
      },
      target: (p) => item(p, "Reopen"),
      region: (p) => [menu(p), dialog(p).getByRole("button", { name: "More actions" })],
      pad: 24,
    },
    {
      guide, slug: orgFilter ? "delete-an-opportunity-posted-by-mistake" : "delete-an-opportunity-you-posted-by-mistake",
      url: `${base}?tab=drafts&opportunity=${draft}`,
      act: async (p) => {
        await openMoreActions(p);
        await item(p, "Delete").click();
        await alert(p).waitFor();
      },
      target: (p) => alert(p).getByRole("button", { name: "Delete", exact: true }),
      region: (p) => [alert(p)],
    },
    withMenu(orgFilter ? "open-the-link-people-will-use" : "check-your-link", `${base}?opportunity=${firstPublished}`, "Open link"),
    ...(orgFilter
      ? [{
          guide, slug: "see-one-partners-opportunities", url: base,
          act: async (p: Page) => {
            await openFilter(p, "Filter Organization");
            await popover(p).getByText("Northside Food Bank").first().click();
          },
          target: (p: Page) => popover(p).getByRole("checkbox", { name: /Northside Food Bank/ }).first(),
          region: (p: Page) => [p.getByRole("button", { name: /^Organization/ }), popover(p)],
        }]
      : []),
  ];
}

const gettingAround = "admin-getting-around";
const adminOpps = "admin-opportunities";
const partners = "admin-partners";
const community = "admin-community";
const partnerStart = "partner-getting-started";
const partnerOpps = "partner-opportunities";

const P = "/admin/partners";
const PEOPLE = "/admin/partners?view=people";
const ORG = "/admin/partners?org=org_1";
const C = "/admin/community";

async function openPersonMenu(p: Page, name: string) {
  await btn(p, `Actions for ${name}`).first().click();
  await menu(p).waitFor();
}
const personRow = (p: Page, name: string) => p.locator("tr").filter({ has: btn(p, `Actions for ${name}`) }).first();

const SHOTS: Shot[] = [
  // ---- Admin: getting around ----
  {
    guide: gettingAround, slug: "open-a-section", url: "/admin/opportunities",
    target: (p) => sidebar(p).getByRole("link", { name: "Partners" }),
    region: (p) => [sidebar(p)],
  },
  ...accountShots(gettingAround, "/admin/opportunities"),

  // ---- Admin: opportunities ----
  ...opportunityShots(adminOpps, "/admin/opportunities", true),

  // ---- Admin: partners ----
  {
    guide: partners, slug: "find-an-organization-or-a-person", url: P,
    target: (p) => p.getByLabel("Search by name or email"),
    region: (p) => [headerBar(p), p.getByRole("tab", { name: /^People/ }), p.locator("tbody tr").nth(2)],
  },
  {
    guide: partners, slug: "see-which-partners-might-need-support", url: P,
    target: (p) => btn(p, "Show them"),
    region: (p) => [btn(p, "Show them"), p.locator("thead"), p.locator("tbody tr").nth(3)],
  },
  {
    guide: partners, slug: "copy-partners-email-addresses", url: P,
    target: (p) => btn(p, "Copy all emails"),
    region: (p) => [headerBar(p), btn(p, "Invite partner"), p.getByRole("tab", { name: /^Organizations/ })],
  },
  {
    guide: partners, slug: "keep-notes-about-a-partner", url: ORG,
    act: async (p) => { await btn(p, "Save notes").scrollIntoViewIfNeeded(); },
    target: (p) => btn(p, "Save notes"),
    region: (p) => [p.getByText("SDC notes (only admins see these)"), btn(p, "Save notes")],
    pad: 24,
  },
  {
    guide: partners, slug: "post-an-opportunity-for-a-partner", url: ORG,
    target: (p) => dialog(p).getByRole(/* link or button */ "link", { name: "Post an opportunity for them" })
      .or(dialog(p).getByRole("button", { name: "Post an opportunity for them" })),
    region: (p) => [dialog(p).getByRole("heading").first(), dialog(p).getByText("Post an opportunity for them")],
    pad: 32,
  },
  {
    guide: partners, slug: "invite-a-person-from-a-new-or-existing-partner", url: P,
    act: async (p) => {
      await btn(p, "Invite partner").click();
      await dialog(p).waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: "Send invitation" }),
    region: (p) => [dialog(p)],
  },
  {
    guide: partners, slug: "add-another-person-to-an-existing-partner", url: ORG,
    act: async (p) => {
      await btn(p, "Add person").click();
      await p.getByRole("button", { name: "Send invitation" }).waitFor();
    },
    target: (p) => btn(p, "Send invitation"),
    region: (p) => [dialog(p)],
  },
  {
    guide: partners, slug: "resend-retry-or-cancel-an-invitation", url: PEOPLE,
    act: (p) => openPersonMenu(p, "Sam Chen"),
    target: (p) => item(p, "Resend invitation"),
    region: (p) => [personRow(p, "Sam Chen"), menu(p)],
  },
  {
    guide: partners, slug: "edit-a-partners-details", url: ORG,
    act: async (p) => {
      await btn(p, "Edit details").click();
      await p.getByLabel("Organization name").waitFor();
      await btn(p, "Save changes").scrollIntoViewIfNeeded();
    },
    target: (p) => btn(p, "Save changes"),
    region: (p) => [p.getByLabel("Organization name"), btn(p, "Save changes")],
    pad: 40,
  },
  {
    guide: partners, slug: "change-a-persons-name-or-email", url: PEOPLE,
    act: async (p) => {
      await openPersonMenu(p, "Luis Romero");
      await item(p, "Edit details").click();
      await dialog(p).waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: "Save changes" }),
    region: (p) => [dialog(p)],
  },
  {
    guide: partners, slug: "see-a-partners-opportunities", url: ORG,
    target: (p) => dialog(p).getByRole("link", { name: "View opportunities" })
      .or(dialog(p).getByRole("button", { name: "View opportunities" })),
    region: (p) => [dialog(p).getByRole("heading").first(), dialog(p).getByText("View opportunities")],
    pad: 32,
  },
  {
    guide: partners, slug: "remove-a-person-who-left-a-partner-organization", url: PEOPLE,
    act: async (p) => {
      await openPersonMenu(p, "Luis Romero");
      await item(p, "Remove from organization").click();
      await alert(p).waitFor();
    },
    target: (p) => alert(p).getByRole("button", { name: "Remove access" }),
    region: (p) => [alert(p)],
  },
  {
    guide: partners, slug: "move-a-person-to-a-different-partner", url: PEOPLE,
    act: (p) => openPersonMenu(p, "Luis Romero"),
    target: (p) => item(p, "Remove from organization"),
    region: (p) => [personRow(p, "Luis Romero"), menu(p)],
  },
  {
    guide: partners, slug: "remove-a-partners-access", url: ORG,
    act: async (p) => {
      await dialog(p).getByRole("button", { name: "Remove access" }).click();
      await alert(p).waitFor();
    },
    target: (p) => alert(p).getByRole("button", { name: "Remove access" }),
    region: (p) => [alert(p)],
  },
  {
    guide: partners, slug: "bring-back-a-removed-partner-or-person", url: `${P}?status=removed&org=org_6`,
    act: async (p) => { await dialog(p).waitFor(); },
    target: (p) => dialog(p).getByRole("button", { name: "Reinvite" }),
    region: (p) => [dialog(p).getByRole("heading").first(), dialog(p).getByRole("button", { name: "Reinvite" })],
    pad: 32,
  },

  // ---- Admin: community ----
  {
    guide: community, slug: "find-someone", url: C,
    target: (p) => p.getByLabel("Search by name or email"),
    region: (p) => [headerBar(p), btn(p, "Export members"), p.locator("tbody tr").nth(3)],
  },
  {
    guide: community, slug: "filter-by-status", url: C,
    act: (p) => openFilter(p, /^Filter Status/),
    target: (p) => btn(p, "Apply"),
    region: (p) => [p.getByRole("button", { name: /^Filter Status/ }), popover(p)],
  },
  {
    guide: community, slug: "sort-the-list", url: C,
    target: (p) => p.getByRole("button", { name: /^Clicks/ }),
    region: (p) => [p.locator("thead"), p.locator("tbody tr").nth(4)],
    pad: 8,
  },
  {
    guide: community, slug: "copy-someones-email", url: C,
    act: async (p) => {
      await p.locator("tbody tr").first().getByRole("button", { name: /^Copy / }).click();
      await p.waitForTimeout(150);
    },
    target: (p) => p.locator("tbody tr").first().getByRole("button", { name: /^Cop/ }),
    inset: true,
    keepPointer: true,
    region: (p) => [p.locator("thead"), p.locator("tbody tr").nth(1)],
    pad: 8,
  },
  {
    guide: community, slug: "add-someone", url: C,
    act: async (p) => {
      await btn(p, "Add members").click();
      await dialog(p).waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: "Add member", exact: true }),
    region: (p) => [dialog(p)],
  },
  {
    guide: community, slug: "import-people-from-a-file", url: C,
    act: async (p) => {
      await btn(p, "Add members").click();
      await dialog(p).getByRole("button", { name: "Import from a file" })
        .or(dialog(p).getByRole("tab", { name: "Import from a file" })).first().click();
      await dialog(p).getByText("Upload CSV").first().waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: "Upload CSV" }).or(dialog(p).getByText("Upload CSV").first()).first(),
    region: (p) => [dialog(p)],
  },
  {
    guide: community, slug: "check-the-preview", url: C,
    act: async (p) => {
      await btn(p, "Add members").click();
      await dialog(p).getByRole("button", { name: "Import from a file" })
        .or(dialog(p).getByRole("tab", { name: "Import from a file" })).first().click();
      const existing = await p.evaluate(() => [...document.querySelectorAll("tbody tr button[aria-label^='Copy ']")]
        .slice(0, 2).map((b) => b.getAttribute("aria-label")!.replace(/^Copy /, "")));
      const csv = ["name,email", "Nadia Farouk,nadia.farouk@example.org", "Theo Grant,theo.grant@example.org",
        ...existing.map((e) => `,${e}`), "Sam,not-an-email"].join("\n");
      const file = path.join(tmpdir(), "sdc-docs-import.csv");
      writeFileSync(file, csv);
      const chooser = p.waitForEvent("filechooser");
      await dialog(p).getByRole("button", { name: "Upload CSV" }).click();
      await (await chooser).setFiles(file);
      await dialog(p).getByRole("button", { name: "Continue" }).click();
      await dialog(p).getByRole("button", { name: "Back" }).waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: /^(Add|Make|Resubscribe|Confirm) \d+/ }),
    region: (p) => [dialog(p)],
  },
  {
    guide: community, slug: "sign-people-up-at-a-booth", url: C,
    act: async (p) => {
      await btn(p, "Open sign-up kiosk").click();
      await dialog(p).waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: "Open kiosk" }).or(dialog(p).getByRole("link", { name: "Open kiosk" })),
    region: (p) => [dialog(p)],
  },
  {
    guide: community, slug: "see-someones-details-and-emails", url: C,
    act: (p) => openCommunityPanel(p),
    target: (p) => dialog(p).getByRole("heading", { name: "Emails" }),
    region: (p) => [dialog(p)],
  },
  {
    guide: community, slug: "edit-someones-name-or-email", url: C,
    act: async (p) => {
      await openCommunityPanel(p);
      await dialog(p).getByRole("button", { name: "Edit details" }).click();
      await p.getByRole("button", { name: "Save", exact: true }).waitFor();
    },
    target: (p) => p.getByRole("button", { name: "Save", exact: true }),
    region: (p) => [dialog(p)],
  },
  {
    guide: community, slug: "convert-someone-to-a-paying-member", url: C,
    act: async (p) => {
      await openCommunityPanel(p);
      await dialog(p).getByRole("button", { name: "Convert to paying member" }).click();
      await alert(p).or(p.getByRole("button", { name: "Make paying member" })).first().waitFor();
    },
    target: (p) => p.getByRole("button", { name: "Make paying member" }),
    region: (p) => [p.getByRole("alertdialog").or(dialog(p)).last()],
  },
  {
    guide: community, slug: "remove-someones-paying-access", url: `${C}?tab=paying`,
    act: async (p) => {
      await p.getByRole("tab", { name: /^Paying members/ }).click();
      await p.waitForLoadState("networkidle");
      await openCommunityPanel(p);
      await dialog(p).getByRole("button", { name: "Remove paying access" }).click();
      await alert(p).waitFor();
    },
    target: (p) => alert(p).getByRole("button", { name: "Remove paying access" }),
    region: (p) => [alert(p)],
  },
  {
    guide: community, slug: "unsubscribe-someone", url: C,
    act: async (p) => {
      await openCommunityPanel(p);
      await dialog(p).getByRole("button", { name: "Unsubscribe", exact: true }).click();
      await alert(p).waitFor();
    },
    target: (p) => alert(p).getByRole("button", { name: "Yes, unsubscribe" }),
    region: (p) => [alert(p)],
  },
  {
    guide: community, slug: "resubscribe-someone", url: `${C}?status=unsubscribed`,
    act: async (p) => {
      // Find someone an admin unsubscribed: their row menu offers Resubscribe.
      const menus = p.locator("tbody tr").getByRole("button", { name: /^Actions for / });
      const n = await menus.count();
      for (let i = 0; i < n; i++) {
        await menus.nth(i).click();
        await menu(p).waitFor();
        if (await item(p, "Resubscribe").count()) {
          await p.keyboard.press("Escape");
          await p.locator("tbody tr").nth(i).locator("td").first().click();
          await dialog(p).getByRole("button", { name: "Resubscribe" }).waitFor();
          return;
        }
        await p.keyboard.press("Escape");
      }
      throw new Error("No admin-unsubscribed person on the first page");
    },
    target: (p) => dialog(p).getByRole("button", { name: "Resubscribe" }),
    region: (p) => [dialog(p).getByRole("heading").first(), dialog(p).getByRole("button", { name: "Resubscribe" }), dialog(p).getByRole("button", { name: "Close panel" })],
    pad: 24,
  },
  {
    guide: community, slug: "delete-someone-at-their-request", url: C,
    act: async (p) => {
      await openCommunityPanel(p);
      await dialog(p).getByRole("button", { name: "Delete member" }).click();
      await alert(p).waitFor();
    },
    target: (p) => alert(p).getByRole("button", { name: "Delete member" }),
    region: (p) => [alert(p)],
  },
  {
    guide: community, slug: "export-for-analysis", url: C,
    act: async (p) => {
      await btn(p, "Export members").click();
      await dialog(p).waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: "Download CSV" }).or(dialog(p).getByRole("link", { name: "Download CSV" })),
    region: (p) => [dialog(p)],
  },

  // ---- Partner: getting started ----
  {
    guide: partnerStart, slug: "sign-in-later", url: "/login",
    act: async (p) => { await p.getByLabel("Email").fill("amara@northsidefood.org"); },
    target: (p) => btn(p, "Send sign-in link"),
    region: (p) => [p.getByLabel("Email"), btn(p, "Send sign-in link")],
    pad: 48,
  },
  {
    guide: partnerStart, slug: "get-around-the-portal", url: "/partner/opportunities",
    target: (p) => sidebar(p).getByRole("link", { name: "Organization" }),
    region: () => ["viewport"],
  },
  ...accountShots(partnerStart, "/partner/opportunities"),
  {
    guide: partnerStart, slug: "update-your-organizations-details", url: "/partner/organization",
    target: (p) => btn(p, "Save changes"),
    region: (p) => [p.getByRole("heading", { name: "Profile" }), btn(p, "Save changes")],
    pad: 24,
  },
  {
    guide: partnerStart, slug: "see-who-on-your-team-has-access", url: "/partner/organization",
    act: async (p) => { await p.getByRole("heading", { name: "Team" }).scrollIntoViewIfNeeded(); },
    region: (p) => [p.getByRole("heading", { name: "Team" }), btn(p, "Invite colleague"), btn(p, "Actions for Luis Romero")],
    pad: 24,
  },
  {
    guide: partnerStart, slug: "invite-a-colleague", url: "/partner/organization",
    act: async (p) => {
      await btn(p, "Invite colleague").click();
      await dialog(p).waitFor();
    },
    target: (p) => dialog(p).getByRole("button", { name: "Send invitation" }),
    region: (p) => [dialog(p)],
  },
  {
    guide: partnerStart, slug: "remove-someone-who-has-left", url: "/partner/organization",
    act: async (p) => {
      await openPersonMenu(p, "Luis Romero");
      await item(p, "Remove from organization").click();
      await alert(p).waitFor();
    },
    target: (p) => alert(p).getByRole("button", { name: "Remove access" }),
    region: (p) => [alert(p)],
  },

  // ---- Partner: opportunities ----
  ...opportunityShots(partnerOpps, "/partner/opportunities", false),
];

// ---------- capture ----------

async function serverUp() {
  try {
    // Generous timeout: the first request to a cold dev server compiles the route.
    const res = await fetch(`${BASE}/login`, { signal: AbortSignal.timeout(120_000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function ensureServer(): Promise<ChildProcess | null> {
  if (await serverUp()) return null;
  const log = path.join(tmpdir(), "sdc-docs-dev.log");
  console.log(`Starting pnpm dev (log: ${log})…`);
  const { openSync } = await import("node:fs");
  const fd = openSync(log, "a");
  const child = spawn("pnpm", ["dev", "-p", "3000"], { cwd: ROOT, detached: true, stdio: ["ignore", fd, fd] });
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    if (await serverUp()) return child;
  }
  throw new Error("The dev server didn't start within 3 minutes.");
}

type Box = { x: number; y: number; width: number; height: number };

async function regionBox(p: Page, regions: Region[], pad: number): Promise<Box | null> {
  if (regions.includes("page") || regions.includes("viewport")) return null;
  const boxes: Box[] = [];
  for (const r of regions as Locator[]) {
    const b = await r.first().boundingBox();
    if (b) boxes.push(b);
  }
  if (!boxes.length) throw new Error("Nothing to crop to: no region is visible.");
  const x0 = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
  const y0 = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
  const x1 = Math.min(VIEWPORT.width, Math.max(...boxes.map((b) => b.x + b.width)) + pad);
  const y1 = Math.min(VIEWPORT.height, Math.max(...boxes.map((b) => b.y + b.height)) + pad);
  return { x: Math.round(x0), y: Math.round(y0), width: Math.round(x1 - x0), height: Math.round(y1 - y0) };
}

type Sharp = (input: Buffer) => {
  png: (o: object) => { toBuffer: () => Promise<Buffer> };
  resize: (o: object) => { png: (o: object) => { toBuffer: () => Promise<Buffer> } };
};

function loadSharp(): Sharp | null {
  try {
    const req = createRequire(createRequire(import.meta.url).resolve("next/package.json"));
    return req("sharp") as Sharp;
  } catch {
    console.warn("sharp not found; saving uncompressed PNGs.");
    return null;
  }
}

async function compress(sharp: Sharp | null, png: Buffer, cssWidth: number): Promise<Buffer> {
  if (!sharp) return png;
  let best = png;
  for (const colors of [256, 128, 64]) {
    best = await sharp(png).png({ palette: true, colors, quality: 90, effort: 10, compressionLevel: 9 }).toBuffer();
    if (best.length <= MAX_BYTES) return best;
  }
  // Still too big (very busy crops): drop to 1.5x.
  return sharp(png).resize({ width: Math.round(cssWidth * 1.5) }).png({ palette: true, colors: 128, effort: 10, compressionLevel: 9 }).toBuffer();
}

async function shoot(browser: Browser, shot: Shot, sharp: Sharp | null) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const p = await context.newPage();
  try {
    await p.goto(BASE + shot.url, { waitUntil: "networkidle", timeout: 180_000 });
    await p.addStyleTag({ content: HIGHLIGHT_CSS });
    await p.evaluate(() => document.fonts.ready);
    if (shot.act) await shot.act(p);
    // Panels that stream in email previews may never go fully idle; don't fail the shot over it.
    await p.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    const target = shot.target?.(p).first();
    if (target) {
      await target.waitFor({ state: "visible", timeout: 10_000 });
      await target.evaluate((el, inset) => el.setAttribute("data-docs-highlight", inset ? "inset" : ""), !!shot.inset);
    }
    // Drop focus rings and text selection left by autofocus or typing; the highlight marks the control.
    await p.evaluate(() => {
      if (!document.activeElement?.hasAttribute("data-docs-highlight")) (document.activeElement as HTMLElement | null)?.blur();
      window.getSelection()?.removeAllRanges();
    });
    if (!shot.keepPointer) await p.mouse.move(0, 0);
    await p.waitForTimeout(250);
    const regions = shot.region ? shot.region(p) : target ? [target] : ["viewport" as const];
    const clip = await regionBox(p, regions, shot.pad ?? 16);
    const png = await p.screenshot(clip ? { clip } : {});
    const out = path.join(OUT, shot.guide, `${shot.slug}.png`);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, await compress(sharp, png, clip?.width ?? VIEWPORT.width));
    console.log(`✓ ${shot.guide}/${shot.slug}.png  ${Math.round(statSync(out).size / 1024)} KB`);
    return true;
  } catch (error) {
    console.error(`✗ ${shot.guide}/${shot.slug}: ${(error as Error).message.split("\n")[0]}`);
    return false;
  } finally {
    await context.close();
  }
}

async function main() {
  const only = process.argv.slice(2);
  const shots = only.length ? SHOTS.filter((s) => only.some((o) => s.guide === o || `${s.guide}/${s.slug}` === o)) : SHOTS;
  const server = await ensureServer();
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const sharp = loadSharp();
  let failed = 0;
  try {
    for (const shot of shots) if (!(await shoot(browser, shot, sharp))) failed++;
  } finally {
    await browser.close();
    if (server?.pid) {
      try {
        process.kill(-server.pid);
      } catch {
        // Already gone.
      }
    }
  }
  console.log(`${shots.length - failed}/${shots.length} screenshots saved to ${path.relative(ROOT, OUT)}/`);
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
