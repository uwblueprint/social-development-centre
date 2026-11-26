"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { unsubscribeCopy as copy } from "./copy";
import { demoMember, emailTypesFor, formatDate, formatMoney, tierById, type EmailType } from "./data";
import { ChoiceText, Note, OptionList, Template, useFocusHeadingOn } from "./parts";

/*
 * The email flow: footer link 1 in every SDC email. The preferences page, then, after "Unsubscribe
 * from all emails", the unsubscribed page (members hear their membership is still active, with the
 * way into the cancel flow), and after "Sounds good" a closing screen. Follows the "Unsub flow"
 * FigJam board; the look is Jesse's unsubscribe page, built from AuthScreen. Client state only:
 * saving just shows its result.
 */

export type EmailScreen = "preferences" | "unsubscribed" | "closed";

export interface EmailFlowStart {
  screen: EmailScreen;
  tierId: string;
}

/** A row in the bordered list: an email type, or unsubscribing from all of them. */
type Choice = EmailType | "none";

/** A checkbox row, padded like the kit's radio rows so the list matches the cancel flow's questions. */
const CheckRow = styled.div`
  display: flex;
  padding: var(--space-2) var(--space-3);
`;

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
  const types = emailTypesFor(isMember);

  const [screen, setScreen] = useState<EmailScreen>(start.screen);
  const [ticked, setTicked] = useState<Choice[]>([...types]);

  useFocusHeadingOn(screen);

  function tick(choice: Choice, on: boolean) {
    setTicked((ts) => {
      // "Unsubscribe from all" and the email types exclude each other.
      if (choice === "none") return on ? ["none"] : [];
      const rest = ts.filter((t) => t !== "none" && t !== choice);
      return on ? types.filter((t) => t === choice || rest.includes(t)) : rest;
    });
  }

  function save() {
    // Nothing ticked means no emails, the same as unsubscribing from all.
    if (ticked.length === 0 || ticked.includes("none")) return setScreen("unsubscribed");
    toast({ title: copy.emails.saved });
  }

  function resubscribe() {
    setTicked([...types]);
    setScreen("preferences");
    toast({ title: copy.resubscribed });
  }

  // "Sounds good": nothing left to do.
  if (screen === "closed") return <Template screenKey="closed" order={2} heading={copy.unsubscribed} line={copy.emails.closeTab} />;

  if (screen === "unsubscribed") {
    return (
      <Template
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

  const choices: { value: Choice; label: string }[] = [
    ...types.map((t) => ({ value: t, label: copy.emails.types[t] })),
    { value: "none", label: copy.emails.unsubscribeAll },
  ];

  return (
    <Template
      screenKey="preferences" order={0}
      heading={copy.emails.heading}
      line={<span id="preferences-line">{copy.emails.line}</span>}
      actions={
        <Button type="button" $size="lg" onClick={save}>
          {copy.emails.save}
        </Button>
      }
    >
      <OptionList role="group" aria-labelledby="preferences-line" style={{ width: "100%" }}>
        {choices.map((c) => (
          <CheckRow key={c.value}>
            <Checkbox
              name="emails"
              value={c.value}
              label={<ChoiceText>{c.label}</ChoiceText>}
              checked={ticked.includes(c.value)}
              onCheckedChange={(on) => tick(c.value, on === true)}
            />
          </CheckRow>
        ))}
      </OptionList>
    </Template>
  );
}
