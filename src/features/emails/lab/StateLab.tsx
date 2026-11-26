"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { LAB_FLAGS, type LabFlag } from "../model";
import { useEmails } from "../store";
import { LAB_CASES, type LabAxis } from "./cases";

const FLAG_COPY: Record<LabFlag, { label: string; hint: string }> = {
  slowLoad: { label: "Slow loading", hint: "Every page shows its loading state for a few seconds." },
  loadError: { label: "Data fails to load", hint: "Pages show their error state until you retry." },
  empty: { label: "No data", hint: "Sends, automatic emails and one-off emails are all empty." },
  longText: { label: "Very long text", hint: "Names and subjects get much longer." },
  slowSave: { label: "Slow saves", hint: "Saving, updating, publishing and sending take a few seconds." },
  saveError: { label: "Saves fail", hint: "Every save returns an error." },
  providerDown: { label: "Email provider is down", hint: "Due sends fail and show as Couldn’t send." },
  otherAdminEditing: { label: "Another admin has sends open", hint: "Priya has the next sends open for editing." },
  overMonthlyLimit: { label: "Members over the monthly limit", hint: "Several members would pass the limit." },
  offline: { label: "Offline", hint: "Actions fail because there’s no connection." },
};

const AXES: LabAxis[] = ["Data", "Load and save", "Timing", "Other actors", "Rule conflicts"];

const FloatingTrigger = styled.div`
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-nav);
`;
const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
`;
const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;
const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;
const Muted = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;
const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;
const Case = styled.li`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--color-border);
  list-style: none;
`;
const CaseList = styled.ul`
  margin: 0;
  padding: 0;
`;

const MORNING = 86_400_000;

/** Prototype-only panel: sets the switches that make the in-memory app misbehave, moves the clock and walks the state checklist. */
export function StateLab() {
  const api = useEmails();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = LAB_FLAGS.filter((f) => api.lab[f]);

  function go(index: number) {
    const c = LAB_CASES[index];
    api.resetData(c.scenario ?? "default");
    api.resetLab();
    for (const f of c.flags ?? []) api.setLab(f, true);
    if (c.advance) api.advanceClock(c.advance);
    setOpen(false);
    router.push(c.href);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <FloatingTrigger>
        <SheetTrigger asChild>
          <Button type="button" $variant="outline" $size="sm">
            <Icon icon={FlaskConical} size={16} />
            State lab{active.length > 0 ? ` (${active.length} on)` : ""}
          </Button>
        </SheetTrigger>
      </FloatingTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>State lab</SheetTitle>
          <SheetDescription>Prototype only. Makes the app misbehave on purpose so every state can be checked.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Section>
            <SectionTitle>Prototype</SectionTitle>
            <Buttons>
              <Button type="button" $variant="outline" $size="sm" onClick={() => { setOpen(false); router.push("/emails-pm-prototype/flags"); }}>
                Flags for product
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => { setOpen(false); router.push("/emails-pm-prototype/editor"); }}>
                Email editor sandbox
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => { setOpen(false); router.push("/emails-pm-prototype/outbox/reminder"); }}>
                Reminder email (design)
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => { setOpen(false); router.push("/emails-pm-prototype/notes"); }}>
                User guide
              </Button>
            </Buttons>
          </Section>

          <Section>
            <SectionTitle>Simulate</SectionTitle>
            {LAB_FLAGS.map((flag) => (
              <Row key={flag}>
                <div>
                  <label htmlFor={`lab-${flag}`}>{FLAG_COPY[flag].label}</label>
                  <Muted>{FLAG_COPY[flag].hint}</Muted>
                </div>
                <Switch id={`lab-${flag}`} checked={api.lab[flag]} onCheckedChange={(on) => api.setLab(flag, on)} />
              </Row>
            ))}
            <Buttons>
              <Button type="button" $variant="outline" $size="sm" onClick={api.resetLab}>
                Turn all off
              </Button>
            </Buttons>
          </Section>

          <Section>
            <SectionTitle>Clock</SectionTitle>
            <Muted>Now: {api.now.toLocaleString("en-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" })} (Toronto)</Muted>
            <Buttons>
              <Button type="button" $variant="outline" $size="sm" onClick={() => api.advanceClock(60_000)}>
                +1 minute
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => api.advanceClock(25 * 60_000)}>
                +25 minutes
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => api.advanceClock(60 * 60_000)}>
                +1 hour
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => api.advanceClock(MORNING)}>
                +1 day
              </Button>
            </Buttons>
          </Section>

          <Section>
            <SectionTitle>Data</SectionTitle>
            <Buttons>
              <Button type="button" $variant="outline" $size="sm" onClick={() => api.resetData("default")}>
                Reset to default
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => api.resetData("busy")}>
                Busy
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => api.resetData("empty")}>
                Empty
              </Button>
            </Buttons>
          </Section>

          {AXES.map((axis) => (
            <Section key={axis}>
              <SectionTitle>Checklist: {axis}</SectionTitle>
              <CaseList>
                {LAB_CASES.map((c, i) =>
                  c.axis === axis ? (
                    <Case key={c.title}>
                      <div>
                        <div>{c.title}</div>
                        <Muted>{c.what}</Muted>
                      </div>
                      <Button type="button" $variant="outline" $size="sm" onClick={() => go(i)}>
                        Go
                      </Button>
                    </Case>
                  ) : null,
                )}
              </CaseList>
            </Section>
          ))}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
