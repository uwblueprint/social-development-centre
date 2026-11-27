"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { unsubscribeCopy as copy } from "./copy";
import { demoMember, emailReasons, formatDate, formatMoney, tierById, type EmailReason } from "./data";
import { Note, Options, Template, useFocusHeadingOn } from "./parts";

/*
 * The email flow: footer link 1 in every SDC email. "Unsubscribe from SDC emails" asks what's going
 * on (one answer, optional), then, after "Unsubscribe from all", the unsubscribed page (members hear their membership is still active, with the
 * way into the cancel flow), and after "Sounds good" a closing screen. Follows the "Unsub flow"
 * FigJam board; the look is Jesse's unsubscribe page, built from AuthScreen. Client state only:
 * saving just shows its result.
 */

export type EmailScreen = "preferences" | "unsubscribed" | "closed";

export interface EmailFlowStart {
  screen: EmailScreen;
  tierId: string;
}

export function UnsubscribeFlow({ start }: { start: EmailFlowStart }) {
  return (
    <AppToastProvider>
      <Flow start={start} />
    </AppToastProvider>
  );
}

function Flow({ start }: { start: EmailFlowStart }) {
  const router = useRouter();
  const { toast } = useToast();
  const tier = tierById(start.tierId);
  // From the member's record, never the URL.
  const isMember = demoMember.isMember;

  const [screen, setScreen] = useState<EmailScreen>(start.screen);
  // Stored with the unsubscribe; kept if they resubscribe and come back.
  const [reason, setReason] = useState<EmailReason | null>(null);

  useFocusHeadingOn(screen);

  /** The back arrow, top left on every screen but the first: one screen back. */
  const back =
    screen === "preferences" ? undefined : () => setScreen(screen === "closed" ? "unsubscribed" : "preferences");

  function resubscribe() {
    setScreen("preferences");
    toast({ title: copy.resubscribed });
  }

  // "Sounds good": nothing left to do.
  if (screen === "closed") return <Template onBack={back} backLabel={copy.back} screenKey="closed" order={2} heading={copy.unsubscribed} line={copy.emails.closeTab} />;

  if (screen === "unsubscribed") {
    return (
      <Template
        onBack={back}
        backLabel={copy.back}
        screenKey="unsubscribed" order={1}
        heading={copy.unsubscribed}
        // FigJam: after unsubscribing, members hear their membership is still active.
        line={isMember && copy.emails.membership(tier.name, formatDate(demoMember.nextPaymentDate), formatMoney(tier.monthlyPrice))}
        actions={
          isMember && (
            <>
              <Button type="button" $size="lg" onClick={() => setScreen("closed")}>
                {copy.emails.soundsGood}
              </Button>
              {/* They chose to cancel, so the cancel flow opens at "Before you go". */}
              <Button type="button" $variant="danger-outline" $size="lg" onClick={() => router.push("/design/cancel-membership?step=reasons")}>
                {copy.cancelMembership}
              </Button>
            </>
          )
        }
        undo={
          <>
            <Note>{copy.undoUnsubscribe}</Note>
            <Button type="button" $variant="ghost" onClick={resubscribe}>
              {copy.resubscribe}
            </Button>
          </>
        }
      />
    );
  }

  return (
    <Template
      screenKey="preferences" order={0}
      heading={copy.emails.heading}
      actions={
        <Button type="button" $variant="danger-outline" $size="lg" onClick={() => setScreen("unsubscribed")}>
          {copy.emails.unsubscribeAll}
        </Button>
      }
    >
      <Options
        id="unsubscribe-reason"
        question={copy.emails.question}
        options={emailReasons.map((r) => ({ value: r, label: copy.emails.reasons[r] }))}
        value={reason}
        onChange={setReason}
      />
    </Template>
  );
}
