"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { CreatableCombobox } from "@/components/ui/CreatableCombobox";
import { SearchField } from "@/components/ui/SearchField";
import { DatePicker } from "@/components/ui/DatePicker";

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 420px;
  margin-bottom: var(--space-7);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  max-width: 640px;
  margin-bottom: var(--space-7);

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
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
      <Field label="Full name">
        {(props) => <Input {...props} placeholder="Ada Lovelace" />}
      </Field>
      <Field
        label="Account ID"
        disabled
        disabledReason="Set by your administrator. Contact support to change it."
      >
        {(props) => <Input {...props} defaultValue="ACC-1029" />}
      </Field>
      <Field label="Email" error="Enter a valid email address">
        {(props) => <Input {...props} type="email" defaultValue="not-an-email" />}
      </Field>
    </Section>
  );
}

export function SearchFieldDemo() {
  return (
    <Section>
      <Field label="Search partners" hint="Matches organization name, contact name or email">
        {(props) => <SearchField {...props} placeholder="Search partners" />}
      </Field>
    </Section>
  );
}

export function TextareaDemo() {
  return (
    <Section>
      <Field label="Message" hint="Tell us a bit about your request">
        {(props) => <Textarea {...props} maxLength={200} placeholder="Write your message..." />}
      </Field>
      <Field label="Feedback" error="Feedback is required">
        {(props) => <Textarea {...props} placeholder="Required" />}
      </Field>
    </Section>
  );
}

function todayISODate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function FieldDemo() {
  const todayIso = todayISODate();
  return (
    <FormGrid>
      <Field label="Full name" required>
        {(props) => <Input {...props} placeholder="Ada Lovelace" autoComplete="name" />}
      </Field>
      <Field label="Email" hint="We'll send confirmations here">
        {(props) => (
          <Input {...props} type="email" placeholder="you@example.com" autoComplete="email" />
        )}
      </Field>
      <Field label="Phone" hint="Include the country code, e.g. +44 20 7946 0958">
        {(props) => <Input {...props} type="tel" placeholder="+44 20 7946 0958" autoComplete="tel" />}
      </Field>
      <Field label="Password" hint="At least 8 characters, with a number and a symbol">
        {(props) => <Input {...props} type="password" autoComplete="new-password" />}
      </Field>
      <Field label="Website" error="Enter a URL starting with https://">
        {(props) => (
          <Input {...props} type="url" placeholder="https://example.org" defaultValue="example.org" />
        )}
      </Field>
      <Field label="Date of birth" hint="YYYY-MM-DD — typing is fastest; the calendar button also works">
        {(props) => <DatePicker {...props} defaultValue="1990-05-14" max={todayIso} />}
      </Field>
      <Field label="Number of volunteers" hint="Between 1 and 500">
        {(props) => <Input {...props} type="number" min={1} max={500} placeholder="10" />}
      </Field>
      <Field
        label="Organization ID"
        disabled
        disabledReason="Set by your administrator. Contact support to change it."
      >
        {(props) => <Input {...props} defaultValue="SDC-04821" />}
      </Field>
    </FormGrid>
  );
}


const contactMethodOptions = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text message", disabled: true },
];

const countryOptions = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "in", label: "India" },
  { value: "jp", label: "Japan" },
  { value: "br", label: "Brazil" },
  { value: "za", label: "South Africa" },
  { value: "mx", label: "Mexico" },
  { value: "ng", label: "Nigeria" },
  { value: "kr", label: "South Korea" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy", disabled: true },
];

export function SelectDemo() {
  return (
    <Section>
      <Field label="Preferred contact method">
        {(props) => (
          <Select
            {...props}
            options={contactMethodOptions}
            defaultValue="email"
            placeholder="Choose a method"
          />
        )}
      </Field>
      <Field label="Country" hint="Type to search the list">
        {(props) => (
          <Select
            {...props}
            options={countryOptions}
            defaultValue="us"
            placeholder="Select a country"
          />
        )}
      </Field>
      <Field
        label="Region"
        disabled
        disabledReason="Set by your administrator. Contact support to change it."
      >
        {(props) => (
          <Select {...props} options={contactMethodOptions} placeholder="Not available" />
        )}
      </Field>
    </Section>
  );
}

const organizationOptions = [
  { value: "org_1", label: "Northside Food Bank" },
  { value: "org_2", label: "Riverbend Youth Collective" },
  { value: "org_3", label: "Maple Literacy Project" },
  { value: "org_4", label: "Eastside Newcomer Services" },
];

export function CreatableComboboxDemo() {
  return (
    <Section>
      <Field label="Organization" hint="Search existing organizations, or create a new one">
        {(props) => (
          <CreatableCombobox
            {...props}
            options={organizationOptions}
            existingFieldName="organizationId"
            createFieldName="organizationName"
            placeholder="Search or create an organization…"
          />
        )}
      </Field>
    </Section>
  );
}

