"use client";

/*
 * State lab: a dev-only panel on every design screen. It lists edge cases (offline, loading, empty, ...)
 * as switches and exposes them as flags through `useStateLab`. It never changes the page itself: the
 * screen reads the flags and decides what each state looks like. Active states live in the URL
 * (`?lab=offline,empty`), so a combination can be shared as a link. Mounted by `src/app/design/layout.tsx`.
 */
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, X } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { Context, GENERAL, type LabState, type PageStates } from "./context";

const PARAM = "lab";
/** Names shown on the button before "+N". */
const SHOWN = 2;

/* A pill that names the states that are on, so one is never forgotten. Warning tokens only while any is on. */
const Floating = styled.div<{ $on: boolean }>`
  position: fixed;
  left: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  max-width: min(480px, calc(100vw - var(--space-6)));
  border: 1px solid ${({ $on }) => ($on ? "var(--color-warning)" : "var(--color-border-strong)")};
  border-radius: var(--radius-full);
  background: ${({ $on }) => ($on ? "var(--color-warning-subtle)" : "var(--color-surface-raised)")};
  box-shadow: var(--shadow-sm);
`;

const Names = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  padding-bottom: var(--space-5);
`;

const GroupTitle = styled.h3`
  margin: 0 0 var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--color-border);
`;

const RowLabel = styled(Label)`
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
  overflow-wrap: anywhere;
`;

function parse(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function Lab({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pages, setPages] = React.useState<Map<symbol, PageStates>>(new Map());

  const fromUrl = searchParams.get(PARAM);
  const active = React.useMemo(() => new Set(parse(fromUrl)), [fromUrl]);
  // The latest choice, so two quick toggles before the URL catches up both count.
  const latest = React.useRef(active);
  React.useEffect(() => {
    latest.current = active;
  }, [active]);

  const register = React.useCallback((key: symbol, states: PageStates) => {
    setPages((prev) => new Map(prev).set(key, states));
    return () =>
      setPages((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
  }, []);

  const write = React.useCallback(
    (ids: string[]) => {
      latest.current = new Set(ids);
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length > 0) params.set(PARAM, ids.join(","));
      else params.delete(PARAM);
      const query = params.toString().replace(/%2C/gi, ",");
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const set = (id: string, on: boolean) => {
    const next = new Set(latest.current);
    if (on) next.add(id);
    else next.delete(id);
    write([...next]);
  };

  const value = React.useMemo(() => ({ active, register }), [active, register]);

  const registered = [...pages.values()];
  const groups: { title: string; states: readonly LabState[] }[] = [
    { title: "Connection", states: GENERAL.connection },
    { title: "Data", states: [...GENERAL.data, ...registered.flatMap((p) => p.data)] },
    { title: "Actions", states: registered.flatMap((p) => p.actions) },
    { title: "Access", states: GENERAL.access },
  ].filter((g) => g.states.length > 0);

  const names = groups.flatMap((g) => g.states).filter((st) => active.has(st.id)).map((st) => st.label);
  const shown = names.slice(0, SHOWN).join(", ");
  const more = names.length > SHOWN ? ` +${names.length - SHOWN}` : "";

  return (
    <Context.Provider value={value}>
      {children}
      <Sheet>
        <Floating $on={names.length > 0}>
          <SheetTrigger asChild>
            <Button type="button" $variant="ghost" $size="sm" style={{ minWidth: 0 }}>
              <Icon icon={FlaskConical} size={16} />
              <Names>{names.length > 0 ? `State lab: ${shown}${more}` : "State lab"}</Names>
            </Button>
          </SheetTrigger>
          {names.length > 0 && (
            <Button type="button" $variant="ghost" $size="sm" aria-label="Turn off all states" onClick={() => write([])}>
              <Icon icon={X} size={14} />
            </Button>
          )}
        </Floating>
        <SheetContent>
          <SheetHeader
            actions={
              <Button type="button" $variant="outline" $size="sm" onClick={() => write([])}>
                Reset
              </Button>
            }
          >
            <SheetTitle>State lab</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {groups.map((group) => (
              <Group key={group.title} aria-label={group.title}>
                <GroupTitle>{group.title}</GroupTitle>
                {group.states.map((state) => {
                  const id = `state-lab-${state.id}`;
                  return (
                    <Row key={state.id}>
                      <RowLabel htmlFor={id}>{state.label}</RowLabel>
                      <Switch id={id} checked={active.has(state.id)} onCheckedChange={(on) => set(state.id, on)} />
                    </Row>
                  );
                })}
              </Group>
            ))}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </Context.Provider>
  );
}

/** `useSearchParams` needs a Suspense boundary; this is dev only, so there is no static shell to protect. */
export function StateLabProvider({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={null}>
      <Lab>{children}</Lab>
    </React.Suspense>
  );
}
