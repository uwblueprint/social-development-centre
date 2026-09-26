import type { LucideIcon, LucideProps } from "lucide-react";

/**
 * All icons go through this so stroke and size stay consistent.
 * Decorative by default; pass `label` only when the icon is the sole content of a control.
 */
export function Icon({
  icon: Glyph,
  size = 16,
  label,
  ...props
}: Omit<LucideProps, "ref"> & { icon: LucideIcon; label?: string }) {
  return (
    <Glyph
      size={size}
      strokeWidth={1.5}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...props}
    />
  );
}
