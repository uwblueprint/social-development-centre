"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ArchiveRestore, Check, CircleDollarSign, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SortableList } from "@/components/ui/SortableList";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { feesMissing, formatCount, formatMoney, isPaying, noTierRaised, paymentsIn, tierRows, type Tier } from "./data";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { RowsLoading, SplitActions, useLoadedOnce, type PaymentsView, type Recorder } from "./parts";
import { attemptText, BlockFailed, BusyButton, DialogNote, lockReason, useAttempt, useRetry, type PaymentsLab } from "./states";

/*
 * Tier management, brought over from Sophia's Settings section (defe30d, src/features/tiers/TiersSection.tsx)
 * and put next to the numbers. Same rules and the same words: whole-dollar CAD prices, a name that no other
 * tier still offered uses, archive instead of delete (people on a tier keep it and keep paying), drag to
 * reorder. On demo data here; what the real feature needs is in docs/backend/payments-insights.md.
 */

const NAME_ERROR = "Enter a name up to 60 characters";
const PRICE_ERROR = "Enter a whole dollar amount above 0";
const TAKEN_ERROR = "Another tier already has this name";

/** Six tiers at most; at six the add card goes away until one is archived. */
const MAX_TIERS = 6;

/*
 * One card per tier. The cards are SortableList rows restyled: the gap under each card lives inside its row
 * (padding-bottom), so a dragged card moves the others by exactly one card. The card itself is drawn by ::before,
 * stopping short of that gap. &&& outranks the list's own table-row hover, divider and drag styles.
 */
const Cards = styled.div`
  &&& li {
    align-items: center;
    padding: var(--space-3) var(--space-4) calc(var(--space-3) + var(--space-2)) var(--space-2);
    background: transparent;
    box-shadow: none;
    border-radius: 0;
  }
  &&& li > * {
    position: relative;
  }
  &&& li::before {
    content: "";
    position: absolute;
    inset: 0 0 var(--space-2) 0;
    background: var(--color-surface-raised);
    /* An inset shadow rather than a border, so it draws at the same weight as the tab and table lines. */
    box-shadow: inset 0 0 0 1px var(--color-border);
    border-radius: var(--radius-lg);
    transition: background-color var(--duration-fast) var(--ease-out);
  }
  &&& li::after {
    display: none;
  }
  &&& li:not([data-dragging="true"]):is(:hover, :focus-within)::before {
    background: var(--color-bg-hover);
  }
  &&& li[data-dragging="true"]::before {
    box-shadow: inset 0 0 0 1px var(--color-border), var(--shadow-md);
  }
`;

/* Archived tiers: the same card, muted, with the handle's place left empty so the names line up. */
const StaticCards = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
`;

const StaticCard = styled.li`
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4) var(--space-3) calc(var(--space-2) + 40px + var(--space-3));
  background: var(--color-surface-raised);
  box-shadow: inset 0 0 0 1px var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);

  &:is(:hover, :focus-within) {
    background: var(--color-bg-hover);
  }
`;

/* Name and price on the left; paying members, earned and the menu on the right. On a phone the numbers drop to a
   second line under the name. */
const CardFrame = styled.div`
  flex: 1;
  min-width: 0;
  container-type: inline-size;
`;

const CardBody = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) calc(var(--space-8) * 2) calc(var(--space-8) * 2) auto;
  grid-template-areas: "name members earned menu";
  align-items: center;
  column-gap: var(--space-4);

  /* Too narrow for everything on one row: the numbers go under the name, the menu stays centred on the card. */
  @container (max-width: 479px) {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    grid-template-areas:
      "name name name menu"
      "members earned . menu";
    row-gap: var(--space-2);
    column-gap: var(--space-5);
  }
`;

const NameBlock = styled.div`
  grid-area: name;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Name = styled.span`
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
  overflow-wrap: break-word;

  &[data-archived] {
    color: var(--color-text-muted);
  }
