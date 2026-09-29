"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { requireOnline } from "@/lib/offline";
import { countExport, exportMembers } from "../_data/actions";
import type { ExportKind, ExportScope, MemberTier } from "../_data/types";
import { communityCopy as copy } from "../_copy";

const SCOPE_OPTIONS: { value: ExportScope; label: string }[] = [
  { value: "general", label: copy.exportDialog.scopeGeneral },
  { value: "paying", label: copy.exportDialog.scopePaying },
  { value: "both", label: copy.exportDialog.scopeBoth },
];

const Body = styled.div`
  display: grid;
  gap: var(--space-4);
`;

const Group = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const CountLine = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

export function ExportDialog({
  open,
  onOpenChange,
  tab,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: MemberTier;
}) {
  const { toast } = useToast();
  const [kind, setKind] = React.useState<ExportKind>("members");
  const [scope, setScope] = React.useState<ExportScope>(tab);
  const [includeUnsubscribed, setIncludeUnsubscribed] = React.useState(false);
  const [count, setCount] = React.useState<number | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    countExport(kind, scope, includeUnsubscribed).then((n) => {
      if (!cancelled) setCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, [open, kind, scope, includeUnsubscribed]);

  async function handleDownload() {
    if (!requireOnline()) return;
    setDownloading(true);
    try {
      const { filename, csv } = await exportMembers(kind, scope, includeUnsubscribed);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onOpenChange(false);
      toast({ title: copy.exportDialog.downloadedToast(filename) });
    } catch {
      toast({ title: copy.exportDialog.errorToast });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{copy.exportDialog.title}</DialogTitle>
        <DialogDescription>{copy.exportDialog.description}</DialogDescription>
        <Body>
          <Group>
            <Label id="export-kind-label">{copy.exportDialog.kindLabel}</Label>
            <RadioGroup value={kind} onValueChange={(value) => setKind(value as ExportKind)} aria-labelledby="export-kind-label">
              <RadioGroupOption value="members" label={copy.exportDialog.kindMembers} />
              <RadioGroupOption value="activity" label={copy.exportDialog.kindActivity} />
            </RadioGroup>
          </Group>
          <Field label={copy.exportDialog.whoLabel}>
            {(p) => (
              <Select
                {...p}
                options={SCOPE_OPTIONS}
                value={scope}
                onValueChange={(value) => setScope(value as ExportScope)}
              />
            )}
          </Field>
          {/* Applies to any scope: unsubscribing stops emails, not paying access. */}
          <Checkbox
            label={copy.exportDialog.includeUnsubscribed}
            checked={includeUnsubscribed}
            onCheckedChange={(value) => setIncludeUnsubscribed(value === true)}
          />
          <CountLine>{count === null ? copy.exportDialog.counting : copy.exportDialog.countLine(kind, count)}</CountLine>
        </Body>
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" $variant="secondary">
              {copy.exportDialog.cancel}
            </Button>
          </DialogClose>
          <Button type="button" onClick={() => void handleDownload()} disabled={downloading || count === 0}>
            <Icon icon={Download} size={16} />
            {downloading ? copy.exportDialog.preparing : copy.exportDialog.download}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
