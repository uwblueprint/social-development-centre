"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { keyframes, styled } from "next-yak";
import { ArrowRight, Check, CircleAlert, Copy, Heart, Info, Link2Off, LoaderCircle, Plus, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { AppToastProvider } from "@/components/ui/Toast";
import { copy } from "./copy";
import type { Delivery, ReferralResult, ReferralValues } from "@/features/referrals/types";
import { EmailInput } from "./EmailInput";
import { capitalizeName, checkRecipient, completeEmail, demoReferFriend, previewLinkFor, suggestEmail } from "./data";
import { SplitLayout, type PanelLayout, type PanelVariant } from "./SplitLayout";

/*
 * The member's "Invite a friend" page (opened from the footer of any SDC email): one card, the photo with
 * the heading on top and the form under it, in two steps: the recipient's full name and email, then Next;
 * then Send email invite (SDC's standard email; the form switches to "Thank you! We've emailed … an
 * invite.") or, under "or", their invite link with Copy link, to send themselves ("Thanks for sharing SDC
 * with …" shows under it). A friend invited before gets a note and their own link.
 * Copy: ./copy.ts (proposed wording).
 */

/**
 * The last send's result (for errors, the sent note or the friend's link), the address it went to, and,
 * after an error, what was typed.
 */
export type View = { result?: ReferralResult; values?: ReferralValues; sentTo?: string };

/* Keeps its width when the label switches to "Copied", so nothing beside it shifts. */
const CopyButton = styled(Button)`
  min-width: 8em;
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
  font-size: var(--text-md);
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

export function ReferDesign({
  unknownLink,
  panel,
  layout,
}: {
  unknownLink: boolean;
  panel: PanelVariant;
  layout: PanelLayout;
}) {
  if (unknownLink) {
    return (
      <SplitLayout variant={panel} layout={layout} title={copy.unknownTitle} lede={copy.unknownDescription}>
        <Well>
          <Icon icon={Link2Off} size={22} />
        </Well>
        <StepText>{copy.unknownHelp}</StepText>
      </SplitLayout>
    );
  }
  return (
    <AppToastProvider>
      <Refer panel={panel} layout={layout} />
    </AppToastProvider>
  );
}

/** The form's two steps: who it's for, then how to invite them. */
type Step = "who" | "how";

/** Where a demo starts: used by the edge-case gallery (/design/referrals/states) to open in a given state. */
export interface StartState {
  /** "who": name and email; "how": how to invite them. */
  step?: Step;
  view?: View;
  delivery?: Delivery;
  copied?: boolean;
  copyFailed?: boolean;
}

function Refer({
  panel,
  layout,
  start,
  bare = false,
}: {
  panel?: PanelVariant;
  layout?: PanelLayout;
  start?: StartState;
  /** Just the form (no photo panel), for the gallery. */
  bare?: boolean;
}) {
  const [view, setView] = useState<View>(start?.view ?? {});
  /** Which step the form is on; the banner's subtext follows it. */
  const [step, setStep] = useState<Step>(start?.step ?? "who");

  // No confirmation page: the form stays put. Sent or link ready: the result shows under the button.
  // Anything else keeps what was typed and shows why.
  async function submit(values: ReferralValues): Promise<ReferralResult> {
    const result = await demoReferFriend(values).catch((): ReferralResult => ({ status: "failed" }));
    if (result.status === "emailed") setView({ result, sentTo: values.email.trim() });
    else setView({ result, values });
    return result;
  }

  // Typing the next invite clears the last one's "sent" note or link, keeping what's typed.
  function onEditing() {
    if (view.result?.status === "emailed") setView({});
    else if (view.result?.status === "message") setView({ values: view.values });
  }

  // Switching between "Email them for me" and "I'll send it myself" starts fresh: no old error or result
  // (what's typed stays).
  function onChoiceChange() {
    setView((v) => ({ values: v.values }));
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
      onSubmit={submit}
      onEditing={onEditing}
      onChoiceChange={onChoiceChange}
      onNew={onNew}
    />
  );
  if (bare) return form;
  // After Send email invite, the banner itself says thank you (with a heart that draws itself) in place of
  // "Share SDC referral"; the card under it keeps Invite someone else and Copy link.
  const emailed = view.result?.status === "emailed" ? view.result : null;
  return (
    <SplitLayout
      variant={panel}
      layout={layout}
      title={emailed ? copy.thanksTitle(firstName(emailed.friendName)) : copy.sendTitle}
      lede={null}
      icon={
        emailed ? (
          <BannerHeart>
            <Icon icon={Heart} size={40} />
          </BannerHeart>
        ) : undefined
      }
      plainIcon
    >
      {form}
    </SplitLayout>
  );
}

/** The first word of a name, for thank-yous: "Priya" from "Priya Sharma". */
function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

/* SubmitButton-style label: text then icon. */
const WithIcon = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
`;

/* An input with its button beside it, the button stretched to the input's height. */
const LinkRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-columns: auto;
  grid-auto-flow: column;
  gap: var(--space-2);

  @media (min-width: 400px) {
    & > button {
      height: 100%;
    }
  }

  /* Send email invite and Copy link share one width (the wider of the two, set by SharePanel), so the two
     rows line up. */
  @media (min-width: 400px) {
    & > [data-same-width] {
      min-width: var(--action-width, auto);
    }
  }

  @media (max-width: 399px) {
    grid-auto-flow: row;
  }
`;

/* The friend's link is shown, not edited: it can't be clicked into or focused (Copy link copies it). */
const StaticLink = styled(Input)`
  pointer-events: none;
  user-select: none;
`;

/* "Invitation sent to …": green check plus text, never colour alone. */
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

/* After Send email invite: the card keeps Invite someone else and Copy link, fading in. */
const ThanksBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  animation: ${appear} var(--duration-slow) var(--ease-out);
`;

/* The banner's thank-you heart (as on Gaurav's page, PR #90): it draws itself, then fills. Pale green, since
   the banner is always dark. */
const BannerHeart = styled.span`
  display: inline-flex;
  color: var(--sdc-200);

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
`;

const ThanksActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

/*
 * "Thanks for sharing SDC with Priya" after copying or sharing (as on Gaurav's page, PR #90): a soft tinted
 * bar with a filled heart, fading in so it's noticed. Text stays in the body colour (icon plus words, never
 * colour alone).
 */
const SharedNote = styled.p`
  display: flex;
  align-items: flex-start;
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
    height: 1lh;
    color: var(--color-mention);
    fill: currentColor;
  }
`;

const Panel = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

/* The button at the bottom right of the form. */
/*
 * Required fields get a red asterisk after the label instead of the kit's "(required)", as on the join page
 * (src/app/design/membership/JoinPage.tsx). The asterisk is hidden from screen readers; the inputs carry
 * \`required\`, which they announce. Not the kit's way (Field's \`required\` shows "(required)"): check with the
 * design-system owner before reusing it elsewhere.
 */
const Asterisk = styled.span`
  margin-left: var(--space-1);
  color: var(--color-danger);
`;

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Asterisk aria-hidden="true">*</Asterisk>
    </>
  );
}

const SubmitRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/* "or" between Send invite and their link, with a line either side. */
const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-top: 1px solid var(--color-border);
  }
`;

/* "Did you mean …?" under the email field: a likely typo in a common email domain. */
const Suggest = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);

  & > button {
    height: auto;
    padding: 0 var(--space-1);
    font-size: inherit;
    text-decoration: underline;
  }
`;

/**
 * Phones and tablets with a system share sheet: Share takes Copy link's place there. Desktop browsers get
 * Copy link even when they have a share sheet (Safari on Mac, Chrome on Windows), so it's checked against a
 * touch screen as the main pointer too. False on the server.
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
`;

/* "Send another referral", at the bottom left, set apart by a line. */
const Another = styled.div`
  display: flex;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
`;

/*
 * "Send another referral": a button that reads as a text link (underlined, no box, no icon), in link blue.
 * The kit has no link colour token yet; --color-info is the system's blue (lighter in dark mode).
 */
const TextLink = styled(Button)`
  height: auto;
  padding: 0;
  font-weight: var(--weight-medium);
  color: var(--color-info);
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover:not(:disabled) {
    background: transparent;
    text-decoration-thickness: 2px;
  }
`;

/* After a failed copy, the link can be selected and copied by hand. */
const SelectableLink = styled(Input)`
  user-select: all;
`;

