"use client";

import * as React from "react";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { idleState } from "@/lib/forms";
import { requireOnline } from "@/lib/offline";
import { partnersCopy } from "../_copy";
import { saveOrganizationNotes } from "../_data/actions";
import { ORGANIZATION_NOTES_MAX, type AdminPartnerOrganization } from "../_data/types";

const copy = partnersCopy.organizationPanel;

/** How long typing must pause before notes save. */
const NOTES_SAVE_DELAY_MS = 800;

/**
 * Notes save themselves (no Save button, no edit history). A save runs once typing pauses and
 * when the field loses focus; a quiet status says Saving… / Saved, and errors show on the field.
 */
export function OrganizationNotes({ org }: { org: AdminPartnerOrganization }) {
  const [notes, setNotes] = React.useState(org.notes?.text ?? "");
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = React.useState<string>();
  const saved = React.useRef(org.notes?.text ?? "");
  const timer = React.useRef<number>(undefined);

  const save = React.useCallback(
    async (value: string) => {
      window.clearTimeout(timer.current);
      if (value === saved.current || !requireOnline()) return;
      setStatus("saving");
      const fd = new FormData();
      fd.set("notes", value);
      const result = await saveOrganizationNotes(org.id, idleState, fd);
      if (result.status === "success") {
        saved.current = value;
        setError(undefined);
        setStatus("saved");
      } else {
        setError(result.fieldErrors?.notes ?? result.message);
        setStatus("idle");
      }
    },
    [org.id],
  );

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Field
      label={copy.notesLabel}
      error={error}
      hint={<span aria-live="polite">{status === "saving" ? copy.notesSaving : status === "saved" ? copy.notesSaved : ""}</span>}
    >
      {(p) => (
        <Textarea
          {...p}
          name="notes"
          rows={4}
          maxLength={ORGANIZATION_NOTES_MAX}
          value={notes}
          onChange={(e) => {
            const value = e.target.value;
            setNotes(value);
            setStatus("idle");
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => void save(value), NOTES_SAVE_DELAY_MS);
          }}
          onBlur={() => void save(notes)}
        />
      )}
    </Field>

  );
}
