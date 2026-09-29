"use server";

/* STATE LAB (disposable): read and set the simulation switches. Dev only. */
import { labFlags, setLabFlagsInMemory, type LabFlag } from "./state";

export async function getLabFlags(): Promise<LabFlag[]> {
  return labFlags();
}

export async function setLabFlags(flags: LabFlag[]): Promise<LabFlag[]> {
  if (process.env.NODE_ENV === "production") return [];
  setLabFlagsInMemory(flags);
  return labFlags();
}
