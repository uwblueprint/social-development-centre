"use client";

/*
 * STATE LAB (disposable). "State lab" in the sidebar footer opens a panel to simulate slow,
 * failing, empty and long-text states, with a checklist of every designed edge case. Dev only;
 * mounted from src/app/layout.tsx. Delete this folder and the "STATE LAB" lines to remove it.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, FlaskConical, MoveRight, X } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { getLabFlags, setLabFlags } from "./actions";
import { CASES, FLAG_INFO, type LabCase } from "./cases";
import { LAB_FLAGS, type LabFlag } from "./state";

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
  color: var(--color-text-muted);
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--color-border);
`;

const RowText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const RowTitle = styled.label`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const CaseTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const Muted = styled.span`
  font-size: var(--text-xs);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Chips = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const RowActions = styled.div`
  display: flex;
  flex: none;
  gap: var(--space-1);
`;

/* Always visible while anything is simulated, so it's never forgotten. */
const Badge = styled.div`
  position: fixed;
  z-index: var(--z-toast);
  left: var(--space-3);
  bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: min(480px, calc(100vw - var(--space-6)));
  padding: var(--space-1) var(--space-1) var(--space-1) var(--space-3);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-full);
  background: var(--color-warning-subtle);
  color: var(--color-text);
  font-size: var(--text-xs);
  box-shadow: var(--shadow-sm);
`;

const BadgeText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function downloadTestImage({ width, height }: { width: number; height: number }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, "#c2410c");
  g.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.font = `${Math.round(Math.min(width, height) / 6)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${width}×${height}`, width / 2, height / 2);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `test-${width}x${height}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}

export function StateLab() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [flags, setFlags] = React.useState<LabFlag[]>([]);

  React.useEffect(() => {
    void getLabFlags().then(setFlags);
    // Opened from the sidebar footer's "State lab" item (src/components/patterns/Sidebar.tsx).
    const onOpen = () => setOpen(true);
    window.addEventListener("state-lab:open", onOpen);
    return () => window.removeEventListener("state-lab:open", onOpen);
  }, []);

  // Offline is simulated in the browser: navigator.onLine reports false and the offline event fires, so the
  // app's real offline handling (OfflineWatcher, error pages) runs. Turning it off restores the real value.
  const offline = flags.includes("offline");
  React.useEffect(() => {
    if (!offline) return;
    Object.defineProperty(navigator, "onLine", { get: () => false, configurable: true });
    window.dispatchEvent(new Event("offline"));
    return () => {
      delete (navigator as unknown as Record<string, unknown>).onLine;
      window.dispatchEvent(new Event("online"));
    };
  }, [offline]);

  async function apply(next: LabFlag[]) {
    setFlags(await setLabFlags(next));
    router.refresh();
  }

  async function go(c: LabCase) {
    await setLabFlags(c.flags ?? []);
    // A full load, so loading screens and fresh data show exactly as a visitor would see them.
    if (c.href) window.location.assign(c.href);
    else setFlags(c.flags ?? []);
  }

  return (
    <>
      {flags.length > 0 && !open && (
        <Badge role="status">
          <Icon icon={FlaskConical} size={14} />
          <BadgeText>Simulating: {flags.map((f) => FLAG_INFO[f].label).join(", ")}</BadgeText>
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setOpen(true)}>
            Open
          </Button>
          <Button type="button" $variant="ghost" $size="sm" aria-label="Turn off all simulations" onClick={() => void apply([])}>
            <Icon icon={X} size={14} />
          </Button>
        </Badge>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="wide">
          <SheetHeader
            actions={
              flags.length > 0 ? (
                <Button type="button" $variant="outline" $size="sm" onClick={() => void apply([])}>
                  Turn all off
                </Button>
              ) : null
            }
          >
            <SheetTitle>State lab</SheetTitle>
            <SheetDescription>
              Dev only, and disposable. Switches stay on until you turn them off or restart the dev server.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Group aria-labelledby="lab-simulate">
              <GroupTitle id="lab-simulate">Simulate</GroupTitle>
              {LAB_FLAGS.map((f) => (
                <Row key={f}>
                  <RowText>
                    <RowTitle htmlFor={`lab-${f}`}>{FLAG_INFO[f].label}</RowTitle>
                    <Muted>{FLAG_INFO[f].detail}</Muted>
                  </RowText>
                  <Switch
                    id={`lab-${f}`}
                    checked={flags.includes(f)}
                    onCheckedChange={(on) => void apply(on ? [...flags, f] : flags.filter((x) => x !== f))}
                  />
                </Row>
              ))}
            </Group>
            {CASES.map((group) => (
              <Group key={group.area} aria-label={group.area}>
                <GroupTitle>{group.area}</GroupTitle>
                {group.cases.map((c) => (
                  <Row key={c.title}>
                    <RowText>
                      <CaseTitle>{c.title}</CaseTitle>
                      {c.flags && c.flags.length > 0 && <Chips>Turns on: {c.flags.map((f) => FLAG_INFO[f].label).join(", ")}</Chips>}
                      {c.how && <Muted>{c.how}</Muted>}
                    </RowText>
                    <RowActions>
                      {c.image && (
                        <Button type="button" $variant="outline" $size="sm" onClick={() => downloadTestImage(c.image!)}>
                          <Icon icon={Download} size={14} />
                          Image
                        </Button>
                      )}
                      {c.href && (
                        <Button type="button" $variant="secondary" $size="sm" onClick={() => void go(c)} aria-label={`Go to: ${c.title}`}>
                          Go
                          <Icon icon={MoveRight} size={14} />
                        </Button>
                      )}
                    </RowActions>
                  </Row>
                ))}
              </Group>
            ))}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
