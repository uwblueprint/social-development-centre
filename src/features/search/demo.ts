import type { EmailHit, PersonHit } from "./types";

/** Demo data for running locally without Supabase. Made-up people at example addresses. */
export const DEMO_PEOPLE: PersonHit[] = [
  { id: "demo-amara", name: "Amara Okafor", email: "amara.okafor@example.com" },
  { id: "demo-bea", name: "Beatriz Santos", email: "bea.santos@example.com" },
  { id: "demo-chen", name: "Chen Wei", email: "chen.wei@example.com" },
  { id: "demo-dev", name: "Dev Patel", email: "dev.patel@example.com" },
  { id: "demo-eli", name: "Eli Martin", email: "eli@example.com" },
  { id: "demo-fatima", name: "Fatima Haddad", email: "fatima.haddad@example.com" },
  { id: "demo-gabriel", name: "Gabriel Côté", email: "gabriel.cote@example.com" },
  { id: "demo-hana", name: "Hana Kim", email: "hana.kim@example.com" },
  { id: "demo-isla", name: "Isla MacDonald", email: "isla.mac@example.com" },
  { id: "demo-jo", name: "Joan Smith", email: "joan.smith@example.com" },
  { id: "demo-kofi", name: "Kofi Mensah", email: "kofi.mensah@example.com" },
  { id: "demo-lena", name: "Lena Novak", email: "lena.novak@example.com" },
  { id: "demo-noname", name: null, email: "no.name.yet@example.com" },
  { id: "demo-zoe", name: "Zoë Tremblay", email: "zoe.tremblay@example.com" },
];

export const DEMO_EMAILS: EmailHit[] = [
  { id: "demo-welcome", name: "Welcome to SDC" },
  { id: "demo-first-month", name: "Your first month" },
  { id: "demo-renewal", name: "Membership renewal reminder" },
  { id: "demo-volunteer", name: "Volunteer tag follow-up" },
];