/**
 * The form, in two steps. Step 1: the recipient's full name and email, then Next (waits for both, then
 * checks them). Step 2: who it's for (Change goes back), then Send invite (SDC emails them) or, under "or",
 * that friend's own invite link with Copy link (the member sends it themselves). Once something has gone
 * out, "Send another referral" at the bottom starts again. Submitting never leaves the page.
 *
 * Submitted by hand (not a form action), so an error never clears what was typed.
 */
function SharePanel({
  view,
  start,
  onSubmit,
  onEditing,
  onNew,
  step,
  onStep: setStep,
}: {
  view: View;
  start?: StartState;
  onSubmit: (values: ReferralValues) => Promise<ReferralResult>;
  onEditing: () => void;
  /** Unused since the choice between emailing and sending it yourself went (both show at once). */
  onChoiceChange?: () => void;
  onNew: () => void;
  step: Step;
  onStep: (step: Step) => void;
}) {
  const canShare = useCanShare();
  /** Mistakes found before anything is sent (Send invite or Copy link). */
  const [stepErrors, setStepErrors] = useState<{ name?: string; email?: string } | null>(null);
  const [name, setName] = useState(view.values?.name ?? "");
  const [email, setEmail] = useState(view.values?.email ?? "");
  const hasName = name.trim() !== "";
  const hasEmail = email.trim() !== "";
  /** Why Send invite / Copy link is unavailable, for its tooltip; null once both fields have something in them. */
  const missing = !hasName && !hasEmail ? copy.needBoth : !hasName ? copy.needName : !hasEmail ? copy.needEmail : null;
  const [pending, startTransition] = useTransition();
  /** Which action is running, for its progress label ("Sending…", "Getting link…"). */
  const [running, setRunning] = useState<"send" | "link" | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLFormElement>(null);

  /** True for a few seconds after copying: the button shows a check and "Copied". */
  const [copied, setCopied] = useState(start?.copied ?? false);
  /** Their link has been copied or shared: "Thanks for sharing SDC with …" shows under it. */
  const [linkShared, setLinkShared] = useState(start?.copied ?? false);
  /** The browser blocked the copy: the link becomes selectable and a note says to copy it by hand. */
  const [copyFailed, setCopyFailed] = useState(start?.copyFailed ?? false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  // Send email invite and Copy link share one width: measure each at its natural size (labels change:
  // "Sending…", "Copied"), then give both the wider one.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.removeProperty("--action-width");
    const buttons = [...panel.querySelectorAll<HTMLElement>("[data-same-width]")];
    if (buttons.length < 2) return;
    const widest = Math.max(...buttons.map((b) => b.getBoundingClientRect().width));
    panel.style.setProperty("--action-width", `${Math.ceil(widest)}px`);
  });

  const { result } = view;
  const fieldErrors = stepErrors ?? (result?.status === "invalid" ? result.fieldErrors : {});
  // No daily limit (Nov 23): the only form-wide error is a failed connection.
  const formError = result?.status === "failed" ? copy.failed : undefined;
  const link = result?.status === "message" ? result : undefined;
  // Always show a link: the recorded one once it exists, else the one their email will get.
  const shownLink = link ? link.link : (previewLinkFor(email) ?? undefined);
  /** Once something has gone out (sent, or a link made): offer a fresh form for the next person. */
  const done = result?.status === "emailed" || result?.status === "message";
  /** The friend's first name, for the thank-yous ("Priya", from "Priya Sharma"). */
  const friend = firstName(link?.friendName ?? (result?.status === "emailed" ? result.friendName : name));
  // A likely typo ("gmial.com"), offered before sending so the referral isn't tracked to a dead address.
  // Not while the address is still being finished ("priya@g" offers gmail.com instead).
  const suggestion = fieldErrors.email || completeEmail(email) ? null : suggestEmail(email);

  function clearFields() {
    if (nameRef.current) nameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
    setName("");
    setEmail("");
  }

  /** Checks the name and email, showing what to fix under each field; true when both are fine. */
  function checked() {
    const errors = checkRecipient(name, email);
    setStepErrors(errors);
    return !errors;
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Step 1 (Next, or Enter in either field): check the name and email, then show the ways to invite.
    if (step === "who") {
      if (checked()) {
        setStep("how");
        requestAnimationFrame(() => sendRef.current?.focus());
      }
      return;
    }
    // Step 2: Send invite. SDC emails them.
    setRunning("send");
    startTransition(async () => {
      // Sent: the banner says thank you; focus moves to Invite someone else.
      const r = await onSubmit({ name, email, delivery: "email" });
      if (r.status === "emailed") requestAnimationFrame(() => againRef.current?.focus());
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
        setLinkShared(true);
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
    if (!checked()) return;
    setRunning("link");
    startTransition(async () => {
      const r = await onSubmit({ name, email, delivery: "self" });
      if (r.status === "message") await handOver(r.link);
    });
  }

  async function copyLink(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(true);
      setLinkShared(true);
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
    setLinkShared(false);
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

  const linkField = (forFriend: NonNullable<typeof link> | undefined) => (
    <LinkBlock>
      <Field
        label={forFriend ? copy.friendLinkLabel(forFriend.friendName) : copy.linkLabel}
      >
        {(p) => (
          <LinkRow>
            {copyFailed && forFriend ? (
              <SelectableLink {...p} ref={linkRef} readOnly value={shownLink} onFocus={(e) => e.currentTarget.select()} />
            ) : (
              // Their link, shown as soon as their email is typed (the field says so until then).
              <StaticLink {...p} readOnly tabIndex={-1} value={shownLink ?? ""} placeholder={copy.linkPlaceholder} />
            )}
            {/* Waits for the name and email, so the referral is tracked against that address; until then a
                tooltip says what's missing. (Once their link exists it can always be copied again.) */}
            {/* Phones get Share (the system share sheet) in its place; computers get Copy link. */}
            {!forFriend && missing ? (
              <DisabledReason reason={missing}>
                <Button data-same-width="" type="button" $variant="outline">
                  {canShare ? copy.share : copy.copyLink}
                  <Icon icon={canShare ? Share2 : Copy} />
                </Button>
              </DisabledReason>
            ) : canShare ? (
              <Button
                data-same-width=""
                type="button"
                $variant="outline"
                disabled={!forFriend && pending}
                aria-busy={pending || undefined}
                onClick={shareTheirLink}
              >
                {pending && running === "link" ? copy.gettingLink : copy.share}
                {pending && running === "link" ? <Spinner /> : <Icon icon={Share2} />}
              </Button>
            ) : (
              <CopyButton
                data-same-width=""
                type="button"
                $variant="outline"
                disabled={!forFriend && pending}
                aria-busy={pending || undefined}
                onClick={copyTheirLink}
              >
                {pending && running === "link" ? copy.gettingLink : copied ? copy.copiedShort : copy.copyLink}
                {pending && running === "link" ? <Spinner /> : <Icon icon={copied ? Check : Copy} />}
              </CopyButton>
            )}
          </LinkRow>
        )}
      </Field>
    </LinkBlock>
  );

  // After Send invite: the form switches to a thank-you, with Invite someone else and their link to copy.
  if (result?.status === "emailed") {
    return (
      <Panel aria-label={copy.sendTitle} onSubmit={(e) => e.preventDefault()}>
        {/* The thank-you itself is in the banner; this announces it to screen readers. */}
        <LiveNote role="status">{copy.thanksTitle(friend)}</LiveNote>
        <ThanksBlock>
          {copyFailed && (
            <Note role="alert" data-tone="danger">
              <Icon icon={CircleAlert} size={16} />
              {copy.copyFailedLink}
            </Note>
          )}
          <ThanksActions>
            <Button ref={againRef} type="button" onClick={startNew}>
              <WithIcon>
                <Icon icon={Plus} />
                {copy.again}
              </WithIcon>
            </Button>
            {/* Their link too, to send another way (a text, a chat). */}
            {shownLink && (
              <Button type="button" $variant="outline" onClick={() => void copyLink(shownLink)}>
                <WithIcon>
                  <Icon icon={copied ? Check : Copy} />
                  {copied ? copy.copiedShort : copy.copyLink}
                </WithIcon>
              </Button>
            )}
          </ThanksActions>
          {/* The browser blocked the copy: show the link, selected, to copy by hand. */}
          {copyFailed && shownLink && linkField(undefined)}
        </ThanksBlock>
        <LiveNote role="status">{copied ? copy.linkCopied : ""}</LiveNote>
      </Panel>
    );
  }

  return (
    <Panel ref={panelRef} onSubmit={submit} noValidate aria-label={copy.sendTitle}>
      {/* Not shown: the photo panel already says what this is. Kept for screen readers. */}
      <HiddenTitle>{copy.formTitle}</HiddenTitle>
      {step === "who" ? (
        <>
        <Field label={<RequiredLabel>{copy.nameLabel}</RequiredLabel>} error={fieldErrors.name}>
          {(p) => (
            <Input
              {...p}
              ref={nameRef}
              name="name"
              required
              autoComplete="off"
              autoCapitalize="words"
              maxLength={80}
              defaultValue={name}
              onChange={(e) => {
                // Names start with a capital, whatever was typed or pasted; the cursor stays where it was.
                const input = e.target;
                const capitalized = capitalizeName(input.value);
                if (capitalized !== input.value) {
                  const { selectionStart, selectionEnd } = input;
                  input.value = capitalized;
                  input.setSelectionRange(selectionStart, selectionEnd);
                }
                setName(capitalized);
                edited();
              }}
            />
          )}
        </Field>
        <Field
          label={<RequiredLabel>{copy.emailLabel}</RequiredLabel>}
          error={fieldErrors.email}
          hint={
            suggestion && (
              <Suggest>
                {copy.didYouMean}
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
                </Button>
                ?
              </Suggest>
            )
          }
        >
          {(p) => (
            <EmailInput
              {...p}
              ref={emailRef}
              name="email"
              required
              autoComplete="off"
              maxLength={254}
              value={email}
              onValue={(value) => {
                setEmail(value);
                edited();
              }}
            />
          )}
        </Field>
          <SubmitRow>
            {/* Next waits for both fields (a tooltip says what's missing), then checks them. */}
            {missing ? (
              <DisabledReason reason={missing}>
                <Button type="submit">
                  <WithIcon>
                    {copy.next}
                    <Icon icon={ArrowRight} />
                  </WithIcon>
                </Button>
              </DisabledReason>
            ) : (
              <Button type="submit">
                <WithIcon>
                  {copy.next}
                  <Icon icon={ArrowRight} />
                </WithIcon>
              </Button>
            )}
          </SubmitRow>
        </>
      ) : (
        <>
          {/* Step 2: who it's for (Change goes back until something has gone out), then the two ways. */}
          {formError && (
            <Note role="alert" data-tone="danger">
              <Icon icon={CircleAlert} size={16} />
              {formError}
            </Note>
          )}
          {/* The email it goes to, as a field like their link below, with Send email invite beside it. */}
          <Field label={copy.emailInviteLabel}>
            {(p) => (
              <LinkRow>
                <StaticLink {...p} readOnly tabIndex={-1} value={email.trim()} />
                <Button ref={sendRef} data-same-width="" type="submit" disabled={pending} aria-busy={pending || undefined}>
                  <WithIcon>
                    {pending && running === "send" ? copy.sending : copy.submitEmail}
                    {pending && running === "send" ? <Spinner /> : <Icon icon={Send} />}
                  </WithIcon>
                </Button>
              </LinkRow>
            )}
          </Field>
          {/* Or send it yourself: their own link. Copy link records the referral first, so whoever joins
              through it is tracked. */}
          <OrDivider aria-hidden="true">{copy.or}</OrDivider>
          {link?.referredOn && (
            <Note>
              <Icon icon={Info} size={16} />
              {copy.alreadyInvited(link.friendName, link.referredOn)}
            </Note>
          )}
          {linkField(link)}
          {/* After copying or sharing: thanks, right where they acted. */}
          {linkShared && !copyFailed && (
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
      {/* Only once something has gone out: a blank form for the next person, who gets their own link. */}
      {done && (
        <Another>
          <TextLink type="button" $variant="ghost" onClick={startNew}>
            {copy.sendAnother}
          </TextLink>
        </Another>
      )}
    </Panel>
  );
}

/* ---- Edge-case gallery (/design/referrals/states) ---- */

const Gallery = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  width: 100%;
  max-width: calc(1280px + 2 * var(--space-6));
  margin: 0 auto;
  padding: var(--space-7) var(--space-6) var(--space-8);
  color: var(--color-text);

  @media (max-width: 599px) {
    padding: var(--space-5) var(--space-3) var(--space-7);
  }
`;

const GalleryHead = styled.header`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 68ch;

  & h1 {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: var(--weight-medium);
    line-height: var(--leading-heading);
  }
  & p {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--color-text-muted);
  }
`;

const GallerySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  & > h2 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
  gap: var(--space-6);
  align-items: start;
`;

const Case = styled.article`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;

  & > h3 {
    margin: 0;
    font-size: var(--text-md);
    font-weight: var(--weight-medium);
  }
  & > p {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--color-text-muted);
  }
`;

/* The form in a card, as on the page (without the photo, to keep the gallery compact). */
const CaseCard = styled.div`
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
`;

const CaseLink = styled.a`
  font-size: var(--text-sm);
  color: var(--color-link, var(--color-primary));
`;

interface GalleryCase {
  title: string;
  /** What it covers and why it looks this way. */
  about: string;
  start?: StartState;
  /** Not a form state: a link to the screen that shows it. */
  href?: string;
}

const sam = { name: "Sam", email: "sam@example.org" };
const samLink = "https://sdc.example.org/join?via=referral&ref=3f9c2a00";
const newLink = "https://sdc.example.org/join?via=referral&ref=8b41de00";

const CASES: { section: string; cases: GalleryCase[] }[] = [
  {
    section: "Sending by email",
    cases: [
      { title: "Step 1: who it's for", about: "Next waits for both fields (a tooltip says what's missing), then checks them." },
      {
        title: "Step 2: send invite or copy link",
        about: "Who it's for, with Change to go back. Send invite emails them; or copy their own link to send yourself.",
        start: { step: "how", view: { values: { name: "Priya", email: "priya@example.org", delivery: "email" } } },
      },
      {
        title: "Invitation sent",
        about:
          "The form switches to a thank-you: \"Thank you! We've emailed Priya an invite.\" Invite someone else starts a blank form; Copy link copies their link to send another way too.",
        start: {
          step: "how",
          view: {
            result: { status: "emailed", friendName: "Priya" },
            sentTo: "priya@example.org",
            values: { name: "Priya", email: "priya@example.org", delivery: "email" },
          },
        },
      },
      {
        title: "Already a member, unsubscribed, or invited by someone else",
        about:
          "Looks exactly like \"Invitation sent\" (the same thank-you), so the form can't be used to find out who's a member or who invited whom. SDC doesn't email them (and never emails someone who unsubscribed).",
        start: {
          step: "how", view: { result: { status: "emailed", friendName: "Lee" }, sentTo: "lee@example.org" } },
      },
      {
        title: "Already invited by this member",
        about:
          "SDC never emails the same person twice (sam+sdc@ and SAM@ count as sam@). No email; their own link to send instead.",
        start: {
          step: "how",
          view: {
            result: { status: "message", friendName: "Sam", link: samLink, referredOn: "Nov 3" },
            values: { ...sam, delivery: "email" },
          },
        },
      },
    ],
  },
  {
    section: "Checking what's typed",
    cases: [
      {
        title: "Missing name, bad email",
        about: "Checked on Next (and again on send). What was typed stays, with what to fix under each field.",
        start: {
          view: {
            result: { status: "invalid", fieldErrors: { name: copy.nameRequired, email: copy.emailInvalid } },
            values: { name: "", email: "priya@", delivery: "email" },
          },
        },
      },
      {
        title: "Their own email",
        about: "A member can't invite themselves.",
        start: {
          view: {
            result: { status: "invalid", fieldErrors: { email: copy.ownEmail } },
            values: { name: "Amara", email: "amara@example.org", delivery: "email" },
          },
        },
      },
      {
        title: "Name with a link or symbol",
        about: "The name goes into SDC's email, so links and symbols like @ or / are refused.",
        start: {
          view: {
            result: { status: "invalid", fieldErrors: { name: copy.nameInvalid } },
            values: { name: "sdc.example.org/win", email: "sam@example.org", delivery: "email" },
          },
        },
      },
      {
        title: "Likely typo in the email",
        about:
          "Before sending, so a referral isn't tracked to a dead address. One click fixes it; it's only a suggestion and never blocks sending.",
        start: { view: { values: { name: "Priya", email: "priya@gmial.com", delivery: "email" } } },
      },
    ],
  },
  {
    section: "Sending it yourself",
    cases: [
      {
        title: "Before copying",
        about:
          "Their link shows as soon as their email is typed. Copy link waits for the name and email, because the referral is tracked against that address.",
        start: {
          step: "how", delivery: "self", view: { values: { name: "Priya", email: "priya@example.org", delivery: "self" } } },
      },
      {
        title: "Copied",
        about:
          "Copy link records the referral, then copies that friend's own link. Copying again doesn't record it twice.",
        start: {
          step: "how",
          delivery: "self",
          copied: true,
          view: {
            result: { status: "message", friendName: "Priya", link: newLink },
            values: { name: "Priya", email: "priya@example.org", delivery: "self" },
          },
        },
      },
      {
        title: "Couldn't copy",
        about:
          "Some browsers block copying after a network wait. The referral is already recorded, so the link stays: selected, ready to copy by hand.",
        start: {
          step: "how",
          delivery: "self",
          copyFailed: true,
          view: {
            result: { status: "message", friendName: "Priya", link: newLink },
            values: { name: "Priya", email: "priya@example.org", delivery: "self" },
          },
        },
      },
      {
        title: "Already invited",
        about: "Same link as before, so joining through either invite credits the same referral.",
        start: {
          step: "how",
          delivery: "self",
          view: {
            result: { status: "message", friendName: "Sam", link: samLink, referredOn: "Nov 3" },
            values: { ...sam, delivery: "self" },
          },
        },
      },
    ],
  },
  {
    section: "Failures",
    cases: [
      {
        title: "Connection failed",
        about: "Nothing was sent or recorded. What was typed stays, so trying again is one click.",
        start: {
          step: "how", view: { result: { status: "failed" }, values: { name: "Priya", email: "priya@example.org", delivery: "email" } } },
      },
      {
        title: "Switching the choice after an error",
        about:
          "Changing \"How should we invite them?\" clears the old error or result (what's typed stays). Try it: switch the choice in the \"Connection failed\" card.",
      },
    ],
  },
  {
    section: "Elsewhere",
    cases: [
      {
        title: "Broken page link",
        about: "The page link from the email is incomplete or wrong.",
        href: "/design/referrals?link=unknown",
      },
      {
        title: "Joined with another email, or the link was passed on",
        about:
          "The member is credited either way (the link's code decides). On their admin profile, the referral says who actually joined.",
        href: "/design/members",
      },
    ],
  },
];

/** Every state of the referral form, live (each card works), for review. */
export function ReferStates() {
  return (
    <AppToastProvider>
      <Gallery>
        <GalleryHead>
          <h1>Referral form: every state</h1>
          <p>
            Each card is the live form, opened in one state; you can type and click in it. The page itself is at{" "}
            <CaseLink href="/design/referrals">/design/referrals</CaseLink>. Rules the backend still has to settle
            are in docs/backend/referrals.md, &ldquo;Edge cases&rdquo;.
          </p>
        </GalleryHead>
        {CASES.map(({ section, cases }) => (
          <GallerySection key={section} aria-labelledby={`s-${section}`}>
            <h2 id={`s-${section}`}>{section}</h2>
            <Grid>
              {cases.map((c) => (
                <Case key={c.title}>
                  <h3>{c.title}</h3>
                  <p>{c.about}</p>
                  {c.href ? (
                    <CaseLink href={c.href}>Open {c.href}</CaseLink>
                  ) : c.start || c.title.startsWith("Step 1") ? (
                    <CaseCard>
                      <Refer bare start={c.start} />
                    </CaseCard>
                  ) : null}
                </Case>
              ))}
            </Grid>
          </GallerySection>
        ))}
      </Gallery>
    </AppToastProvider>
  );
}
