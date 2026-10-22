"use client";

import { useRouter } from "next/navigation";
import { ChartColumn, Copy, Eye, FilePen, MoreHorizontal, Send, Trash2, Undo2, Upload, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import type { AutomaticEmail } from "../model";
import { AUTOMATIC_BASE } from "./summary";
import type { ActionKind } from "./useAutomaticActions";

/** Every action an automatic email offers in its current state. Used by list rows and the email page. */
export function ActionMenu({ email, run, hideOpen }: { email: AutomaticEmail; run(kind: ActionKind, email: AutomaticEmail): void; hideOpen?: boolean }) {
  const router = useRouter();
  const label = email.name.trim() || "Untitled email";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" $variant="ghost" $size="sm" aria-label={`More actions for ${label}`} onClick={(e) => e.stopPropagation()}>
          <Icon icon={MoreHorizontal} size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {email.state === "draft" && (
          <>
            {!hideOpen && (
              <DropdownMenuItem onSelect={() => router.push(`${AUTOMATIC_BASE}/${email.id}`)}>
                <Icon icon={FilePen} size={16} />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => run("publish", email)}>
              <Icon icon={Upload} size={16} />
              Publish
            </DropdownMenuItem>
          </>
        )}
        {email.state === "published" && (
          <DropdownMenuItem onSelect={() => run("unpublish", email)}>
            <Icon icon={EyeOff} size={16} />
            Unpublish
          </DropdownMenuItem>
        )}
        {email.state === "trash" && (
          <DropdownMenuItem onSelect={() => run("restore", email)}>
            <Icon icon={Undo2} size={16} />
            Restore
          </DropdownMenuItem>
        )}
        {email.state !== "trash" && (
          <DropdownMenuItem onSelect={() => run("duplicate", email)}>
            <Icon icon={Copy} size={16} />
            Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => run("render", email)}>
          <Icon icon={Eye} size={16} />
          Preview as member
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run("test", email)}>
          <Icon icon={Send} size={16} />
          Send test
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run("insights", email)}>
          <Icon icon={ChartColumn} size={16} />
          View insights
        </DropdownMenuItem>
        {email.state !== "trash" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem $variant="danger" onSelect={() => run("trash", email)}>
              <Icon icon={Trash2} size={16} />
              Move to trash
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
