"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { forgetOpen, recordOpen } from "@/app/member/_data/actions";
import { useToast } from "@/components/ui/Toast";
import type { Opportunity, TopicId } from "@/features/opportunities/types";
import type { ActionState } from "@/lib/forms";
import { feedCopy } from "../copy";
import { addYours, getYoursEntry, removeYours, restoreYours, setInterests, useInterests, useStoreReady, useYoursEntries } from "../store";
import type { MemberProfile, YoursEntry } from "../types";
import { InterestsSheet } from "./InterestsSheet";
import { OpportunitySheet } from "./OpportunitySheet";

interface MemberContextValue {
  member: MemberProfile;
  /** The server's render time (ISO), so "closes in 3 days" reads the same on the server and in the browser. */
  now: string;
  interests: TopicId[];
  entries: YoursEntry[];
  /** False until the browser's saved data is read; Your opportunities shows a loading state until then. */
  ready: boolean;
  has: (id: string) => boolean;
  /** Called when someone clicks a call to action: keeps it in Your opportunities, with a toast and Undo. */
  opened: (o: Opportunity) => void;
  remove: (id: string, title: string) => void;
  showDetails: (o: Opportunity) => void;
  editInterests: () => void;
  saveInterests: (topics: TopicId[]) => void;
}

const MemberContext = React.createContext<MemberContextValue | null>(null);

export function useMember() {
  const ctx = React.useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used within a MemberProvider");
  return ctx;
}

export function MemberProvider({ member, now, children }: { member: MemberProfile; now: string; children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const entries = useYoursEntries();
  const interests = useInterests(member.interests);
  const ready = useStoreReady();
  // The opportunity stays set after the sheet closes, so its content doesn't vanish mid slide-out.
  const [details, setDetails] = React.useState<Opportunity>();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [interestsOpen, setInterestsOpen] = React.useState(false);

  const ids = React.useMemo(() => new Set(entries.map((e) => e.id)), [entries]);

  /** Runs a server call; a failure undoes the local change and says so, with the way forward. */
  const sync = React.useCallback(
    async (call: () => Promise<ActionState>, rollback: () => void, retry: () => void) => {
      const result = await call().catch((): ActionState => ({ status: "error", message: feedCopy.toast.saveFailed }));
      if (result.status !== "error") return;
      rollback();
      if (result.fieldErrors?.session === "signed-out") {
        toast({ title: feedCopy.toast.signedOut, actionLabel: feedCopy.toast.signIn, onAction: () => router.push("/login") });
      } else {
        toast({ title: result.message ?? feedCopy.toast.saveFailed, actionLabel: feedCopy.toast.tryAgain, onAction: retry });
      }
    },
    [toast, router],
  );

  /** Tells the server; Try again in the failure toast retries, and a failure takes the local copy back out. */
  const record = React.useCallback(
    (o: Opportunity) => {
      const attempt = () =>
        void sync(
          () => recordOpen(o.id),
          () => removeYours(o.id),
          () => {
            addYours(o.id);
            attempt();
          },
        );
      attempt();
    },
    [sync],
  );

  const add = React.useCallback(
    (o: Opportunity) => {
      addYours(o.id);
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      toast({
        title: feedCopy.toast.added,
        description: offline ? feedCopy.toast.addedOffline : undefined,
        actionLabel: feedCopy.toast.undo,
        onAction: () => {
          const entry = getYoursEntry(o.id);
          removeYours(o.id);
          void sync(() => forgetOpen(o.id), () => entry && restoreYours(entry), () => removeYours(o.id));
        },
      });
      // Offline there is no server to tell; the local copy stands until the connection is back.
      if (!offline) record(o);
    },
    [toast, sync, record],
  );

  const value = React.useMemo<MemberContextValue>(
    () => ({
      member,
      now,
      interests,
      entries,
      ready,
      has: (id) => ids.has(id),
      opened: (o) => {
        if (!ids.has(o.id)) add(o);
      },
      remove: (id, title) => {
        const entry = entries.find((e) => e.id === id);
        if (!entry) return;
        removeYours(id);
        toast({
          title: feedCopy.toast.removed,
          description: title,
          actionLabel: feedCopy.toast.undo,
          onAction: () => restoreYours(entry),
        });
        void sync(() => forgetOpen(id), () => restoreYours(entry), () => removeYours(id));
      },
      showDetails: (o) => {
        setDetails(o);
        setDetailsOpen(true);
      },
      editInterests: () => setInterestsOpen(true),
      saveInterests: (topics) => {
        setInterests(topics);
        toast({ title: feedCopy.toast.interestsSaved });
      },
    }),
    [member, now, interests, entries, ready, ids, add, toast, sync],
  );

  return (
    <MemberContext.Provider value={value}>
      {children}
      <OpportunitySheet opportunity={details} open={detailsOpen} onOpenChange={setDetailsOpen} />
      <InterestsSheet open={interestsOpen} onOpenChange={setInterestsOpen} interests={interests} />
    </MemberContext.Provider>
  );
}
