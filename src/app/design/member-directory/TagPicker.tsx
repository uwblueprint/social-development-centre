"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import type { TagColor } from "@/components/ui/Tag";
import { TagCombobox } from "@/components/ui/TagCombobox";

/**
 * The kit's TagCombobox, plus "Create “name”" for a typed name that isn't a tag yet. A typed name matching an
 * existing tag (any case) is not offered as new: it is already in the list. Leave `createLabel` out to pick
 * from existing tags only.
 */
export function TagPicker({
  value,
  options,
  colors,
  onValueChange,
  createLabel,
  ...rest
}: {
  value: string[];
  options: string[];
  colors: Record<string, TagColor | undefined>;
  onValueChange: (tags: string[]) => void;
  createLabel?: (query: string) => string;
  placeholder?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const name = query.trim();
  const exists = options.some((t) => t.toLowerCase() === name.toLowerCase());
  const create =
    createLabel && name && !exists
      ? {
          label: (
            <>
              <Icon icon={Plus} size={14} /> {createLabel(name)}
            </>
          ),
          textValue: createLabel(name),
          onSelect: () => {
            if (!value.some((t) => t.toLowerCase() === name.toLowerCase())) onValueChange([...value, name]);
          },
        }
      : null;

  return (
    <TagCombobox
      {...rest}
      options={options.map((t) => ({ value: t, label: t }))}
      value={value}
      onValueChange={onValueChange}
      getColor={(t) => colors[t]}
      onQueryChange={setQuery}
      leadingOption={create}
    />
  );
}
