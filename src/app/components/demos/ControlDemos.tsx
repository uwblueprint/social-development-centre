"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import { SliderField } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { DatePicker } from "@/components/ui/DatePicker";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 420px;
  margin-bottom: var(--space-7);
`;

const SliderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 420px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

/* The ui Label, but without the block-stacking margin it carries for use
   above an input — here it sits inline next to a checkbox/radio/switch. */
const InlineLabel = styled(Label)`
  margin-bottom: 0;
`;

export function CheckboxDemo() {
  const [indeterminate, setIndeterminate] = React.useState<boolean | "indeterminate">(
    "indeterminate",
  );
  return (
    <Section>
      <Row>
        <Checkbox id="ctrl-cb-1" defaultChecked />
        <InlineLabel htmlFor="ctrl-cb-1">Subscribe to newsletter</InlineLabel>
      </Row>
      <Row>
        <Checkbox id="ctrl-cb-2" />
        <InlineLabel htmlFor="ctrl-cb-2">Accept terms and conditions</InlineLabel>
      </Row>
      <Row>
        <Checkbox
          id="ctrl-cb-3"
          checked={indeterminate}
          onCheckedChange={(c) => setIndeterminate(c)}
        />
        <InlineLabel htmlFor="ctrl-cb-3">Select all (indeterminate)</InlineLabel>
      </Row>
      <Row>
        <Checkbox
          disabled
          defaultChecked
          disabledReason="Your organization requires email notifications."
          label="Email notifications (disabled, value hidden)"
        />
      </Row>
      <Row>
        <Checkbox
          readOnly
          defaultChecked
          disabledReason="Set by your plan; upgrade to change it."
          label="Two-factor authentication (read-only)"
        />
      </Row>
    </Section>
  );
}

export function RadioGroupDemo() {
  return (
    <Section>
      <Label id="ctrl-radio-plan-label">Plan</Label>
      <RadioGroup defaultValue="pro" aria-labelledby="ctrl-radio-plan-label">
        <RadioGroupOption value="free" label="Free" />
        <RadioGroupOption value="pro" label="Pro" />
        <RadioGroupOption value="team" label="Team" disabled disabledReason="Team plan is coming soon." />
      </RadioGroup>
    </Section>
  );
}

export function SwitchDemo() {
  return (
    <Section>
      <Row>
        <Switch id="ctrl-sw-1" defaultChecked />
        <InlineLabel htmlFor="ctrl-sw-1">Email notifications</InlineLabel>
      </Row>
      <Row>
        <Switch id="ctrl-sw-2" />
        <InlineLabel htmlFor="ctrl-sw-2">SMS alerts</InlineLabel>
      </Row>
      <DisabledReason reason="Your organization requires email notifications.">
        <Switch id="ctrl-sw-3" disabled />
        <InlineLabel htmlFor="ctrl-sw-3" data-disabled="">
          Push notifications
        </InlineLabel>
      </DisabledReason>
    </Section>
  );
}

export function SliderDemo() {
  return (
    <SliderStack>
      <SliderField
        label="Volunteer hours per week"
        min={0}
        max={40}
        step={1}
        defaultValue={[10]}
        suffix=" hrs"
      />
      <SliderField
        label="Budget"
        min={0}
        max={1000}
        step={10}
        defaultValue={[200, 800]}
        prefix="$"
      />
      <SliderField
        label="Team seats"
        min={0}
        max={50}
        step={1}
        defaultValue={[5]}
        disabled
        disabledReason="Team plan is coming soon."
      />
    </SliderStack>
  );
}

export function ToggleDemo() {
  return (
    <Section>
      <Row>
        <Toggle aria-label="Toggle bold" defaultPressed>
          Bold
        </Toggle>
        <Toggle aria-label="Toggle italic">Italic</Toggle>
        <DisabledReason reason="Underline formatting isn't available on the free plan.">
          <Toggle aria-label="Toggle underline" disabled>
            Underline
          </Toggle>
        </DisabledReason>
      </Row>
    </Section>
  );
}

export function ToggleGroupDemo() {
  return (
    <Section>
      <ToggleGroup type="single" defaultValue="week" aria-label="View range">
        <ToggleGroupItem value="day" aria-label="Day">
          Day
        </ToggleGroupItem>
        <ToggleGroupItem value="week" aria-label="Week">
          Week
        </ToggleGroupItem>
        <ToggleGroupItem value="month" aria-label="Month">
          Month
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple" defaultValue={["bold"]} aria-label="Text style">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          Underline
        </ToggleGroupItem>
      </ToggleGroup>
    </Section>
  );
}

const DatePickerStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 280px;
`;

export function DatePickerDemo() {
  const today = new Date();
  const maxIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  return (
    <DatePickerStack>
      <Field label="Date of birth" hint="YYYY-MM-DD, or pick from the calendar">
        {(props) => <DatePicker {...props} max={maxIso} defaultValue="1990-05-14" />}
      </Field>
      <Field
        label="Preferred date"
        disabled
        disabledReason="Set by your administrator. Contact support to change it."
      >
        {(props) => <DatePicker {...props} defaultValue="2026-01-01" />}
      </Field>
    </DatePickerStack>
  );
}

export function ControlDemos() {
  return (
    <div>
      <CheckboxDemo />
      <RadioGroupDemo />
      <SwitchDemo />
      <SliderDemo />
      <ToggleDemo />
      <ToggleGroupDemo />
      <DatePickerDemo />
    </div>
  );
}
