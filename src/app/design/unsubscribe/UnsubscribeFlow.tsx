"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Collapsible } from "@/components/ui/Collapsible";
import { LinkButton } from "@/features/auth/AuthScreen";
import { unsubscribeCopy as copy } from "./copy";
import { demoMember, emailReasons, emailTypes, formatDate, formatMoney, tierById, type EmailReason, type EmailType } from "./data";
import {
  Body,
  ChoiceText,
  Choices,
  FollowUp,
  Note,
  Options,
  StatusLine,
  Template,
  done,
  useFocusHeadingOn,
} from "./parts";

/*
 * The email flow: footer link 1 in every SDC email. The email page, then, after "Sounds good", a
 * closing screen. Cancelling a membership is its own flow at /design/cancel-membership. Follows the
 * "Unsub flow" FigJam board; the look is Jesse's unsubscribe page, built from AuthScreen. Client
 * state only: saving and unsubscribing just show their result.
 */

export type EmailScreen = "email" | "closed";

export interface EmailFlowStart {
  screen: EmailScreen;
  reason: EmailReason | null;
  /** saved | unsubscribed | resubscribed */
  state: string | null;
  /** A paying member. False shows the page for someone who only subscribes. */
  isMember: boolean;
  tierId: string;
}

export function UnsubscribeFlow({ start }: { start: EmailFlowStart }) {
  const router = useRouter();
  const tier = tierById(start.tierId);
  const st = start.state;

  const [screen, setScreen] = useState<EmailScreen>(start.screen);
  const [subscribed, setSubscribed] = useState(st !== "unsubscribed" && start.screen !== "closed");
  const [reason, setReason] = useState<EmailReason | null>(start.reason ?? (st === "saved" ? "too-many" : null));
  const [ticked, setTicked] = useState<EmailType[]>(st === "saved" ? ["monthly"] : [...emailTypes]);
  const [saved, setSaved] = useState(st === "saved");
  const [resubscribed, setResubscribed] = useState(st === "resubscribed");

  useFocusHeadingOn(screen);

  // Unsubscribing turns the email page into "You're unsubscribed": move focus to that heading.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!subscribed) document.querySelector<HTMLElement>("main h1")?.focus();
  }, [subscribed]);

  function unsubscribe() {
    setSubscribed(false);
    setResubscribed(false);
    setSaved(false);
  }
  function resubscribe() {
    setSubscribed(true);
    setTicked([...emailTypes]);
    setResubscribed(true);
  }
  function tick(type: EmailType, on: boolean) {
    setTicked((ts) => (on ? emailTypes.filter((t) => t === type || ts.includes(t)) : ts.filter((t) => t !== type)));
    // "Saved" describes what was saved; once the ticks change, Save is live again.
    setSaved(false);
  }
  function save() {
    // Saving with nothing ticked is unsubscribing.
    if (ticked.length === 0) return unsubscribe();
    setSubscribed(true);
    setResubscribed(false);
    setSaved(true);
  }

  // "Sounds good": nothing left to do.
  if (screen === "closed") return <Template screenKey="closed" heading={copy.unsubscribed} line={copy.emails.closeTab} />;

  return (
    <Template
      screenKey="email"
      // Unsubscribing turns this page into "You're unsubscribed": the question slides closed, and
      // resubscribing slides it open again.
      heading={subscribed ? copy.emails.heading : copy.unsubscribed}
      // FigJam: after unsubscribing, members hear their membership is still active.
      line={
        !subscribed &&
        start.isMember &&
        copy.emails.membership(tier.name, formatDate(demoMember.nextPaymentDate), formatMoney(tier.monthlyPrice))
      }
      actions={
        subscribed ? (
          <>
            <Button type="button" $variant="danger-outline" $size="lg" onClick={unsubscribe}>
              {copy.unsubscribe}
            </Button>
            {/* After resubscribing, the confirmation replaces the note about what unsubscribing does. */}
            {resubscribed ? <StatusLine>{copy.resubscribed}</StatusLine> : <Note>{copy.emails.unsubscribeNote(start.isMember)}</Note>}
          </>
        ) : start.isMember ? (
          <>
            <Button type="button" $size="lg" onClick={() => setScreen("closed")}>
              {copy.emails.soundsGood}
            </Button>
            {/* They chose to cancel, so the cancel flow opens at "Before you go". */}
            <Button type="button" $variant="danger-outline" $size="lg" onClick={() => router.push("/design/cancel-membership?step=reasons")}>
              {copy.cancelMembership}
            </Button>
          </>
        ) : undefined
      }
      // The undo comes last, under everything else.
      undo={
        !subscribed && (
          <>
            <Note>{copy.undoUnsubscribe}</Note>
            <Button type="button" $variant="ghost" onClick={resubscribe}>
              {copy.resubscribe}
            </Button>
          </>
        )
      }
    >
      <Collapsible open={subscribed} style={{ width: "100%" }}>
        <FollowUp>
          <Options
            id="emails-question"
            question={copy.emails.question}
            value={reason}
            onChange={setReason}
            options={emailReasons.map((r) => ({
              value: r,
              label: copy.emails.reasons[r],
              followUp:
                r === "too-many" ? (
                  <>
                    <Body>{copy.emails.typesQuestion}</Body>
                    <Choices role="group" aria-label={copy.emails.typesQuestion}>
                      {emailTypes.map((t) => (
                        <Checkbox
                          key={t}
                          name="emails"
                          value={t}
                          label={<ChoiceText>{copy.emails.types[t]}</ChoiceText>}
                          checked={ticked.includes(t)}
                          onCheckedChange={(on) => tick(t, on === true)}
                        />
                      ))}
                    </Choices>
                    {saved ? (
                      done(copy.emails.saved)
                    ) : (
                      <Button type="button" $size="lg" onClick={save}>
                        {copy.emails.save}
                      </Button>
                    )}
                  </>
                ) : r === "not-relevant" ? (
                  <>
                    <Body>{copy.emails.interestsBody}</Body>
                    <LinkButton href="/intake-form" $variant="outline">
                      {copy.emails.interestsLink}
                    </LinkButton>
                  </>
                ) : undefined,
            }))}
          />
        </FollowUp>
      </Collapsible>
    </Template>
  );
}