`;

const ArchivedTag = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

/* A price that differs by when people joined: a dotted underline says there's more to read on hover or focus. */
const PriceRange = styled.span`
  align-self: flex-start;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  white-space: nowrap;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  border-radius: var(--radius-sm);
  cursor: default;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/* Money not matched to anyone yet, so the tiers add up to Raised on Overview. */
const NoTier = styled.p`
  margin: var(--space-3) 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const Meta = styled.span`
  white-space: nowrap;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/* A number that says what it is: an icon, the figure and one word ("74 paying", "$232 earned"), all one colour. */
const Stat = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  & > svg {
    flex-shrink: 0;
  }
  &[data-area="members"] {
    grid-area: members;
  }
  &[data-area="earned"] {
    grid-area: earned;
  }
`;

/* "— earned" when it can't be worked out: focusable so the reason is reachable by keyboard, hover and tap. */
const Unknown = styled.span`
  border-radius: var(--radius-sm);
  cursor: default;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const MenuSlot = styled.div`
  grid-area: menu;
  align-self: center;
  display: flex;
  justify-content: flex-end;
`;

/* The last card adds a tier: same width as the cards, a dashed outline instead of a raised box. */
const AddCard = styled(Button)`
  &&& {
    width: 100%;
    /* A tier card's height: its padding, the name line, the gap and the price line. */
    height: calc(var(--space-3) * 2 + var(--text-md) * var(--leading-ui) + var(--space-1) + var(--text-sm) * var(--leading-ui));
    justify-content: center;
    padding: 0 var(--space-4);
    border-color: transparent;
    border-radius: var(--radius-lg);
    background-color: transparent;
    background-image: var(--dashed-border);
    background-size: var(--dashed-border-size);
    background-position: var(--dashed-border-position);
    background-repeat: var(--dashed-border-repeat);
    background-origin: border-box;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  &&&:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }
`;

/* A menu item that can't run right now: its label, then why, on a second line. */
const ItemText = styled.span`
  display: flex;
  flex-direction: column;
`;

