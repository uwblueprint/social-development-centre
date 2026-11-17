"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { CircleAlert, LoaderCircle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DialogActions, DialogClose } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { SAVING_FOR, type StateLab } from "../_state-lab/useStateLab";
import type { GeneralFlag } from "../_state-lab/context";

/** General states that can't happen inside a dialog: the panel marks them "Doesn't apply". */
export const DIALOG_NOT_APPLICABLE = [
  "loading",
  "slowLoading",
  "loadFailed",
  "empty",
  "notFound",
  "noPermission",
  "reconnecting",
  "readOnly",
  "sectionFailed",
  "sectionEmpty",
  "staleData",
  "rateLimited",
  "actionDenied",
  "undoExpired",
] as const satisfies readonly GeneralFlag[];

/** Dialogs that never show a list also skip these section states. */
export const NO_ITEMS = ["partialData", "manyItems", "singleItem"] as const satisfies readonly GeneralFlag[];

/** A dialog with a single version to save has nothing to compare: Changed by someone else doesn't apply. */
export const NO_CONFLICT = ["conflict"] as const satisfies readonly GeneralFlag[];

/** Sample long values for the Long text state: no spaces, so they only fit if they wrap or scroll. */
export const LONG_NAME = "Wolfeschlegelsteinhausenbergerdorff-Montgomery";
export const LONG_EMAIL = "wolfeschlegelsteinhausenbergerdorff.montgomery.the.third@a-very-long-organisation-name.example.org";
export const LONG_NOTE =
  "Prefers to be contacted only through the shared inbox at wolfeschlegelsteinhausenbergerdorff.montgomery@a-very-long-organisation-name.example.org and not by phone. " +
  "Joined through the community garden partnership, helped with the spring fundraiser and the autumn volunteer drive, and asked us to double-check the spelling of their surname on every receipt before it is sent.";

type LabFlags = Pick<StateLab<never>, "saving" | "saveFailed" | "sessionExpired" | "offline" | "conflict">;

export type Phase = "idle" | "saving" | "error" | "conflict";

export interface ConflictInfo {
  /** What changed, in one or two sentences. */
  message: string;
  /** Replace what they typed with the other version. */
  useTheirs: () => void;
}

export interface Submit {
  phase: Phase;
  busy: boolean;
  message?: string;
  conflict?: ConflictInfo;
  /** Run a submit: simulates the lab's saving, failing and conflict states, then calls `commit` as usual. */
  run: (commit: () => void) => void;
  retry: () => void;
  keepMine: () => void;
  useTheirs: () => void;
}

const SAVE_FAILED = "Couldn't save. Something went wrong on our side. Your changes are still here, so try again.";
const SESSION_EXPIRED = "You've been signed out. Sign in again in another tab, then come back and try again. Your changes are still here.";
const OFFLINE = "You're offline. Check your connection, then try again. Your changes are still here.";

/**
 * Drives a dialog's submit through the State lab: Saving, Save failed, Session expired, Offline and
 * (when `conflict` is given) Changed by someone else. With no flag on, `run` just calls `commit`.
 */
export function useSubmit(lab: LabFlags, conflict?: ConflictInfo): Submit {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [message, setMessage] = React.useState<string>();
  const timer = React.useRef<number | undefined>(undefined);
  const last = React.useRef<(() => void) | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = (commit: () => void) => {
    if (phase === "saving") return;
    last.current = commit;
    const failure = lab.offline ? OFFLINE : lab.sessionExpired ? SESSION_EXPIRED : lab.saveFailed ? SAVE_FAILED : undefined;
    const finish = () => {
      if (failure) {
        setMessage(failure);
        setPhase("error");
      } else if (lab.conflict && conflict) {
        setPhase("conflict");
      } else {
        setPhase("idle");
        commit();
      }
    };
    if (lab.saving) {
      setMessage(undefined);
      setPhase("saving");
      timer.current = window.setTimeout(finish, SAVING_FOR);
    } else finish();
  };

  return {
    phase,
    busy: phase === "saving",
    message,
    conflict,
    run,
    retry: () => last.current && run(last.current),
    keepMine: () => {
      setPhase("idle");
      last.current?.();
    },
    useTheirs: () => {
      setPhase("idle");
      conflict?.useTheirs();
    },
  };
}

