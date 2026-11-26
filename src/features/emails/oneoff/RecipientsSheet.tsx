"use client";

import { useState, type ReactNode } from "react";
import { styled } from "next-yak";
import { ChevronDown, Undo2, UserMinus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { TruncatedEmail, TruncatedText } from "@/components/ui/TruncatedText";
import { EXCLUSION_REASON, type AudienceResult, type Member } from "../model";
import { PAGE_SIZE, memberName, members as membersWord } from "./copy";
import { Quiet, Stack } from "./parts";

const Who = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Chevron = styled.span`
  display: inline-flex;
  transition: transform var(--duration) var(--ease);
  [data-state="open"] > & {
    transform: rotate(180deg);
  }
`;

const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Item = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--color-border);
`;

export function MemberCell({ m }: { m: Member }) {
  return (
    <Who>
      <TruncatedText tooltip>{memberName(m)}</TruncatedText>
      {m.firstName || m.lastName ? (
        <Quiet>
          <TruncatedEmail email={m.email} />
        </Quiet>
      ) : null}
    </Who>
  );
}

export function Fold({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" $variant="ghost" $size="sm">
          <Chevron>
            <Icon icon={ChevronDown} size={16} />
          </Chevron>
          {label}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** Rows of one member and one trailing control. A filter appears once the list is longer than a page; "Show more" pages it. */
function MemberList({
  rows,
  label,
  empty,
}: {
  rows: { member: Member; trailing: ReactNode }[];
  label: string;
  empty?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const query = q.trim().toLowerCase();
  const filtered = query
    ? rows.filter((r) =>
        `${memberName(r.member)} ${r.member.email}`
          .toLowerCase()
          .includes(query),
      )
    : rows;
  if (rows.length === 0) return <>{empty}</>;
  return (
    <Stack>
      {rows.length > PAGE_SIZE && (
        <SearchField
          aria-label="Filter by name or email"
          placeholder="Filter by name or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(PAGE_SIZE);
          }}
          onSearch={() => {}}
        />
      )}
      <Items aria-label={label}>
        {filtered.slice(0, shown).map((r) => (
          <Item key={r.member.id}>
            <MemberCell m={r.member} />
            {r.trailing}
          </Item>
        ))}
      </Items>
      {filtered.length === 0 && <Quiet>No match for “{q.trim()}”</Quiet>}
      {filtered.length > shown && (
        <div>
          <Button
            type="button"
            $variant="secondary"
            $size="sm"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
          >
            Show more
          </Button>
        </div>
      )}
    </Stack>
  );
}

/**
 * Everyone who gets the email, with Remove per row. Removed and excluded people are folded away.
 * `mode="limit"` lists only the people who pass the monthly limit.
 */
export function RecipientsSheet({
  open,
  onOpenChange,
  mode,
  result,
  removed,
  overLimitIds,
  onRemove,
  onAddBack,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  mode: "all" | "limit";
  result: AudienceResult;
  /** People taken out of this send who would otherwise match. */
  removed: Member[];
  overLimitIds: Set<string>;
  onRemove(id: string): void;
  onAddBack(id: string): void;
}) {
  const { recipients, excluded } = result;
  const shown =
    mode === "limit"
      ? recipients.filter((m) => overLimitIds.has(m.id))
      : recipients;
  const title =
    mode === "limit"
      ? `${membersWord(shown.length)} past the monthly limit`
      : membersWord(recipients.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <Stack>
            <MemberList
              label="Recipients"
              rows={shown.map((m) => ({
                member: m,
                trailing: (
                  <Button
                    type="button"
                    $variant="ghost"
                    $size="sm"
                    aria-label={`Remove ${memberName(m)}`}
                    onClick={() => onRemove(m.id)}
                  >
                    <Icon icon={UserMinus} size={16} />
                  </Button>
                ),
              }))}
              empty={<EmptyState icon={UsersRound} title="No one yet" />}
            />
            {removed.length > 0 && mode === "all" && (
              <Fold label={`Removed (${removed.length})`}>
                <MemberList
                  label="Removed"
                  rows={removed.map((m) => ({
                    member: m,
                    trailing: (
                      <Button
                        type="button"
                        $variant="ghost"
                        $size="sm"
                        aria-label={`Add ${memberName(m)} back`}
                        onClick={() => onAddBack(m.id)}
                      >
                        <Icon icon={Undo2} size={16} />
                      </Button>
                    ),
                  }))}
                />
              </Fold>
            )}
            {excluded.length > 0 && mode === "all" && (
              <Fold label={`Not included (${excluded.length})`}>
                <MemberList
                  label="Not included"
                  rows={excluded.map((e) => ({
                    member: e.member,
                    trailing: (
                      <Quiet>
                        {e.reason ||
                          EXCLUSION_REASON[
                            e.member.status as Exclude<
                              Member["status"],
                              "active"
                            >
                          ]}
                      </Quiet>
                    ),
                  }))}
                />
              </Fold>
            )}
          </Stack>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
