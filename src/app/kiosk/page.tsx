import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "../admin/_data/session";
import { Kiosk } from "./Kiosk";

export const metadata: Metadata = { title: "Booth sign-up · SDC" };

// The on-screen keyboard resizes the layout (and 100dvh), so a focused field can scroll clear of it.
export const viewport: Viewport = { interactiveWidget: "resizes-content" };

/** Tablet sign-up for an SDC booth. Opened by an admin from Community in a new tab; no admin shell. */
export default async function KioskPage({ searchParams }: PageProps<"/kiosk">) {
  if (!(await getCurrentAdmin())) redirect("/login");

  const { location } = await searchParams;
  const label = typeof location === "string" ? location.trim().slice(0, 80) : "";

  return <Kiosk location={label || null} />;
}
