"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { AuthColumn, AuthForm, AuthHeading, AuthScreen, FormError, SdcLogo } from "@/features/auth/AuthScreen";
import { fieldError } from "@/lib/forms";
import { submitWelcome } from "./actions";

// A scaffold: the questions are placeholders until SDC decides what to ask.
export function WelcomeForm({ fullName }: { fullName: string }) {
  const [state, formAction] = useActionState(submitWelcome, { status: "idle" });
  const values = state.data;

  return (
    <AuthScreen>
      <AuthColumn>
        <SdcLogo />
        <AuthHeading
          title="Welcome to SDC"
          description="Tell us a little about yourself so we can share opportunities you’ll care about."
        />
        <AuthForm action={formAction} noValidate>
          <Field label="Full name" required error={fieldError(state, "fullName")}>
            {(props) => (
              <Input {...props} name="fullName" autoComplete="name" defaultValue={values?.fullName ?? fullName} />
            )}
          </Field>
          <Field label="How did you hear about SDC?">
            {(props) => <Input {...props} name="heardAbout" defaultValue={values?.heardAbout} />}
          </Field>
          <Field label="What kinds of opportunities interest you?">
            {(props) => <Textarea {...props} name="interests" rows={3} defaultValue={values?.interests} />}
          </Field>
          <SubmitButton $size="lg">Continue</SubmitButton>
          {state.message && (
            <FormError role="alert">
              <Icon icon={CircleAlert} size={16} />
              {state.message}
            </FormError>
          )}
        </AuthForm>
      </AuthColumn>
    </AuthScreen>
  );
}
