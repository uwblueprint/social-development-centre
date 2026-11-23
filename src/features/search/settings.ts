import { ALERTS } from "@/app/design/(admin)/settings/data";
import { settingTargetId } from "./targets";

/** One row on a Settings page. `section` shows beside it in the palette. */
export interface SettingEntry {
  key: string;
  label: string;
  section: string;
  keywords?: readonly string[];
}

const NAME: SettingEntry[] = [
  { key: "first-name", label: "First name", section: "Your name", keywords: ["name"] },
  { key: "last-name", label: "Last name", section: "Your name", keywords: ["name", "surname"] },
];

const DELETE: SettingEntry = {
  key: "delete-account",
  label: "Delete account",
  section: "Delete account",
  keywords: ["remove account", "close account", "leave"],
};

const FOOTER: SettingEntry = {
  key: "footer",
  label: "Email footer",
  section: "Email sending",
  keywords: ["signature", "sign-off", "sign off", "mailing address", "unsubscribe"],
};

const THEME: SettingEntry = { key: "theme", label: "Theme", section: "Appearance", keywords: ["dark mode", "light mode"] };

/**
 * The rows each Settings page has. The built page has your name, the email footer, the theme and Delete account
 * (reply-to and alerts wait on their backend, docs/backend/settings.md); the design page has them all.
 * Each row's id comes from `settingTargetId(key)`.
 */
const SETTINGS: Record<"admin" | "design", SettingEntry[]> = {
  admin: [...NAME, FOOTER, THEME, DELETE],
  design: [
    {
      key: "reply-to",
      label: "Reply-to address",
      section: "Email sending",
      keywords: ["reply", "replies", "email address"],
    },
    FOOTER,
    ...ALERTS.map((a) => ({
      key: `alert-${a.key}`,
      label: a.label,
      section: "Email alerts",
      keywords: ["alerts", "notifications", "email alerts"],
    })),
    { key: "name", label: "Your name", section: "Account", keywords: ["name", "first name", "last name"] },
    { key: "email", label: "Your email", section: "Account", keywords: ["sign in", "login"] },
    { ...THEME, section: "Account" },
    { key: "support", label: "Support", section: "Account", keywords: ["help", "support", "bug", "problem", "broken"] },
    DELETE,
  ],
};

const SETTINGS_PATH = { admin: "/admin/settings", design: "/design/settings" } as const;

export function settingsFor(from: "admin" | "design") {
  return SETTINGS[from].map((s) => ({ ...s, href: `${SETTINGS_PATH[from]}#${settingTargetId(s.key)}` }));
}
