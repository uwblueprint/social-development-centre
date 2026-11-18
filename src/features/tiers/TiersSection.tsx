"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SortableList } from "@/components/ui/SortableList";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { Section, SectionTitle } from "@/features/account/layout";
import { FormError } from "@/features/auth/AuthScreen";
import { fieldError, type ActionState } from "@/lib/forms";
import { addTier, deleteTier, getTierMembers, reorderTiers, updateTier } from "./actions";
import { formatPrice, type Tier, type TierMember, type TierValues } from "./types";

const idle: ActionState<TierValues> = { status: "idle" };
/** How many members the delete confirmation lists before "and N more". */
const LISTED_MEMBERS = 20;

const Intro = styled.p`
  margin: 0;
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/* One tier's text and buttons; the position number and drag handle come from SortableList. */
const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
`;

const Summary = styled.div`
  flex: 1 1 180px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Name = styled.span`
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
  overflow-wrap: anywhere;
`;

const Meta = styled.span`
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const Actions = styled.div`
  display: flex;
  gap: var(--space-3);
`;

/* The intro on the left, Add tier on the right; the button drops under the text on narrow screens. */
const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-5);
  padding: var(--space-4) 0;

  & > p {
    flex: 1 1 320px;
    padding: 0;
  }
`;

/*
 * The tier dialogs' own spacing: the kit's defaults pack title, text and buttons within a few pixels.
 * Everything stacks with one even gap, a little extra room around it, and the buttons stand apart.
 */
const DialogForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-2);

  & > * {
    margin: 0;
  }
  /* The description sits close under its title. */
  & > h2 {
    margin-bottom: calc(var(--space-3) * -1);
  }
  & > :last-child {
    margin-top: var(--space-2);
  }
`;

const Members = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  font-size: var(--text-sm);
  color: var(--color-text);
