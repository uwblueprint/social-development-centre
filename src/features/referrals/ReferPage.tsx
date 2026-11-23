"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { keyframes, styled } from "next-yak";
import { Check, CircleAlert, Copy, Heart, Link2Off, Send, Plus, LoaderCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenuShortcut } from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { AppToastProvider } from "@/components/ui/Toast";
import { copy } from "./copy";
import type { Delivery, ReferralResult, ReferralValues } from "./types";
import { checkRecipient, completeEmail, firstNameOf, suggestEmail } from "./recipient";
import { SplitLayout } from "./SplitLayout";

/*
 * The member's "Invite a friend" page (opened from the footer of any SDC email): one card, the photo with
 * the heading on top and the form under it: the recipient's first name and email, then "How should we
 * invite them?" (Email them for me / I'll send it myself), as in the product page
 * (src/features/referrals/ReferPage.tsx, PR #65). "Email them for me" shows Send invite (SDC's standard email); no
 * confirmation page, just "Invitation sent to …" under it. "I'll send it myself" shows the invite link with Copy link
 * instead (only for that choice). A friend invited before gets a note and their own link.
 * Copy: ./copy.ts (proposed wording).
 */

/**
 * The last send's result (for errors, the sent note or the friend's link), the address it went to, and,
 * after an error, what was typed.
 */
export type View = { result?: ReferralResult; values?: ReferralValues; sentTo?: string };

/*
 * Every button beside a field (Next, Copy link or Share, Send invite): sized to its label, as tall as the field.
 */
const ActionButton = styled(Button)`
  /* As wide as its label; as tall as the field beside it. */
  height: var(--control-height);

  /* Phones: the rows stack (as the link row does), so every button runs full width. */
  @media (max-width: 399px) {
    width: 100%;
  }
`;

/* Says "Link copied" to screen readers when the button changes. */
const LiveNote = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const HiddenTitle = styled.h2`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const StepText = styled.p`
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/* Icon plus text, never colour alone. */
const Note = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  & > svg {
    flex: none;
    margin-top: 2px;
  }
  &[data-tone="danger"] {
    color: var(--color-danger);
  }
`;

const Well = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-mention-subtle);
  color: var(--color-mention);
`;

export interface ReferPageProps {
  /** The member's first name, for the heading. Null when the link's token isn't a current member's. */
  referrerFirstName: string | null;
  /** The server action bound to the link's token. */
  onRefer: (values: ReferralValues) => Promise<ReferralResult>;
}

/** The page behind every member email's "Refer a friend" link (/refer/<token>). */
export function ReferPage({ referrerFirstName, onRefer }: ReferPageProps) {
  if (referrerFirstName === null) return <UnknownLink />;
  return (
    <AppToastProvider>
      <Refer referrerFirstName={referrerFirstName} onRefer={onRefer} />
    </AppToastProvider>
  );
}

/** The link's token isn't a current member's (or the action says so later). */
function UnknownLink() {
  return (
    <SplitLayout title={copy.unknownTitle} lede={copy.unknownDescription}>
      <Well>
        <Icon icon={Link2Off} size={22} />
      </Well>
      <StepText>{copy.unknownHelp}</StepText>
    </SplitLayout>
  );
}

/** The form's steps: who it's for, how to invite them, then thank you. */
type Step = "who" | "how" | "thanks";


/** Where a demo starts: used by the edge-case gallery (/design/referrals/states) to open in a given state. */
export interface StartState {
  /** "who": name and email; "how": how to invite them; "thanks": the thank-you screen. */
  step?: Step;
  view?: View;
  delivery?: Delivery;
  copied?: boolean;
  copyFailed?: boolean;
}

