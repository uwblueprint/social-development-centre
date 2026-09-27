"use client";

import type { SyntheticEvent } from "react";
import { styled } from "next-yak";
import { BadgeCheck, BadgeMinus, Copy, MailPlus, MailX, MoreVertical } from "lucide-react";
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

/* Layout-neutral wrapper; see the stopPropagation note below. */
const RowEventBoundary = styled.span`
  display: contents;
`;

const stop = (event: SyntheticEvent) => event.stopPropagation();

/**
 * The table row's ⋯ menu. The menu and confirm dialog render in portals, but
 * React still bubbles their clicks and key presses up the component tree to
 * the table row, whose onClick/Enter opens the panel. The boundary stops that.
 */
export function MemberRowActions({ member }: { member: Member }) {
  const displayName = member.name ?? member.email;
  const { copyEmail, convert, resubscribe, confirm, setConfirm, shownConfirm, runConfirm } = useMemberActions(member);

  return (
    <RowEventBoundary role="presentation" onClick={stop} onKeyDown={stop}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Trigger
            type="button"
            $variant="ghost"
            $size="sm"
            aria-label={copy.table.rowActionsLabel(displayName)}
          >
            <Icon icon={MoreVertical} size={16} />
          </Trigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={copyEmail}>
            <Icon icon={Copy} size={16} />
            {copy.rowMenu.copyEmail}
          </DropdownMenuItem>
          {member.tier === "general" ? (
            <DropdownMenuItem onSelect={() => void convert()}>
              <Icon icon={BadgeCheck} size={16} />
              {copy.rowMenu.convert}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setConfirm("revoke");
              }}
            >
              <Icon icon={BadgeMinus} size={16} />
              {copy.rowMenu.remove}
            </DropdownMenuItem>
          )}
          {member.subscribed ? (
            <>
              <DropdownMenuSeparator />
              <DangerItem
                onSelect={(event) => {
                  event.preventDefault();
                  setConfirm("unsubscribe");
                }}
              >
                <Icon icon={MailX} size={16} />
                {copy.rowMenu.unsubscribe}
              </DangerItem>
            </>
          ) : (
            member.unsubscribedBy === "admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void resubscribe()}>
                  <Icon icon={MailPlus} size={16} />
                  {copy.rowMenu.resubscribe}
                </DropdownMenuItem>
              </>
            )
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
    </RowEventBoundary>
  );
}
