"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";

/** Matches the kit's mobile breakpoint (767px). */
const NARROW = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Server and first paint assume a wide screen, so the full labels render without a flash on desktop. */
function useNarrow() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

const IconOnly = styled(Button)`
  padding: 0;
  aspect-ratio: 1;
  justify-content: center;
`;

type HeaderActionProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  icon: LucideIcon;
  label: string;
  /** Icon only at every width (owner: the secondary actions); otherwise only on small screens. */
  iconOnly?: boolean;
};

/**
 * A page-header action: icon and label on wider screens; on small screens, icon only, with the label
 * as its accessible name and tooltip (owner: keeps the header on one line on phones).
 */
export const HeaderAction = React.forwardRef<
  HTMLButtonElement,
  HeaderActionProps
>(function HeaderAction({ icon, label, iconOnly, ...props }, ref) {
  const narrow = useNarrow();
  if (!narrow && !iconOnly) {
    return (
      <Button ref={ref} {...props}>
        <Icon icon={icon} size={16} />
        {label}
      </Button>
    );
  }
  return (
    <Tooltip content={label} pinOnClick={false}>
      <IconOnly ref={ref} {...props} aria-label={label}>
        <Icon icon={icon} size={16} />
      </IconOnly>
    </Tooltip>
  );
});
