"use client";

import { useActionState } from "react";
import { styled } from "next-yak";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { SliderField } from "@/components/ui/Slider";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { fieldError, type ActionState } from "@/lib/forms";
import { echoForm } from "./actions";

const Form = styled.form`
  display: grid;
  gap: var(--space-5);
  max-width: 480px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const Message = styled.p<{ $error: boolean }>`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: ${({ $error }) => ($error ? "var(--color-danger)" : "var(--color-success)")};
`;

const Output = styled.pre`
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: var(--leading-body);
  white-space: pre-wrap;
`;

const initial: ActionState<Record<string, string[]>> = { status: "idle" };

export function ContractForm() {
  const [state, action] = useActionState(echoForm, initial);

  return (
    <>
      <Form action={action} noValidate>
        <Field label="Organization name" required>
          {(p) => <Input {...p} name="organization" defaultValue="Northside Food Bank" />}
        </Field>
        <Field label="Contact email" error={fieldError(state, "email")}>
          {(p) => <Input {...p} name="email" type="email" defaultValue="not-an-email" />}
        </Field>
        <Field label="Description" hint="Up to 200 characters">
          {(p) => <Textarea {...p} name="description" maxLength={200} />}
        </Field>
        <Field label="Listing type">
          {(p) => (
            <Select
              {...p}
              name="type"
              defaultValue="volunteer"
              options={[
                { value: "volunteer", label: "Volunteer" },
                { value: "job", label: "Job" },
                { value: "event", label: "Event" },
              ]}
            />
          )}
        </Field>
        <Field label="Start date">
          {(p) => <DatePicker {...p} name="startDate" defaultValue="2026-10-01" />}
        </Field>
        <SliderField label="Weekly hours" name="hours" min={0} max={40} defaultValue={[10, 20]} suffix=" hrs" />
        <div>
          <Label id="fc-audience">Audience</Label>
          <RadioGroup name="audience" defaultValue="youth" aria-labelledby="fc-audience">
            <RadioGroupOption value="youth" label="Youth" />
            <RadioGroupOption value="adults" label="Adults" />
          </RadioGroup>
        </div>
        <ToggleGroup type="single" name="visibility" defaultValue="public" aria-label="Visibility">
          <ToggleGroupItem value="public">Public</ToggleGroupItem>
          <ToggleGroupItem value="members">Members only</ToggleGroupItem>
        </ToggleGroup>
        <Checkbox name="featured" value="yes" defaultChecked label="Feature in the weekly email" />
        <Row>
          <Switch id="fc-notify" name="notifyPartners" value="yes" />
          <Label htmlFor="fc-notify">Notify partner contacts</Label>
        </Row>
        <Row>
          <SubmitButton>Save listing</SubmitButton>
          {state.message && (
            <Message role="status" $error={state.status === "error"}>
              {state.message}
            </Message>
          )}
        </Row>
      </Form>
      {state.data && <Output aria-label="Submitted form data">{JSON.stringify(state.data, null, 2)}</Output>}
    </>
  );
}
