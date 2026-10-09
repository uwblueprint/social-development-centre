"use client";

import * as React from "react";
import type { ActionState } from "@/lib/forms";

/**
 * After a submit comes back with field errors, moves focus to the first invalid control in the form
 * (the errors themselves show inline; there's no summary toast). Used by both portals' forms.
 */
export function useFocusFirstInvalid(formRef: React.RefObject<HTMLFormElement | null>, state: ActionState<unknown>) {
  React.useEffect(() => {
    if (!state.fieldErrors || Object.keys(state.fieldErrors).length === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [formRef, state]);
}