const ItemReason = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
`;

/** Name and whole-dollar cost, for Add and Edit. Mounted only while its dialog is open, so it always starts fresh. */
function TierForm({
  tier,
  others,
  note,
  submitLabel,
  onSubmit,
  pl,
}: {
  pl: PaymentsLab;
  tier?: Tier;
  /** The names of the other tiers still offered. */
  others: string[];
  note?: string;
  submitLabel: string;
  onSubmit: (name: string, price: number) => void;
}) {
  const [name, setName] = React.useState(tier?.name ?? "");
  const [price, setPrice] = React.useState(tier ? String(tier.price) : "");
  const [errors, setErrors] = React.useState<{ name?: string; price?: string }>({});
  // update_tier has no "changed by someone else" check (the last save wins), so there's no clash to design; it does
  // answer "name_taken" (a field error) and "deleted" (someone deleted the tier first).
  const attempt = useAttempt({ ...pl.lab, conflict: false }, { validation: true });
  const [deleted, setDeleted] = React.useState(false);
  const locked = lockReason(pl.lab, tier ? "save changes" : "add tiers");
  // The server's own name check (Validation error): the name was taken a moment ago by someone else.
  const nameError = errors.name ?? (attempt.error === "validation" ? TAKEN_ERROR : undefined);

  function submit(event: React.FormEvent, keepMine = false) {
    event.preventDefault();
    const trimmed = name.trim();
    const found: { name?: string; price?: string } = {};
    if (!trimmed || trimmed.length > 60) found.name = NAME_ERROR;
    else if (others.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())) found.name = TAKEN_ERROR;
    const text = price.trim();
    const amount = /^\d{1,7}$/.test(text) ? Number(text) : 0;
    if (amount < 1) found.price = PRICE_ERROR;
    setErrors(found);
    if (found.name || found.price) return;
    attempt.run(() => {
      if (tier && pl.lab.is("tier-deleted") && !keepMine) return setDeleted(true);
      onSubmit(trimmed, amount);
    }, keepMine);
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle>{tier ? `Edit ${tier.name}` : "Add tier"}</DialogTitle>
      <FormBody>
        {note && <Meta>{note}</Meta>}
        <Field label="Name" required error={nameError}>
          {(props) => (
            <Input
              {...props}
              name="name"
              maxLength={60}
              autoComplete="off"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((e) => ({ ...e, name: undefined }));
                if (attempt.error === "validation") attempt.clear();
              }}
            />
          )}
        </Field>
        <Field label="Cost" required error={errors.price}>
          {(props) => (
            <Input
              {...props}
              name="priceCad"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setErrors((e) => ({ ...e, price: undefined }));
              }}
            />
          )}
        </Field>
      </FormBody>
      {deleted && tier ? (
        <DialogNote
          tone="warning"
          actions={
            <Button type="button" $variant="outline" $size="sm" onClick={(e) => submit(e, true)}>
              Restore and save
            </Button>
          }
        >
          Someone deleted {tier.name} while you were editing. Your changes are still here
        </DialogNote>
      ) : attempt.error && attempt.error !== "validation" ? (
        <DialogNote tone="danger">{attemptText(attempt.error, tier ? "save the changes" : "add the tier")}</DialogNote>
      ) : null}
      <SplitActions>
        <DialogClose asChild>
          <Button type="button" $variant="secondary" disabled={attempt.busy}>
            Cancel
          </Button>
        </DialogClose>
        {locked ? (
          <DisabledReason reason={locked}>
            <Button type="submit" disabled>
              <Icon icon={tier ? Check : Plus} />
              {submitLabel}
            </Button>
          </DisabledReason>
        ) : (
          <BusyButton type="submit" busy={attempt.busy}>
            <Icon icon={tier ? Check : Plus} />
            {submitLabel}
          </BusyButton>
        )}
      </SplitActions>
    </form>
  );
}

/** A dialog that focuses itself, never a button. Open it with `open`, or give it a trigger. */
function TierDialog({
  trigger,
  open: controlled,
  onOpenChange,
  ...form
}: { trigger?: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void } & Omit<React.ComponentProps<typeof TierForm>, "onSubmit"> & {
    onSubmit: (name: string, price: number) => void;
  }) {
  const [own, setOwn] = React.useState(false);
  const open = controlled ?? own;
  const setOpen = (next: boolean) => {
    setOwn(next);
    onOpenChange?.(next);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.target as HTMLElement).focus();
        }}
      >
        <TierForm
          {...form}
          onSubmit={(name, price) => {
            form.onSubmit(name, price);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function TiersTab({ view, record, pl, refreshing }: { view: PaymentsView; record: Recorder; pl: PaymentsLab; refreshing: boolean }) {
  const { toast } = useToast();
  const { data, setData } = view;
  const [editing, setEditing] = React.useState<string | null>(null);
  const ready = useLoadedOnce(`tiers:${view.current.from}:${view.current.to}`) && !pl.loading;
  const failure = useRetry(pl.lab.is("tiers-failed"));
  if (failure.failed) return <BlockFailed title="Couldn't load tiers" onRetry={failure.retry} />;
  if (!ready || failure.retrying) return <RowsLoading rows={4} label="Loading tiers" slow={pl.takingLonger} />;
  const locked = lockReason(pl.lab, "change tiers");
  const missingFees = feesMissing(paymentsIn(data, view.current));
  const noFee = `PayPal hasn't sent the fee for ${formatCount(missingFees)} ${missingFees === 1 ? "payment" : "payments"} yet`;

  const rows = tierRows(data, view.current);
  const unmatched = noTierRaised(data, view.current);
  const offered = rows.filter((t) => !t.archived);
  const namesExcept = (id?: string) => offered.filter((t) => t.id !== id).map((t) => t.name);

  function add(name: string, price: number) {
    setData((d) => ({ ...d, tiers: [...d.tiers, { id: `tier-${Date.now().toString(36)}`, name, price }] }));
    toast({ title: `Added ${name}` });
  }

  function edit(id: string, name: string, price: number) {
    // A new cost is for people who join from today; everyone already on the tier keeps what they pay.
    setData((d) => ({
      ...d,
      tiers: d.tiers.map((t) =>
        t.id !== id ? t : { ...t, name, price, history: price === t.price ? t.history : [...(t.history ?? []), { price: t.price, until: d.today }] },
      ),
    }));
    toast({ title: `Saved changes to ${name}` });
  }

  function archive(tier: { id: string; name: string }) {
    if (pl.lab.is("delete-failed")) {
      toast({ title: `Couldn't delete ${tier.name}`, actionLabel: "Try again", onAction: () => archive(tier) });
      return;
    }
    const set = (archivedNow: boolean) =>
      setData((d) => ({ ...d, tiers: d.tiers.map((t) => (t.id === tier.id ? { ...t, archived: archivedNow || undefined } : t)) }));
    set(true);
    record(`Deleted ${tier.name}`, `Restored ${tier.name}`, () => set(false));
  }

  // The new order is for the tiers still offered; archived ones keep their places.
  function reorder(next: { id: string }[]) {
    setData((d) => {
      const byId = new Map(d.tiers.map((t) => [t.id, t]));
      let i = 0;
      return { ...d, tiers: d.tiers.map((t) => (t.archived ? t : byId.get(next[i++].id)!)) };
    });
  }

  const editingTier = editing ? (rows.find((t) => t.id === editing) ?? null) : null;
  const archivedRows = rows.filter((t) => t.archived);

  function restore(tier: { id: string; name: string }) {
    if (pl.lab.is("delete-failed")) {
      toast({ title: `Couldn't restore ${tier.name}`, actionLabel: "Try again", onAction: () => restore(tier) });
      return;
    }
    const set = (archivedNow: boolean) =>
      setData((d) => ({ ...d, tiers: d.tiers.map((t) => (t.id === tier.id ? { ...t, archived: archivedNow || undefined } : t)) }));
    set(false);
    record(`Restored ${tier.name}`, `Deleted ${tier.name}`, () => set(true));
  }

  // Restoring counts against the six, so it is offered only while there is room.
  const full = offered.length >= MAX_TIERS;

  const menu = (tier: { id: string; name: string; archived?: boolean }) => (
    <MenuSlot>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" $variant="ghost" $size="sm" aria-label={`More options for ${tier.name}`}>
            <Icon icon={MoreHorizontal} size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(tier.id)}>
            <Icon icon={Pencil} size={16} />
            Edit
          </DropdownMenuItem>
          {tier.archived ? (
            !full && (
              <DropdownMenuItem disabled={locked !== null} onSelect={() => restore(tier)}>
                <Icon icon={ArchiveRestore} size={16} />
                <ItemText>
                  Restore
                  {locked && <ItemReason>{locked}</ItemReason>}
                </ItemText>
              </DropdownMenuItem>
            )
          ) : (
            <DropdownMenuItem $variant="danger" disabled={locked !== null} onSelect={() => archive(tier)}>
              <Icon icon={Trash2} size={16} />
              <ItemText>
                Delete
                {locked && <ItemReason>{locked}</ItemReason>}
              </ItemText>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuSlot>
  );

  const card = (tier: (typeof rows)[number], archived: boolean) => {
    const muted = archived ? "" : undefined;
    return (
      <CardFrame>
      <CardBody>
        <NameBlock>
          <Name data-archived={muted}>
            {tier.name}
            {archived && <ArchivedTag>Deleted</ArchivedTag>}
          </Name>
          {tier.priceNote ? (
            <Tooltip content={tier.priceNote}>
              <PriceRange tabIndex={0}>{tier.priceText}</PriceRange>
            </Tooltip>
          ) : (
            <Meta>{tier.priceText}</Meta>
          )}
        </NameBlock>
        <Stat data-area="members" data-archived={muted}>
          <Icon icon={Users} size={16} />
          <span>
            {formatCount(tier.people)} paying
          </span>
        </Stat>
        <Stat data-area="earned" data-archived={muted}>
          <Icon icon={CircleDollarSign} size={16} />
          {Number.isFinite(tier.raised) ? (
            <span>{formatMoney(tier.raised)} earned</span>
          ) : (
            // A PayPal fee not in yet: what the tier earned can't be worked out (never "$NaN").
            <Tooltip content={noFee}>
              <Unknown tabIndex={0} aria-label={`Earned not available. ${noFee}`}>
                — earned
              </Unknown>
            </Tooltip>
          )}
        </Stat>
        {menu(tier)}
      </CardBody>
      </CardFrame>
    );
  };

  const editingPaying = editingTier ? data.people.filter((p) => p.tierId === editingTier.id && isPaying(p)).length : 0;

  return (
    <section aria-label="Tiers" aria-busy={refreshing || undefined}>
      <TierDialog
        key={editing ?? "none"}
        open={editingTier !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        tier={editingTier ?? undefined}
        others={namesExcept(editingTier?.id)}
        note={
          editingPaying > 0
            ? `A new cost applies to new members only. The ${editingPaying} ${editingPaying === 1 ? "member" : "members"} on ${editingTier?.name ?? "this tier"} keep their current cost`
            : undefined
        }
        submitLabel="Save changes"
        pl={pl}
        onSubmit={(name, price) => editingTier && edit(editingTier.id, name, price)}
      />

      {/* Locked (offline, signed out): the same cards without drag, since a new order couldn't be saved. */}
      {offered.length > 0 && locked && (
        <StaticCards aria-label="Tiers" style={{ marginTop: 0, marginBottom: "var(--space-2)" }}>
          {offered.map((tier) => (
            <StaticCard key={tier.id} onClick={(e) => !(e.target as HTMLElement).closest("button") && setEditing(tier.id)}>
              {card(tier, false)}
            </StaticCard>
          ))}
        </StaticCards>
      )}
      <Cards>
        {offered.length > 0 && !locked && (
          <SortableList
            variant="table"
            items={offered}
            getId={(t) => t.id}
            getLabel={(t) => t.name}
            onReorder={reorder}
            onRowClick={(t) => setEditing(t.id)}
            aria-label="Tiers"
          >
            {(tier) => card(tier, false)}
          </SortableList>
        )}
      </Cards>

      {!full && locked && (
        <DisabledReason reason={locked}>
          <AddCard type="button" $variant="ghost" disabled>
            <Icon icon={Plus} size={16} />
            Add tier
          </AddCard>
        </DisabledReason>
      )}
      {!full && !locked && (
        <TierDialog
          trigger={
            <AddCard type="button" $variant="ghost">
              <Icon icon={Plus} size={16} />
              Add tier
            </AddCard>
          }
          others={namesExcept()}
          submitLabel="Add tier"
          pl={pl}
          onSubmit={add}
        />
      )}

      {archivedRows.length > 0 && (
        <StaticCards aria-label="Deleted tiers">
          {archivedRows.map((tier) => (
            <StaticCard
              key={tier.id}
              onClick={(e) => {
                if (e.currentTarget.contains(e.target as Node) && !(e.target as HTMLElement).closest("button")) setEditing(tier.id);
              }}
            >
              {card(tier, true)}
            </StaticCard>
          ))}
        </StaticCards>
      )}

      {Number.isFinite(unmatched) && unmatched > 0 && offered.length > 0 && <NoTier>{formatMoney(unmatched)} earned from payments not matched to anyone, so not in a tier</NoTier>}
    </section>
  );
}
