"use client";

import { styled } from "next-yak";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { MemberConfirmDialog } from "./MemberConfirmDialog";
import { useMemberActions } from "./useMemberActions";

const Trigger = styled(Button)`
  flex-shrink: 0;
`;

const DangerItem = styled(DropdownMenuItem)`
  color: var(--color-danger);
`;

/** The table row's ⋯ menu. Stops clicks from bubbling up into the row's own onClick (opening the panel). */
export function MemberRowActions({ member }: { member: Member }) {
  const displayName = member.name ?? member.email;
  const { copyEmail, convert, confirm, setConfirm, shownConfirm, runConfirm } = useMemberActions(member);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Trigger
            type="button"
            $variant="ghost"
            $size="sm"
            aria-label={copy.table.rowActionsLabel(displayName)}
            onClick={(event) => event.stopPropagation()}
          >
            <Icon icon={MoreVertical} size={16} />
          </Trigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={copyEmail}>{copy.rowMenu.copyEmail}</DropdownMenuItem>
          {member.subscribed && (
            <>
              {member.tier === "general" ? (
                <DropdownMenuItem onSelect={() => void convert()}>{copy.rowMenu.convert}</DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirm("revoke");
                  }}
                >
                  {copy.rowMenu.remove}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DangerItem
                onSelect={(event) => {
                  event.preventDefault();
                  setConfirm("unsubscribe");
                }}
              >
                {copy.rowMenu.unsubscribe}
              </DangerItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <MemberConfirmDialog
        member={member}
        confirm={confirm}
        shownConfirm={shownConfirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={(kind) => void runConfirm(kind)}
      />
    </>
  );
}