function Refer({
  referrerFirstName,
  onRefer,
}: {
  referrerFirstName: string;
  onRefer: (values: ReferralValues) => Promise<ReferralResult>;
}) {
  // The page always opens on step 1 (a step in the URL with nothing typed shows step 1 too).
  const start = undefined as StartState | undefined;
  const bare = false;
  const [view, setView] = useState<View>(start?.view ?? {});
  /** The action says the link's token isn't a current member's any more. */
  const [unknown, setUnknown] = useState(false);
  /** Which step the form is on; the banner's subtext follows it. */
  const [step, setStepState] = useState<Step>(start?.step ?? "who");

  /*
   * The step lives in the URL (?step=how, ?step=thanks; step 1 has none), so the browser's Back and Forward
   * move between steps. Each step forward adds a history entry. Not in the gallery's cards (`bare`).
   * A step URL opened fresh (nothing typed yet) shows step 1.
   */
  function setStep(next: Step, replace = false) {
    setStepState(next);
    if (bare) return;
    const url = new URL(window.location.href);
    if (next === "who") url.searchParams.delete("step");
    else url.searchParams.set("step", next);
    if (url.href === window.location.href) return;
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  useEffect(() => {
    if (bare) return;
    const fromUrl = (): Step => {
      const s = new URL(window.location.href).searchParams.get("step");
      return s === "how" || s === "thanks" ? s : "who";
    };
    const initial = fromUrl();
    if (initial !== "who") {
      const url = new URL(window.location.href);
      url.searchParams.delete("step");
      window.history.replaceState(null, "", url);
    }
    const onPop = () => setStepState(fromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [bare]);
  /** The friend's first name, once step 1 is done: step 2's heading asks how to invite them. */
  const [friendFirst, setFriendFirst] = useState(start?.view?.values ? firstNameOf(start.view.values.name) : "");

  // No confirmation page: the form stays put. Sent or link ready: the result shows under the button.
  // Anything else keeps what was typed and shows why.
  async function submit(values: ReferralValues): Promise<ReferralResult> {
    const result = await onRefer(values).catch((): ReferralResult => ({ status: "failed" }));
    if (result.status === "unknown") setUnknown(true);
    if (result.status === "emailed") setView({ result, sentTo: values.email.trim() });
    else setView({ result, values });
    return result;
  }

  // Typing the next invite clears the last one's "sent" note or link, keeping what's typed.
  function onEditing() {
    if (view.result?.status === "emailed") setView({});
    else if (view.result?.status === "message") setView({ values: view.values });
  }

  // "Send another referral": a blank form for the next person (who gets their own link).
  function onNew() {
    setView({});
  }

  const form = (
    <SharePanel
      view={view}
      start={start}
      step={step}
      onStep={setStep}
      onFriend={setFriendFirst}
      onSubmit={submit}
      onEditing={onEditing}
      onNew={onNew}
    />
  );
  if (unknown) return <UnknownLink />;
  return (
    <SplitLayout
      title={step === "how" ? copy.headingHow(friendFirst) : copy.headingWho(referrerFirstName)}
      photo={step !== "thanks"}
    >
      {form}
    </SplitLayout>
  );
}

/* An input with its button beside it, the button stretched to the input's height. */
const LinkRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-columns: auto;
  grid-auto-flow: column;
  gap: var(--space-2);

  @media (max-width: 399px) {
    grid-auto-flow: row;
  }
`;

/*
 * Step 2's rows on one grid: the field column, then a button column as wide as the widest button. Each Field
 * and its control row are subgrids, so Send invite and Copy link share both edges without a fixed width.
 */
const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  column-gap: var(--space-2);
  row-gap: var(--space-4);

  /* Notes span the row. */
  & > p {
    grid-column: 1 / -1;
  }
  /* A Field: spans both columns and shares them (its own 6px label gap stays as the row gap). */
  & > div {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    column-gap: var(--space-2);
  }
  & > div > * {
    grid-column: 1 / -1;
  }
  & > div > ${LinkRow} {
    grid-template-columns: subgrid;
  }

  /* Phones: one column; the buttons stack under their fields, full width. */
  @media (max-width: 399px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* The friend's link is shown, not edited: clicking it selects the whole link. */
const StaticLink = styled(Input)``;


/* The thank-you screen: a heart, the thanks, one line on what happened, then the next action. */
const ThanksBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);

  & > h1 {
    margin: var(--space-1) 0 0;
    /* The same size as the banner heading on the other steps. */
    font-size: var(--text-xl);
    font-weight: var(--weight-medium);
    line-height: var(--leading-heading);
    color: var(--color-text);
  }
  & > p {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--color-text-muted);
  }
`;

/*
 * The thank-you moment (a brand screen, so it may use the brand entrance tokens; see docs/design/motion.md):
 * the heart's outline draws itself, then fills, then the words fade in. No scaling, nothing springs.
 * Reduced motion is handled globally (everything shows at once).
 */
const draw = keyframes`
  from {
    stroke-dashoffset: 72;
  }
  to {
    stroke-dashoffset: 0;
  }
`;
const fillIn = keyframes`
  from {
    fill-opacity: 0;
  }
  to {
    fill-opacity: 1;
  }
`;
const appear = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const ThanksHeart = styled.span`
  display: inline-flex;
  color: var(--color-mention);

  & path {
    fill: currentColor;
    fill-opacity: 0;
    /* The heart's outline is about 70 units long at 24px; 72 hides all of it before it draws. */
    stroke-dasharray: 72;
    stroke-dashoffset: 72;
    animation:
      ${draw} var(--duration-enter) var(--ease-out) forwards,
      ${fillIn} var(--duration-slow) var(--ease-out) var(--duration-enter) forwards;
  }

  & ~ * {
    opacity: 0;
    animation: ${appear} var(--duration-slow) var(--ease-out) var(--duration-enter) forwards;
  }
`;

/*
 * "Thanks for sharing SDC with Priya" after copying or sharing: a soft tinted bar with a filled heart (the
 * thank-you heart's colours), fading in so it's noticed. Text stays in the body colour (icon plus words,
 * never colour alone).
 */
const SharedNote = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-mention-subtle);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
  animation: ${appear} var(--duration-slow) var(--ease-out);

  & > svg {
    flex: none;
    color: var(--color-mention);
    fill: currentColor;
  }
`;

const ThanksActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
`;

const Panel = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

/* The button at the bottom right of the form. */
const SubmitRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/* "Did you mean …?" under the email field: a likely typo in a common email domain. */
/* Reads as one sentence: normal word spacing, the "?" right after the address, a little air above it. */
const Suggest = styled.span`
  display: block;
  margin-top: var(--space-1);

  & > button {
    display: inline;
    height: auto;
    padding: 0;
    border: 0;
    font-size: inherit;
    line-height: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

/**
 * Phones and tablets with a share sheet. Desktop browsers can have navigator.share too (Chrome on Windows),
 * but people there expect Copy link, so it also needs a touch screen as the main pointer.
 */
function useCanShare() {
  return useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

/* A small turning circle while sending or getting a link (still respects reduced motion: it stops). */
const SpinIcon = styled.span`
  display: inline-flex;

  & > svg {
    animation: ${spin} 0.8s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    & > svg {
      animation: none;
    }
  }
`;

function Spinner() {
  return (
    <SpinIcon aria-hidden="true">
      <Icon icon={LoaderCircle} />
    </SpinIcon>
  );
}


/* The link field. */
const LinkBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  /* Full width, also inside the thank-you block (which lines its items up on the left). */
  align-self: stretch;
`;

/* After a failed copy, the link can be selected and copied by hand. */
const SelectableLink = styled(Input)`
  user-select: all;
`;

/* The field and its offered ending, stacked: the ending sits exactly where the typed text ends. */
const Completion = styled.div`
  position: relative;
  min-width: 0;
`;

/* Same box as the input's text (a transparent 1px border and the same inline padding), so they line up. */
const Ghost = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 1px solid transparent;
  overflow: hidden;
  pointer-events: none;
  font-size: var(--text-sm);
  line-height: var(--leading-none);
  white-space: pre;
`;

const Typed = styled.span`
  color: transparent;
`;

const Ending = styled.span`
  color: var(--color-text-muted);
`;

/*
 * The Tab key hint, right after the offered ending: the kit's shortcut chip as a key outline (border, no
 * fill), a little taller so it reads as a key, in the smallest kit type size.
 */
const KeyHint = styled(DropdownMenuShortcut)`
  margin-left: 0;
  padding: var(--space-1);
  /* The UI font, not mono, with the kit's tight tracking: smaller and closer-set at the same --text-xs. */
  font-family: inherit;
  letter-spacing: var(--tracking-tight);
  background: transparent;
  /* Light: a hint, not a control (hidden from screen readers), so it needn't meet the 3:1 border rule. */
  border-color: var(--color-border);
  /* Clicking or tapping it completes the address too (the pointer path for Tab, and phones have no Tab key). */
  pointer-events: auto;
  cursor: pointer;
`;

/**
 * An email field that finishes the address: "priya@g" shows "mail.com" after the cursor, faintly, with a Tab
 * key beside it. Tab (or →) accepts it; typing anything else carries on as normal.
 */
function EmailInput({
  fieldProps,
  inputRef,
  value,
  onValue,
  invalid,
  placeholder,
}: {
  fieldProps: React.ComponentProps<typeof Input>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onValue: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const ending = focused && !invalid ? completeEmail(value) : null;

  function accept() {
    if (!ending) return;
    const full = value + ending;
    if (inputRef.current) inputRef.current.value = full;
    onValue(full);
  }

  return (
    <Completion>
      <Input
        {...fieldProps}
        ref={inputRef}
        type="email"
        name="email"
        aria-required
        placeholder={placeholder}
        autoComplete="off"
        maxLength={254}
        defaultValue={value}
        onChange={(e) => onValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (!ending || e.shiftKey || (e.key !== "Tab" && e.key !== "ArrowRight")) return;
          // Email fields don't report the cursor position; the ending only shows while typing at the end.
          e.preventDefault();
          accept();
        }}
      />
      {ending && (
        <Ghost aria-hidden="true">
          <span>
            <Typed>{value}</Typed>
            <Ending>{ending}</Ending>
          </span>
          <KeyHint
            onMouseDown={(e) => {
              // Keep focus in the field (a blur would hide the ending before the click lands).
              e.preventDefault();
              accept();
            }}
          >
            {copy.completeKey}
          </KeyHint>
        </Ghost>
      )}
    </Completion>
  );
}

/**
 * The form: the recipient's first name and email, then how to invite them: SDC emails them (Send invite),
 * or the member copies that friend's own link to send themselves. Submitting never leaves the page.
 *
 * Submitted by hand (not a form action): an action resets the form, and resetting a Radix radio group
 * snaps the choice back to its default, which would undo "I'll send it myself" after every error.
 */
function SharePanel({
  view,
  start,
  onSubmit,
  onEditing,
  onNew,
  step,
  onStep: setStep,
  onFriend,
}: {
  view: View;
  start?: StartState;
  onSubmit: (values: ReferralValues) => Promise<ReferralResult>;
  onEditing: () => void;
  onNew: () => void;
  step: Step;
  /** Moves to a step. `replace` for corrections (a failed send), so Back doesn't land on a dead step. */
  onStep: (step: Step, replace?: boolean) => void;
  onFriend: (firstName: string) => void;
}) {
  const canShare = useCanShare();
  /** Mistakes found on Next (before anything is sent). */
  const [stepErrors, setStepErrors] = useState<{ name?: string; email?: string } | null>(null);
  const recipientRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(view.values?.name ?? "");
  const [email, setEmail] = useState(view.values?.email ?? "");
  const [pending, startTransition] = useTransition();
  /** Which action is running, for its progress label ("Sending…", "Getting link…"). */
  const [running, setRunning] = useState<"send" | "link" | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  /** True for a few seconds after copying: the button shows a check and "Copied". */
  const [copied, setCopied] = useState(start?.copied ?? false);
  /** Their link has been copied or shared: the thanks line shows under it. */
  const [linkCopied, setLinkCopied] = useState(start?.copied ?? false);
  /** The browser blocked the copy: the link becomes selectable and a note says to copy it by hand. */
  const [copyFailed, setCopyFailed] = useState(start?.copyFailed ?? false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const { result } = view;
  const fieldErrors = stepErrors ?? (result?.status === "invalid" ? result.fieldErrors : {});
  // No daily limit (Nov 23): the only form-wide error is a failed connection.
  // The backend still has a daily limit (the design drops it; see docs/backend/referrals.md).
  const formError = result?.status === "failed" ? copy.failed : result?.status === "limit" ? copy.limit : undefined;
  const link = result?.status === "message" ? result : undefined;
  // Always show a link: the recorded one once it exists, else the one their email will get.
  // The server makes their link when the referral is recorded (Copy link, or asking again after an email).
  const shownLink = link ? link.link : undefined;
  /** Who the thank-you screen names. */
  // Always the page's own reading of what was typed (titles dropped), so every line names them the same way.
  const friend = firstNameOf(name) || (result && "friendName" in result ? result.friendName : "");
  // A likely typo ("gmial.com"), offered before sending so the referral isn't tracked to a dead address.
  // Only for a finished address with a typo ("gmial.com"); while typing, the field offers the ending instead.
  const suggestion = fieldErrors.email || completeEmail(email) ? null : suggestEmail(email);

  function clearFields() {
    if (nameRef.current) nameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
    setName("");
    setEmail("");
  }

  /** Step 1 → 2: check the name and email first, so mistakes show before choosing how to invite. */
  function next() {
    const errors = checkRecipient(name, email);
    setStepErrors(errors);
    if (errors) return;
    onFriend(firstNameOf(name));
    setStep("how");
    // Focus lands on their email (not a button): the first thing on the step, and what to check.
    requestAnimationFrame(() => recipientRef.current?.focus());
  }


  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter on step 1 means Next; on step 2 it sends the invite.
    if (step === "who") {
      next();
      return;
    }
    // The email can be edited on this step, so check it again first.
    const errors = checkRecipient(name, email);
    setStepErrors(errors);
    if (errors) return;
    // Straight to the thank-you screen; sending finishes behind it. If it fails, back to this step with why.
    setStep("thanks");
    setRunning("send");
    startTransition(async () => {
      const r = await onSubmit({ name, email, delivery: "email" });
      // A problem with the name goes back to step 1; with the email (invalid, or their own), step 2 has the
      // email field, so it stays there. Anything else that isn't "emailed" comes back to step 2 with why.
      if (r.status === "invalid") setStep(r.fieldErrors.name ? "who" : "how", true);
      else if (r.status !== "emailed") setStep("how", true);
    });
  }

  /**
   * "I'll send it myself": the referral is recorded against this email first (same checks as Send invite),
   * then that friend's own link is copied and shown, so whoever joins through it is tracked. Once the link
   * exists, Copy link just copies it again (no second record).
   */
  function copyTheirLink() {
    withTheirLink((url) => copyLink(url));
  }

  /** Phones: the system share sheet (Messages, WhatsApp, email…), after recording the referral the same way. */
  function shareTheirLink() {
    withTheirLink(async (url) => {
      try {
        await navigator.share({ title: copy.shareTitle, text: copy.shareText, url });
        setLinkCopied(true);
      } catch {
        // Closed the share sheet without sharing: nothing to do.
      }
    });
  }

  /** Records the referral first if needed (same checks as Send invite), then hands over their link. */
  function withTheirLink(handOver: (url: string) => Promise<void>) {
    if (link && shownLink) {
      void handOver(shownLink);
      return;
    }
    setRunning("link");
    startTransition(async () => {
      const r = await onSubmit({ name, email, delivery: "self" });
      if (r.status === "message") await handOver(r.link);
      if (r.status === "invalid" && r.fieldErrors.name) setStep("who", true);
    });
  }

  async function copyLink(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(true);
      setLinkCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      // Some browsers (Safari) refuse a copy that comes after a network wait. The referral is already
      // recorded, so don't lose the link: make it selectable and say how to copy it.
      setCopied(false);
      setCopyFailed(true);
      requestAnimationFrame(() => linkRef.current?.select());
    }
  }

  function startNew() {
    clearFields();
    setStep("who");
    setStepErrors(null);
    setLinkCopied(false);
    setCopied(false);
    setCopyFailed(false);
    onNew();
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  function edited() {
    setCopyFailed(false);
    setStepErrors(null);
    onEditing();
  }


  /**
   * Their link with Copy link (Share on phones). On the thank-you screen the referral is already recorded
   * (the email went out), so Copy link just copies, under a plain label.
   */
  const linkField = (forFriend: NonNullable<typeof link> | undefined, afterSend = false) => (
    <Field label={afterSend ? copy.friendLinkLabel(friend) : copy.linkRowLabel(friend)}>
        {(p) => (
          <LinkRow>
            {copyFailed && forFriend ? (
              <SelectableLink {...p} ref={linkRef} readOnly value={shownLink} onFocus={(e) => e.currentTarget.select()} />
            ) : (
              // Their link, shown as soon as their email is typed. Clicking it selects it (to copy by hand);
              // only the button copies.
              <StaticLink
                {...p}
                readOnly
                value={shownLink ?? ""}
                placeholder={copy.linkPlaceholder}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
              />
            )}
            {/* Phones (where the browser can share): Share opens the system share sheet. Laptops: Copy link.
                After an email, this field only appears when a copy failed; its Copy link is the one above it. */}
            {afterSend ? null : canShare ? (
              <ActionButton type="button" $variant="outline" disabled={pending} aria-busy={pending || undefined} onClick={shareTheirLink}>
                {pending && running === "link" ? <Spinner /> : <Icon icon={Share2} />}
                {pending && running === "link" ? copy.gettingLink : copy.share}
              </ActionButton>
            ) : (
              <ActionButton
                type="button"
                $variant="outline"
                disabled={pending}
                aria-busy={pending || undefined}
                onClick={copyTheirLink}
              >
                {pending && running === "link" ? <Spinner /> : <Icon icon={copied ? Check : Copy} />}
                {pending && running === "link" ? copy.gettingLink : copied ? copy.copiedShort : copy.copyLink}
              </ActionButton>
            )}
          </LinkRow>
        )}
    </Field>
  );

  if (step === "thanks") {
    return (
      <Panel aria-label={copy.sendTitle} onSubmit={(e) => e.preventDefault()}>
        <ThanksBlock role="status">
          <ThanksHeart>
            <Icon icon={Heart} size={40} />
          </ThanksHeart>
          <h1>{copy.thanksTitle(friend)}</h1>
          {copyFailed && (
            <Note role="alert" data-tone="danger">
              <Icon icon={CircleAlert} size={16} />
              {copy.copyFailedLink}
            </Note>
          )}
          <ThanksActions>
            <Button type="button" onClick={startNew}>
              <Icon icon={Plus} />
              {copy.again}
            </Button>
            {/* Their link too, to send another way (a text, a chat). The email already recorded the invite. */}
            {(
              <Button
                type="button"
                $variant="outline"
                disabled={pending}
                // After an email the referral exists; asking again returns its link and never emails twice.
                onClick={() => (shownLink ? void copyLink(shownLink) : copyTheirLink())}
              >
                <Icon icon={copied ? Check : Copy} />
                {copied ? copy.copiedShort : copy.copyLink}
              </Button>
            )}
          </ThanksActions>
          {/* The browser blocked the copy: show the link, selected, to copy by hand. */}
          {copyFailed && shownLink && <LinkBlock>{linkField(undefined, true)}</LinkBlock>}
        </ThanksBlock>
      </Panel>
    );
  }

  return (
    <Panel onSubmit={submit} noValidate aria-label={copy.sendTitle}>
      {/* Not shown: the photo panel already says what this is. Kept for screen readers. */}
      <HiddenTitle>{copy.formTitle}</HiddenTitle>
      {step === "who" ? (
        <>
      {/* Both fields are required, so neither is marked: Next says what's missing. */}
      <Field label={copy.nameLabel} error={fieldErrors.name}>
        {(p) => (
          <Input
            {...p}
            aria-required
            ref={nameRef}
            name="name"
            placeholder={copy.namePlaceholder}
            autoComplete="off"
            maxLength={80}
            defaultValue={name}
            onChange={(e) => {
              setName(e.target.value);
              edited();
            }}
          />
        )}
      </Field>
      <Field
        label={copy.emailLabel}
        error={fieldErrors.email}
        hint={
          suggestion && (
            <Suggest>
              {copy.didYouMean}{" "}
              <Button
                type="button"
                $variant="ghost"
                $size="sm"
                onClick={() => {
                  if (emailRef.current) emailRef.current.value = suggestion;
                  setEmail(suggestion);
                  edited();
                }}
              >
                {suggestion}
              </Button>?
            </Suggest>
          )
        }
      >
        {(p) => (
          <EmailInput
            fieldProps={p}
            inputRef={emailRef}
            value={email}
            invalid={Boolean(fieldErrors.email)}
            placeholder={copy.emailPlaceholder}
            onValue={(v) => {
              setEmail(v);
              edited();
            }}
          />
        )}
      </Field>
      <SubmitRow>
        {/* Always available: pressing it with something missing or wrong shows why under that field. */}
        <ActionButton type="submit">{copy.next}</ActionButton>
      </SubmitRow>
        </>
      ) : (
        <>
      {/*
        Step 2: the two ways to invite them, one row each, each with its own label and button (as Gusto does):
        SDC emails them (their email, editable here, with Send invite beside it), or the member sends the link
        themselves (with Copy link, or Share on phones). Both rows share one grid (ActionGrid), so the two
        buttons are one width: the wider label's.
      */}
      <ActionGrid>
      <Field label={copy.emailRowLabel(friend)} error={fieldErrors.email}>
        {(p) => (
          <LinkRow>
            <EmailInput
              fieldProps={p}
              inputRef={recipientRef}
              value={email}
              invalid={Boolean(fieldErrors.email)}
              onValue={(v) => {
                setEmail(v);
                edited();
              }}
            />
            <ActionButton type="submit" disabled={pending} aria-busy={pending || undefined}>
              {pending && running === "send" ? <Spinner /> : <Icon icon={Send} />}
              {pending && running === "send" ? copy.sending : copy.submitEmail}
            </ActionButton>
          </LinkRow>
        )}
      </Field>
      {formError && (
        <Note role="alert" data-tone="danger">
          <Icon icon={CircleAlert} size={16} />
          {formError}
        </Note>
      )}
      {link?.referredOn && (
        <SharedNote>
          <Icon icon={Heart} size={16} />
          {copy.alreadyInvited(friend, link.referredOn)}
        </SharedNote>
      )}
      {linkField(link)}
      </ActionGrid>
      {/* After copying or sharing: thanks, right where they acted. The page stays put. */}
      {linkCopied && !copyFailed && (
        <SharedNote>
          <Icon icon={Heart} size={16} />
          {copy.linkThanks(friend)}
        </SharedNote>
      )}
        </>
      )}

      <LiveNote role="status">{copied ? copy.linkCopied : ""}</LiveNote>
      {copyFailed && (
        <Note role="alert" data-tone="danger">
          <Icon icon={CircleAlert} size={16} />
          {copy.copyFailedLink}
        </Note>
      )}
    </Panel>
  );
}
