"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import { SliderField } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { DisabledReason } from "@/components/ui/DisabledReason";

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
      <DisabledReason reason="Your organization requires email notifications.">
        <Checkbox id="ctrl-cb-4" disabled defaultChecked />
        <InlineLabel htmlFor="ctrl-cb-4" data-disabled="">
          Email notifications
        </InlineLabel>
      </DisabledReason>
    </Section>
  );
}

export function RadioGroupDemo() {
  return (
    <Section>
      <Label id="ctrl-radio-plan-label">Plan</Label>
      <RadioGroup defaultValue="pro" aria-labelledby="ctrl-radio-plan-label">
        <Row>
          <RadioGroupItem id="ctrl-plan-free" value="free" />
          <InlineLabel htmlFor="ctrl-plan-free">Free</InlineLabel>
        </Row>
        <Row>
          <RadioGroupItem id="ctrl-plan-pro" value="pro" />
          <InlineLabel htmlFor="ctrl-plan-pro">Pro</InlineLabel>
        </Row>
        <DisabledReason reason="Team plan is coming soon.">
          <RadioGroupItem id="ctrl-plan-team" value="team" disabled />
          <InlineLabel htmlFor="ctrl-plan-team" data-disabled="">
            Team
          </InlineLabel>
        </DisabledReason>
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
    </Section>
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
    </div>
  );
}