`;

const EditFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

function memberLabel(m: TierMember) {
  return m.name ? `${m.name} (${m.email})` : m.email;
}

/** Name and whole-dollar cost. Shared by Add and Edit. */
function TierFields({ state, initial }: { state: ActionState<TierValues>; initial?: TierValues }) {
  const values = state.data ?? initial;
  return (
    <>
      <Field label="Name" required error={fieldError(state, "name")}>
        {(props) => <Input {...props} name="name" maxLength={60} defaultValue={values?.name} autoComplete="off" />}
      </Field>
      <Field label="Cost in dollars" required error={fieldError(state, "priceCad")}>
        {(props) => (
          <Input
            {...props}
            name="priceCad"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            defaultValue={values?.priceCad}
          />
        )}
      </Field>
    </>
  );
}

function formLevelError(state: ActionState<unknown>) {
  return state.status === "error" && !state.fieldErrors ? state.message : undefined;
}

export function TiersSection({ tiers: initialTiers }: { tiers: Tier[] }) {
  // Order is changed here first and then saved, so the row moves the moment it's pressed.
  const [tiers, setTiers] = useState(initialTiers);
  const [prev, setPrev] = useState(initialTiers);
  const [reorderError, setReorderError] = useState<string>();
  const [, startTransition] = useTransition();
  // New data from the server (added, edited, deleted) replaces the local copy.
  if (prev !== initialTiers) {
    setPrev(initialTiers);
    setTiers(initialTiers);
  }

  function reorder(next: Tier[]) {
    const before = tiers;
    setTiers(next);
    setReorderError(undefined);
    startTransition(async () => {
      const result = await reorderTiers(next.map((t) => t.id));
      if (result.status === "error") {
        setTiers(before);
        setReorderError(result.message ?? "We couldn’t save the new order. Try again.");
      }
    });
  }

  return (
    <Section aria-labelledby="tiers">
      <SectionTitle id="tiers">Membership tiers</SectionTitle>
      <Header>
        <Intro>
          Members choose one tier and pay its cost. All prices are in CAD. The order here is the order members see.
        </Intro>
        <AddTier />
      </Header>

      {reorderError && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {reorderError}
        </FormError>
      )}

      {tiers.length === 0 ? (
        <Intro>No tiers yet. Use Add tier to create one.</Intro>
      ) : (
        <SortableList items={tiers} getId={(t) => t.id} getLabel={(t) => t.name} onReorder={reorder} aria-label="Tiers">
          {(tier) => (
            <Line>
              <Summary>
                <Name>{tier.name}</Name>
                <Meta>
                  {formatPrice(tier.priceCad)} · {tier.memberCount} {tier.memberCount === 1 ? "member" : "members"}
                </Meta>
              </Summary>
              <Actions>
                <EditTier tier={tier} />
                <DeleteTier tier={tier} />
              </Actions>
            </Line>
          )}
        </SortableList>
      )}

    </Section>
  );
}

/** The form only exists once Add tier is pressed, in a dialog. */
function AddTier() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" $variant="outline" $size="sm">
          Add tier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AddForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while the dialog is open, so it always starts empty. */
function AddForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(async (prev: ActionState<TierValues>, formData: FormData) => {
    const result = await addTier(prev, formData);
    if (result.status === "success") {
      toast({ title: result.message ?? "Tier added." });
      onDone();
    }
    return result;
  }, idle);

  return (
    <DialogForm action={formAction} noValidate>
      <DialogTitle>Add a tier</DialogTitle>
      <DialogDescription>It goes last in the order. You can drag it to move it.</DialogDescription>
      <EditFields>
        <TierFields state={state} />
        {formLevelError(state) && (
          <FormError role="alert">
            <Icon icon={CircleAlert} size={16} />
            {formLevelError(state)}
          </FormError>
        )}
      </EditFields>
      <DialogActions>
        <DialogClose asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton>Add tier</SubmitButton>
      </DialogActions>
    </DialogForm>
  );
}

function EditTier({ tier }: { tier: Tier }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" $variant="outline" $size="sm" aria-label={`Edit ${tier.name}`}>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <EditForm tier={tier} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while the dialog is open, so it always starts from the saved values. */
function EditForm({ tier, onDone }: { tier: Tier; onDone: () => void }) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(async (prev: ActionState<TierValues>, formData: FormData) => {
    const result = await updateTier(tier.id, prev, formData);
    if (result.status === "success") {
      toast({ title: result.message ?? "Tier saved." });
      onDone();
    }
    return result;
  }, idle);

  return (
    <DialogForm action={formAction} noValidate>
      <DialogTitle>Edit {tier.name}</DialogTitle>
      <EditFields>
        {tier.memberCount > 0 && (
          <Meta>
            A new cost applies to all {tier.memberCount} {tier.memberCount === 1 ? "member" : "members"} on this tier.
          </Meta>
        )}
        <TierFields state={state} initial={{ name: tier.name, priceCad: String(tier.priceCad) }} />
        {formLevelError(state) && (
          <FormError role="alert">
            <Icon icon={CircleAlert} size={16} />
            {formLevelError(state)}
          </FormError>
        )}
      </EditFields>
      <DialogActions>
        <DialogClose asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton>Save changes</SubmitButton>
      </DialogActions>
    </DialogForm>
  );
}

function DeleteTier({ tier }: { tier: Tier }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" $variant="danger-outline" $size="sm" aria-label={`Delete ${tier.name}`}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <DeleteForm tier={tier} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Mounted only while the dialog is open: loads who has the tier, and a failed attempt's error is gone on reopen. */
function DeleteForm({ tier }: { tier: Tier }) {
  const [members, setMembers] = useState<TierMember[] | "loading" | "failed">("loading");
  useEffect(() => {
    let current = true;
    getTierMembers(tier.id).then((result) => {
      if (current) setMembers(result.status === "success" && result.data ? result.data : "failed");
    });
    return () => {
      current = false;
    };
  }, [tier.id]);

  const [state, formAction] = useActionState(() => deleteTier(tier.id), { status: "idle" } as ActionState);
  const count = Array.isArray(members) ? members.length : tier.memberCount;

  return (
    <DialogForm action={formAction}>
      <AlertDialogTitle>Delete {tier.name}?</AlertDialogTitle>
      <AlertDialogDescription>
        {count === 0
          ? "No members have this tier. New members won’t be able to choose it."
          : `${count} ${count === 1 ? "member has" : "members have"} this tier. Deleting this tier will ensure ${
              count === 1 ? "this member continues" : "these members continue"
            } paying ${formatPrice(tier.priceCad)}, but new members won’t be able to choose this tier.`}
      </AlertDialogDescription>
      {members === "loading" && <Meta role="status">Loading members…</Meta>}
      {members === "failed" && <Meta role="status">We couldn’t load the list of members.</Meta>}
      {Array.isArray(members) && members.length > 0 && (
        <Members aria-label={`Members on ${tier.name}`}>
          {members.slice(0, LISTED_MEMBERS).map((m) => (
            <li key={m.personId}>{memberLabel(m)}</li>
          ))}
          {members.length > LISTED_MEMBERS && <li>and {members.length - LISTED_MEMBERS} more</li>}
        </Members>
      )}
      {state.status === "error" && state.message && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {state.message}
        </FormError>
      )}
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </AlertDialogCancel>
        <SubmitButton $variant="danger">Delete tier</SubmitButton>
      </AlertDialogActions>
    </DialogForm>
  );
}
