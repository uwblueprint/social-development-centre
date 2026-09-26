/**
 * The shape every server action behind a form returns, so the UI can show
 * success, a form-level message, and per-field errors without custom wiring.
 */
export interface ActionState<Data = undefined> {
  status: "idle" | "success" | "error";
  /** Shown as a toast or banner. Plain language: what happened and what to do next. */
  message?: string;
  /** Keyed by the control's `name`; rendered by `Field` as the field's error. */
  fieldErrors?: Partial<Record<string, string>>;
  data?: Data;
}

export const idleState: ActionState = { status: "idle" };

export function fieldError(state: ActionState<unknown>, name: string): string | undefined {
  return state.fieldErrors?.[name];
}
