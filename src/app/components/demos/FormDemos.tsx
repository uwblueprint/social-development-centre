"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Select, SelectItem } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 420px;
  margin-bottom: var(--space-7);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const InlineLabel = styled.label`
  font-size: var(--text-sm);
  color: var(--color-text);
`;

export function LabelDemo() {
  return (
    <Section>
      <Label htmlFor="label-demo-input">Full name</Label>
      <Input id="label-demo-input" placeholder="Ada Lovelace" />
    </Section>
  );
}

export function InputDemo() {
  return (
    <Section>
      <Field label="Email">
        {(props) => <Input {...props} type="email" placeholder="you@example.com" />}
      </Field>
      <Field label="Disabled field">
        {(props) => <Input {...props} disabled placeholder="Not editable" />}
      </Field>
      <Field label="Invalid field" error="This field is required">
        {(props) => <Input {...props} placeholder="Required" />}
      </Field>
    </Section>
  );
}

export function TextareaDemo() {
  return (
    <Section>
      <Field label="Message" hint="Max 500 characters">
        {(props) => <Textarea {...props} placeholder="Write your message..." />}
      </Field>
    </Section>
  );
}

export function FieldDemo() {
  return (
    <Section>
      <Field label="Organization" hint="This appears on your public profile">
        {(props) => <Input {...props} placeholder="Social Development Centre" />}
      </Field>
      <Field label="Website" error="Enter a valid URL">
        {(props) => <Input {...props} placeholder="https://" aria-invalid />}
      </Field>
    </Section>
  );
}

export function CheckboxDemo() {
  const [indeterminate, setIndeterminate] = React.useState<boolean | "indeterminate">(
    "indeterminate",
  );
  return (
    <Section>
      <Row>
        <Checkbox id="cb-1" defaultChecked />
        <InlineLabel htmlFor="cb-1">Subscribe to newsletter</InlineLabel>
      </Row>
      <Row>
        <Checkbox id="cb-2" />
        <InlineLabel htmlFor="cb-2">Accept terms and conditions</InlineLabel>
      </Row>
      <Row>
        <Checkbox
          id="cb-3"
          checked={indeterminate}
          onCheckedChange={(c) => setIndeterminate(c)}
        />
        <InlineLabel htmlFor="cb-3">Select all (indeterminate)</InlineLabel>
      </Row>
      <Row>
        <Checkbox id="cb-4" disabled />
        <InlineLabel htmlFor="cb-4">Disabled option</InlineLabel>
      </Row>
    </Section>
  );
}

export function RadioGroupDemo() {
  return (
    <Section>
      <Label id="radio-plan-label">Plan</Label>
      <RadioGroup defaultValue="pro" aria-labelledby="radio-plan-label">
        <Row>
          <RadioGroupItem id="plan-free" value="free" />
          <InlineLabel htmlFor="plan-free">Free</InlineLabel>
        </Row>
        <Row>
          <RadioGroupItem id="plan-pro" value="pro" />
          <InlineLabel htmlFor="plan-pro">Pro</InlineLabel>
        </Row>
        <Row>
          <RadioGroupItem id="plan-team" value="team" disabled />
          <InlineLabel htmlFor="plan-team">Team (coming soon)</InlineLabel>
        </Row>
      </RadioGroup>
    </Section>
  );
}

export function SelectDemo() {
  return (
    <Section>
      <Field label="Country">
        {(props) => (
          <Select {...props} defaultValue="us" placeholder="Select a country">
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="au">Australia</SelectItem>
            <SelectItem value="disabled-example" disabled>
              Unavailable region
            </SelectItem>
          </Select>
        )}
      </Field>
      <Field label="Disabled select">
        {(props) => (
          <Select {...props} disabled placeholder="Not available">
            <SelectItem value="a">Option A</SelectItem>
          </Select>
        )}
      </Field>
    </Section>
  );
}

export function SliderDemo() {
  return (
    <Section>
      <Label htmlFor="slider-volume">Volume</Label>
      <Slider id="slider-volume" defaultValue={[40]} max={100} step={1} aria-label="Volume" />
      <Label htmlFor="slider-range">Price range</Label>
      <Slider
        id="slider-range"
        defaultValue={[20, 70]}
        max={100}
        step={1}
        aria-label="Price range"
      />
      <Label htmlFor="slider-disabled">Disabled</Label>
      <Slider
        id="slider-disabled"
        defaultValue={[30]}
        max={100}
        disabled
        aria-label="Disabled slider"
      />
    </Section>
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
        <Toggle aria-label="Toggle disabled" disabled>
          Disabled
        </Toggle>
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

export function FormDemos() {
  return (
    <div>
      <LabelDemo />
      <InputDemo />
      <TextareaDemo />
      <FieldDemo />
      <CheckboxDemo />
      <RadioGroupDemo />
      <SelectDemo />
      <SliderDemo />
      <ToggleDemo />
      <ToggleGroupDemo />
    </div>
  );
}
