"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ExternalLink, Tablet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { communityCopy as copy } from "../_copy";

/* The title has no description under it, so the form keeps its own distance from it (as in Add members). */
const Form = styled.form`
  display: grid;
  padding-top: var(--space-3);
`;

/**
 * Open sign-up kiosk: a dialog with one optional Location field, then /kiosk?location=… opens in a
 * new tab for the tablet. The location is saved with each sign-up (export only); blank opens /kiosk.
 */
export function KioskLauncher() {
  const [open, setOpen] = React.useState(false);
  const [location, setLocation] = React.useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const where = location.trim();
    window.open(where ? `/kiosk?location=${encodeURIComponent(where)}` : "/kiosk", "_blank", "noopener");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" $variant="secondary">
          <Icon icon={Tablet} size={16} />
          {copy.toolbar.openKiosk}
        </Button>
      </DialogTrigger>
      {/* No description: the title and one field say it all. */}
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{copy.kiosk.title}</DialogTitle>
        <Form onSubmit={handleSubmit} noValidate>
          <Field label={copy.kiosk.locationLabel}>
            {(p) => (
              <Input
                {...p}
                name="location"
                value={location}
                maxLength={80}
                onChange={(e) => setLocation(e.target.value)}
              />
            )}
          </Field>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                {copy.kiosk.cancel}
              </Button>
            </DialogClose>
            <Button type="submit">
              <Icon icon={ExternalLink} size={16} />
              {copy.kiosk.open}
            </Button>
          </DialogActions>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
