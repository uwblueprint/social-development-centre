"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Copy, Info, Link2Off, MailCheck, MessageSquareText } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { AuthActions, AuthColumn, AuthForm, AuthHeading, AuthScreen, FormError, IconWell, SdcLogo } from "@/features/auth/AuthScreen";
import { copy } from "./copy";
import { REFERRER, referFriend, type Delivery, type ReferralResult } from "./data";

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* Context above the message, e.g. "You referred Sam on Nov 3": icon plus text, never colour alone. */
const Note = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  width: 100%;
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  & > svg {
    flex-shrink: 0;
  }
`;

const Full = styled.div`
  width: 100%;
`;

type Values = { name: string; email: string; delivery: Delivery };
type View = { name: "form"; result?: ReferralResult; values?: Values } | Extract<ReferralResult, { status: "emailed" | "message" }>;

function Referrals({ unknownLink }: { unknownLink: boolean }) {
  const [view, setView] = useState<View>({ name: "form" });
  const [delivery, setDelivery] = useState<Delivery>("email");

  // A new screen replaces the old one, so move focus to its heading (it has tabIndex -1).
  const moved = useRef(false);
  const key = "status" in view ? view.status : view.name;
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [key]);

  async function submit(formData: FormData) {
    const values: Values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      delivery: formData.get("delivery") === "self" ? "self" : "email",
    };
    const result = await referFriend(values).catch((): ReferralResult => ({ status: "failed" }));
    if (result.status === "emailed" || result.status === "message") {
      moved.current = true;
      setView(result);
    } else {
      setView({ name: "form", result, values });
    }
  }

  function startOver() {
    moved.current = true;
    setDelivery("email");
    setView({ name: "form" });
  }

  if (unknownLink) {
    return (
      <AuthColumn>
        <IconWell icon={Link2Off} tone="neutral" />
        <AuthHeading title={copy.unknownTitle} description={copy.unknownDescription} />
      </AuthColumn>
    );
  }

  if ("status" in view && view.status === "emailed") {
    return (
      <AuthColumn>
        <IconWell icon={MailCheck} tone="brand" />
        <AuthHeading title={copy.emailedTitle(view.friendName)} description={copy.emailedDescription} />
        <AuthActions>
          <Button type="button" $variant="outline" $size="lg" onClick={startOver}>
            {copy.again}
          </Button>
        </AuthActions>
      </AuthColumn>
    );
  }

  if ("status" in view && view.status === "message") {
    return <MessageView key={view.link} view={view} onStartOver={startOver} />;
  }

  const fieldErrors = view.result?.status === "invalid" ? view.result.fieldErrors : {};
  const v = view.values;
  return (
    <AuthColumn>
      <SdcLogo />
      <AuthHeading title={copy.title} description={copy.description} />
      <AuthForm action={submit} noValidate>
        <Field label={copy.nameLabel} required error={fieldErrors.name}>
          {(props) => <Input {...props} key={`name-${v?.name}`} name="name" autoComplete="off" maxLength={120} defaultValue={v?.name} />}
        </Field>
        <Field label={copy.emailLabel} required error={fieldErrors.email}>
          {(props) => (
            <Input {...props} key={`email-${v?.email}`} type="email" name="email" autoComplete="off" defaultValue={v?.email} />
          )}
        </Field>
        <Group>
          <Label id="delivery-label">{copy.deliveryLabel}</Label>
          <RadioGroup name="delivery" value={delivery} onValueChange={(next) => setDelivery(next as Delivery)} aria-labelledby="delivery-label">
            <RadioGroupOption value="email" label={copy.deliveryEmail} />
            <RadioGroupOption value="self" label={copy.deliverySelf} />
          </RadioGroup>
        </Group>
        {view.result?.status === "failed" && (
          <FormError role="alert">
            <Icon icon={CircleAlert} size={16} />
            {copy.failed}
          </FormError>
        )}
        <SubmitButton $size="lg">{delivery === "email" ? copy.submitEmail : copy.submitSelf}</SubmitButton>
      </AuthForm>
    </AuthColumn>
  );
}

function MessageView({
  view,
  onStartOver,
}: {
  view: Extract<ReferralResult, { status: "message" }>;
  onStartOver: () => void;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState(() => copy.message(view.friendName, view.link, REFERRER.firstName));

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: copy.copied });
    } catch {
      toast({ title: copy.copyFailed });
    }
  }

  return (
    <AuthColumn>
      <IconWell icon={MessageSquareText} tone="brand" />
      <AuthHeading title={copy.messageTitle(view.friendName)} description={copy.messageDescription} />
      {view.referredOn && (
        <Note>
          <Icon icon={Info} size={16} />
          {copy.alreadyReferred(view.friendName, view.referredOn)}
        </Note>
      )}
      <Full>
        <Field label={copy.messageLabel} hint={copy.linkHint(view.friendName)}>
          {(props) => <Textarea {...props} rows={9} value={message} onChange={(e) => setMessage(e.target.value)} />}
        </Field>
      </Full>
      <AuthActions>
        <Button type="button" $size="lg" onClick={() => void copyMessage()}>
          <Icon icon={Copy} />
          {copy.copyMessage}
        </Button>
        <Button type="button" $variant="ghost" $size="lg" onClick={onStartOver}>
          {copy.again}
        </Button>
      </AuthActions>
    </AuthColumn>
  );
}

export function ReferralsPage({ unknownLink }: { unknownLink: boolean }) {
  return (
    <AppToastProvider>
      <AuthScreen>
        <Referrals unknownLink={unknownLink} />
      </AuthScreen>
    </AppToastProvider>
  );
}
