"use client";

import { useMemo } from "react";
import { styled } from "next-yak";
import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { EXCLUSION_REASON, type Audience, type Member } from "../model";
import { ConditionsEditor } from "../automatic/ConditionsEditor";
import { memberName } from "./copy";

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);
`;

const KINDS = [
  { value: "all", label: "Everyone" },
  { value: "conditions", label: "A group" },
  { value: "hand", label: "Pick people" },
] as const;

/**
 * "To": a segmented control for who, the matching control revealed under it, and the live count that
 * opens the full list in a sheet. The list itself never sits on the page.
 */
export function AudienceSection({
  audience,
  members,
  now,
  countLabel,
  onChange,
  onOpenList,
}: {
  audience: Audience;
  members: Member[];
  now: Date;
  /** "14 members" */
  countLabel: string;
  /** `resetRemoved` is true when the kind changed: removals made for one audience don't carry over. */
  onChange(next: Audience, opts?: { resetRemoved?: boolean }): void;
  onOpenList(): void;
}) {
  const tags = useMemo(
    () =>
      Array.from(new Set(members.flatMap((m) => m.tags))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [members],
  );

  const setKind = (kind: string) => {
    if (!kind || kind === audience.kind) return;
    if (kind === "all") onChange({ kind: "all" }, { resetRemoved: true });
    else if (kind === "conditions")
      onChange(
        { kind: "conditions", conditions: { match: "all", rules: [] } },
        { resetRemoved: true },
      );
    else onChange({ kind: "hand", memberIds: [] }, { resetRemoved: true });
  };

  const options = useMemo(() => {
    if (audience.kind !== "hand") return [];
    const chosen = new Set(audience.memberIds);
    return members
      .filter((m) => !chosen.has(m.id))
      .map((m) => {
        const off = m.status !== "active";
        return {
          value: m.id,
          label: off
            ? `${memberName(m)} (${EXCLUSION_REASON[m.status as Exclude<Member["status"], "active">].toLowerCase()})`
            : memberName(m),
          disabled: off,
        };
      });
  }, [audience, members]);

  return (
    <Block aria-labelledby="oneoff-to">
      <Controls>
        <Label id="oneoff-to">To</Label>
        <Button
          type="button"
          $variant="outline"
          $size="sm"
          onClick={onOpenList}
          aria-label={`${countLabel}, see who`}
        >
          <Icon icon={UsersRound} size={16} />
          {countLabel}
        </Button>
      </Controls>
      <div>
        <ToggleGroup
          type="single"
          value={audience.kind}
          onValueChange={setKind}
          aria-labelledby="oneoff-to"
        >
          {KINDS.map((k) => (
            <ToggleGroupItem key={k.value} value={k.value}>
              {k.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {audience.kind === "conditions" && (
        <ConditionsEditor
          value={audience.conditions}
          tags={tags}
          now={now}
          onChange={(conditions) =>
            onChange({ kind: "conditions", conditions })
          }
        />
      )}
      {audience.kind === "hand" && (
        <Select
          aria-label="Add a person"
          placeholder="Add a person"
          value=""
          options={options}
          onValueChange={(id) =>
            id &&
            onChange({ kind: "hand", memberIds: [...audience.memberIds, id] })
          }
        />
      )}
    </Block>
  );
}
