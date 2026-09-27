"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ExternalLink, Tablet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverActions, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { communityCopy as copy } from "../_copy";

const Form = styled.form`
  display: grid;
`;

/**
 * Open sign-up kiosk: a small popover asks where the booth is, then opens /kiosk?location=… in a new
 * tab for the tablet. The location is saved with each sign-up (export only), so it's required.
 */
export function KioskLauncher() {
  const [open, setOpen] = React.useState(false);
  const [location, setLocation] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const where = location.trim();
    if (!where) {
      setError(copy.kiosk.locationRequired);
      inputRef.current?.focus();
      return;
    }
    window.open(`/kiosk?location=${encodeURIComponent(where)}`, "_blank", "noopener");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" $variant="secondary">
          <Icon icon={Tablet} size={16} />
          {copy.toolbar.openKiosk}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <Form onSubmit={handleSubmit} noValidate>
          <Field label={copy.kiosk.locationLabel} hint={copy.kiosk.locationHint} error={error} required>
            {(p) => (
              <Input
                {...p}
                ref={inputRef}
                name="location"
                value={location}
                maxLength={80}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setError(undefined);
                }}
              />
            )}
          </Field>
          <PopoverActions>
            <Button type="submit" $size="sm">
              <Icon icon={ExternalLink} size={16} />
              {copy.kiosk.open}
            </Button>
          </PopoverActions>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