/** Runs `apply` once each time `on` turns true (state adjusted while rendering, not in an effect). */
export function useWhenOn(on: boolean, apply: () => void) {
  const [seen, setSeen] = React.useState(false);
  if (on !== seen) {
    setSeen(on);
    if (on) apply();
  }
}

/* ---------- pieces ---------- */

/** Blocks every control inside while a save is in flight. It adds no box of its own. */
export const Lock = styled.fieldset`
  display: contents;
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Relative = styled(Button)`
  position: relative;
`;

const Label = styled.span<{ $hidden: boolean }>`
  visibility: ${({ $hidden }) => ($hidden ? "hidden" : "visible")};
`;

const Spinner = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;

/** A button that shows a spinner at the same width while `busy`, and ignores clicks. */
export function BusyButton({
  busy,
  $variant,
  type = "submit",
  onClick,
  children,
}: {
  busy: boolean;
  $variant?: React.ComponentProps<typeof Button>["$variant"];
  type?: "submit" | "button";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Relative
      type={type}
      $variant={$variant}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      onClick={(e) => {
        if (busy) e.preventDefault();
        else onClick?.();
      }}
    >
      <Label $hidden={busy}>{children}</Label>
      {busy && (
        <Spinner aria-hidden="true">
          <Icon icon={LoaderCircle} size={16} />
        </Spinner>
      )}
    </Relative>
  );
}

const Note = styled.div<{ $tone: "danger" | "warning" }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid ${({ $tone }) => ($tone === "danger" ? "var(--color-danger-border)" : "var(--color-warning-border)")};
  border-radius: var(--radius-md);
  background: ${({ $tone }) => ($tone === "danger" ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)")};
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;

  & svg {
    flex: none;
    margin-top: 2px;
    color: ${({ $tone }) => ($tone === "danger" ? "var(--color-danger)" : "var(--color-warning)")};
  }
`;

const NoteBody = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
`;

const Strong = styled.strong`
  font-weight: var(--weight-medium);
`;

/** The inline error (with Try again) or the conflict explanation. Renders nothing otherwise. */
export function SubmitNote({ submit }: { submit: Submit }) {
  if (submit.phase === "error" && submit.message) {
    return (
      <Note $tone="danger" role="alert">
        <Icon icon={CircleAlert} size={16} />
        <NoteBody>
          <span>{submit.message}</span>
          <Button type="button" $variant="outline" $size="sm" onClick={submit.retry}>
            Try again
          </Button>
        </NoteBody>
      </Note>
    );
  }
  if (submit.phase === "conflict" && submit.conflict) {
    return (
      <Note $tone="warning" role="alert">
        <Icon icon={TriangleAlert} size={16} />
        <NoteBody>
          <Strong>Changed by someone else</Strong>
          <span>{submit.conflict.message}</span>
        </NoteBody>
      </Note>
    );
  }
  return null;
}

const SplitActions = styled(DialogActions)`
  & > :first-child {
    margin-right: auto;
  }
`;

/**
 * Cancel and the submit button. While saving the submit button shows progress; on a conflict the
 * buttons become Use theirs and Keep mine. `leading` is a destructive action pinned to the left.
 */
export function SubmitActions({ submit, state, leading }: { submit: string; state: Submit; leading?: React.ReactNode }) {
  const Row = leading ? SplitActions : DialogActions;
  return (
    <Row>
      {leading}
      <DialogClose asChild>
        <Button type="button" $variant="secondary">
          Cancel
        </Button>
      </DialogClose>
      {state.phase === "conflict" ? (
        <>
          <Button type="button" $variant="outline" onClick={state.useTheirs}>
            Use theirs
          </Button>
          <Button type="button" onClick={state.keepMine}>
            Keep mine
          </Button>
        </>
      ) : (
        <BusyButton busy={state.busy}>{submit}</BusyButton>
      )}
    </Row>
  );
}
