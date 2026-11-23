"use client";

/*
 * The notifications lab: a dev-only switchboard on the design screens, following the earlier State lab
 * (a floating pill that names what's on, and a sheet of choices). It swaps the data and timing behind the
 * bell; the panel itself is the real one, unchanged. Choices live in the URL (`?notifications=long-text&lab=slow`)
 * so a combination can be shared as a link.
 */
import * as React from "react";
import { styled } from "next-yak";
import { FlaskConical, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import type { NotificationsSource } from "@/features/notifications/types";
import { demoNotifications } from "./demo";
import { LAB_DATA, LAB_FAULTS, LAB_NOTES, labSource, withFaults, type LabDataId, type LabFaultId } from "./lab";

const DATA_PARAM = "notifications";
const FAULT_PARAM = "lab";

/* The URL is the store: read it on the client, rewrite it in place (no navigation, no Suspense). */
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}
const readSearch = () => window.location.search;
const serverSearch = () => "";

function writeSearch(update: (params: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  update(params);
  const query = params.toString().replace(/%2C/gi, ",");
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  listeners.forEach((l) => l());
}

const isData = (v: string | null): v is LabDataId => LAB_DATA.some((d) => d.id === v);
const isFault = (v: string): v is LabFaultId => LAB_FAULTS.some((f) => f.id === v);

/** The source for the bell, and the lab's own controls to render once on the page. */
export function useNotificationsLab(): { source: NotificationsSource; lab: React.ReactNode } {
  const search = React.useSyncExternalStore(subscribe, readSearch, serverSearch);
  const params = new URLSearchParams(search);
  const fromUrl = params.get(DATA_PARAM);
  // No choice made: the usual demo, so ordinary design screens behave as before.
  const data: LabDataId | null = isData(fromUrl) ? fromUrl : null;
  const faultKey = (params.get(FAULT_PARAM) ?? "").split(",").filter(isFault).sort().join(",");

  // A new data choice starts fresh (nothing done, nothing seen); switching faults keeps the data as it is.
  const base = React.useMemo(() => (data ? labSource(data) : demoNotifications), [data]);
  const source = React.useMemo(
    () => withFaults(base, new Set(faultKey.split(",").filter(isFault))),
    [base, faultKey],
  );

  const faults = new Set(faultKey.split(",").filter(isFault));
  const lab = (
    <Lab
      data={data ?? "mixed"}
      faults={faults}
      onData={(id) => writeSearch((p) => (id === "mixed" ? p.delete(DATA_PARAM) : p.set(DATA_PARAM, id)))}
      onFault={(id, on) =>
        writeSearch((p) => {
          const next = new Set(faults);
          if (on) next.add(id);
          else next.delete(id);
          if (next.size) p.set(FAULT_PARAM, [...next].join(","));
          else p.delete(FAULT_PARAM);
        })
      }
    />
  );
  return { source, lab };
}

/*
 * Bottom right, clear of the sidebar, the toasts (bottom centre) and Next's dev badge (the corner itself).
 * Warning colours while anything is on.
 */
const Floating = styled.div`
  position: fixed;
  right: var(--space-8);
  bottom: var(--space-4);
  z-index: var(--z-nav);
  display: flex;
  max-width: min(360px, calc(100vw - var(--space-6)));
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-sm);

  &[data-on] {
    border-color: var(--color-warning);
    background: var(--color-warning-subtle);
  }
`;

const PillText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-bottom: var(--space-5);
`;

const GroupTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--color-border);
`;

const SwitchLabel = styled(Label)`
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
`;

const Note = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

function Lab({
  data,
  faults,
  onData,
  onFault,
}: {
  data: LabDataId;
  faults: ReadonlySet<LabFaultId>;
  onData: (id: LabDataId) => void;
  onFault: (id: LabFaultId, on: boolean) => void;
}) {
  const ids = React.useId();
  const on = [
    ...(data === "mixed" ? [] : [LAB_DATA.find((d) => d.id === data)!.label]),
    ...LAB_FAULTS.filter((f) => faults.has(f.id)).map((f) => f.label),
  ];
  const dataNote = LAB_NOTES[data];

  return (
    <Sheet>
      <Floating data-on={on.length ? "" : undefined}>
        <SheetTrigger asChild>
          <Button type="button" $variant="ghost" $size="sm" aria-label={on.length ? `Notifications lab: ${on.join(", ")}` : "Notifications lab"}>
            <Icon icon={FlaskConical} size={16} />
            <PillText>{on.length ? `${on[0]}${on.length > 1 ? ` +${on.length - 1}` : ""}` : "Notifications lab"}</PillText>
          </Button>
        </SheetTrigger>
      </Floating>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications lab</SheetTitle>
          <SheetDescription>Changes what the bell loads on these design screens. Close this, then open the bell.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Group aria-labelledby={`${ids}-data`}>
            <GroupTitle id={`${ids}-data`}>In the list</GroupTitle>
            <RadioGroup aria-labelledby={`${ids}-data`} value={data} onValueChange={(v) => onData(v as LabDataId)}>
              {LAB_DATA.map((d) => (
                <RadioGroupOption key={d.id} value={d.id} label={d.label} />
              ))}
            </RadioGroup>
            {dataNote && <Note>{dataNote}</Note>}
          </Group>

          <Group aria-labelledby={`${ids}-faults`}>
            <GroupTitle id={`${ids}-faults`}>Network</GroupTitle>
            {LAB_FAULTS.map((f) => (
              <div key={f.id}>
                <SwitchRow>
                  <SwitchLabel htmlFor={`${ids}-${f.id}`}>{f.label}</SwitchLabel>
                  <Switch id={`${ids}-${f.id}`} checked={faults.has(f.id)} onCheckedChange={(v) => onFault(f.id, v)} />
                </SwitchRow>
                {faults.has(f.id) && LAB_NOTES[f.id] && <Note>{LAB_NOTES[f.id]}</Note>}
              </div>
            ))}
          </Group>

          <Group aria-labelledby={`${ids}-phone`}>
            <GroupTitle id={`${ids}-phone`}>Phone</GroupTitle>
            <Note>Opens this page with the same choices in a 375px window, where the panel covers the screen.</Note>
            <div>
              <Button
                type="button"
                $variant="outline"
                $size="sm"
                onClick={() => window.open(window.location.href, "notifications-phone", "popup,width=375,height=812")}
              >
                <Icon icon={Smartphone} size={16} />
                Open at phone width
              </Button>
            </div>
          </Group>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
