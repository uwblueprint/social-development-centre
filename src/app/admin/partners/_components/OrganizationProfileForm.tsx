"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { partnersCopy } from "../_copy";
import { updateOrganization } from "../_data/actions";
import { ORGANIZATION_DESCRIPTION_MAX, type AdminPartnerOrganization } from "../_data/types";
import { useFocusFirstInvalid } from "../_lib/useFocusFirstInvalid";

const copy = partnersCopy.organizationPanel;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;

  & > * {
    align-self: stretch;
  }
  & > [data-form-actions] {
    align-self: flex-start;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: var(--space-2);
`;

/** Edit details: name, website, description. Opens focused on the name; closes after a successful save. */
export function OrganizationProfileForm({ org, labelledBy, onDone }: { org: AdminPartnerOrganization; labelledBy: string; onDone: () => void }) {
  const { toast } = useToast();
  const [state, action] = useActionState(updateOrganization.bind(null, org.id), idleState);
  // Controlled so a failed save keeps what was typed (React resets uncontrolled forms after an action).
  const [name, setName] = React.useState(org.name);
  const [website, setWebsite] = React.useState(org.website ?? "");
  const [description, setDescription] = React.useState(org.description ?? "");
  const formRef = React.useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  React.useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);

  const onResult = React.useEffectEvent(() => {
    if (state.status === "idle" || state.fieldErrors) return;
    if (state.message) toast({ title: state.message });
    if (state.status === "success") onDone();
  });
  React.useEffect(() => {
    onResult();
  }, [state]);

  return (
    <Form ref={formRef} action={action} aria-labelledby={labelledBy} noValidate>
      <Field label={copy.nameLabel} error={fieldError(state, "name")} required>
        {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
      </Field>
      <Field label={copy.websiteLabel} hint={copy.websiteHint} error={fieldError(state, "website")}>
        {(p) => <Input {...p} name="website" inputMode="url" autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />}
      </Field>
      <Field label={copy.descriptionLabel} hint={copy.descriptionHint} error={fieldError(state, "description")}>
        {(p) => (
          <Textarea
            {...p}
            name="description"
            rows={3}
            maxLength={ORGANIZATION_DESCRIPTION_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>
      <FormActions data-form-actions="">
        <SubmitButton $size="sm">{copy.save}</SubmitButton>
        <Button type="button" $variant="ghost" $size="sm" onClick={onDone}>
          {copy.cancel}
        </Button>
      </FormActions>
    </Form>
  );
}
