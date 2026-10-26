"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Download, Ellipsis, ListFilter, Mail, Plus, Tag as TagIcon, UsersRound, X } from "lucide-react";
import { ListEmptyState, ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Table, type TableColumn, type TableSort } from "@/components/ui/Table";
import { RemovableTag } from "@/components/ui/Tag";
import { TagInput } from "@/components/ui/TagInput";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  TODAY,
  addDays,
  demoMembers,
  demoTags,
  endNotice,
  formatDate,
  fullName,
  kindLabel,
  plural,
  statusLabel,
  type Member,
  type MemberStatus,
  type Note,
  type Payment,
  type TagColor,
} from "./data";
import { MemberSheet } from "./MemberSheet";
import {
  AddMemberDialog,
  ChangeMembershipDialog,
  ConfirmDialog,
  EditDetailsDialog,
  NoteDialog,
  PaymentDialog,
  TagPeopleDialog,
  defaultEnd,
} from "./dialogs";

/* ---------- layout ---------- */

const Tools = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);

  & > :last-child {
    flex: 1;
    min-width: 0;
  }
`;

const FilterPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-8) * 3), 1fr));
  gap: var(--space-3) var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
`;

const EndsField = styled.div`
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  @media (max-width: 767px) {
    grid-column: auto;
  }
`;

const Range = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: var(--space-2);

  & > span {
    padding-bottom: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
`;

const Quick = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--space-6);
  font-size: var(--text-sm);

  & > strong {
    margin-right: var(--space-2);
    font-weight: var(--weight-medium);
  }
  & > span {
    color: var(--color-text-muted);
  }
`;

const Ends = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-sm);
`;


/* ---------- filters ---------- */

interface Filters {
  endsFrom: string;
  endsTo: string;
  first: string;
  last: string;
  email: string;
  tags: string[];
  status: "" | MemberStatus;
}

const noFilters: Filters = { endsFrom: "", endsTo: "", first: "", last: "", email: "", tags: [], status: "" };

const has = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase());

function matches(m: Member, f: Filters, q: string) {
  if (q.trim() && !has(`${fullName(m)} ${m.email} ${m.tags.join(" ")}`, q)) return false;
  if (f.first && !has(m.firstName, f.first)) return false;
  if (f.last && !has(m.lastName, f.last)) return false;
  if (f.email && !has(m.email, f.email)) return false;
  if (f.status && m.status !== f.status) return false;
  if (f.tags.length && !f.tags.every((t) => m.tags.some((x) => x.toLowerCase() === t.toLowerCase()))) return false;
  if (f.endsFrom && m.endsAt < f.endsFrom) return false;
  if (f.endsTo && m.endsAt > f.endsTo) return false;
  return true;
}

const filterCount = (f: Filters) =>
  [f.endsFrom || f.endsTo, f.first, f.last, f.email, f.status].filter(Boolean).length + f.tags.length;

function toCsv(rows: Member[]) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["First name", "Last name", "Email", "Status", "Membership", "Joined", "Membership ends", "Subscribed", "Tags"];
  const body = rows.map((m) =>
    [m.firstName, m.lastName, m.email, statusLabel[m.status], kindLabel[m.kind], m.joinedAt, m.endsAt, m.subscribed ? "Yes" : "No", m.tags.join("; ")]
      .map(cell)
      .join(","),
  );
  return [head.map(cell).join(","), ...body].join("\n");
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- page ---------- */

type DialogState =
  | { kind: "add" }
  | { kind: "gift" }
  | { kind: "note"; note?: Note }
  | { kind: "deleteNote"; note: Note }
  | { kind: "details" }
  | { kind: "membership" }
  | { kind: "payment"; payment?: Payment }
  | { kind: "deletePayment"; payment: Payment }
  | { kind: "deletePerson" }
  | { kind: "tag"; people: Member[] }
  | { kind: "tagPaste" }
  | null;

let seq = 1000;
const newId = (p: string) => `${p}${++seq}`;

export function MemberDirectory() {
  return (
    <AppToastProvider>
      <Directory />
    </AppToastProvider>
  );
}

function Directory() {
  const { toast } = useToast();
  const [members, setMembers] = React.useState<Member[]>(demoMembers);
  const [tagColors, setTagColors] = React.useState<Record<string, TagColor>>(() => Object.fromEntries(demoTags.map((t) => [t.name, t.color])));
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(noFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<TableSort>({ key: "ends", direction: "asc" });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [flashPaymentId, setFlashPaymentId] = React.useState<string | null>(null);

  const allTags = Object.keys(tagColors);
  const open = members.find((m) => m.id === openId) ?? null;
  const filtered = Boolean(q.trim()) || filterCount(filters) > 0;

  const rows = React.useMemo(() => {
    const list = members.filter((m) => matches(m, filters, q));
    const key = (m: Member) => (sort.key === "name" ? fullName(m).toLowerCase() : sort.key === "email" ? m.email.toLowerCase() : m.endsAt);
    const dir = sort.direction === "asc" ? 1 : -1;
    return list.sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));
  }, [members, filters, q, sort]);

  const chosen = members.filter((m) => selected.has(m.id));
  const target = chosen.length ? chosen : rows;

  const update = (id: string, change: (m: Member) => Member) => setMembers((list) => list.map((m) => (m.id === id ? change(m) : m)));
  const emailTaken = (email: string, except?: string) => members.some((m) => m.id !== except && m.email.toLowerCase() === email.trim().toLowerCase());
  const close = () => setDialog(null);

  function setTags(id: string, tags: string[]) {
    tags.forEach((t) => {
      if (!(t in tagColors)) setTagColors((c) => ({ ...c, [t]: undefined }));
    });
    update(id, (m) => {
      const added = tags.filter((t) => !m.tags.includes(t));
      const removed = m.tags.filter((t) => !tags.includes(t));
      const log = [
        ...added.map((t) => ({ id: newId("a"), kind: "tag" as const, title: `Tagged ${t}`, at: TODAY })),
        ...removed.map((t) => ({ id: newId("a"), kind: "tag" as const, title: `Removed tag ${t}`, at: TODAY })),
      ];
      return { ...m, tags, activity: [...log, ...m.activity] };
    });
  }

  function tagPeople(tag: string, people: Member[]) {
    const fresh = people.filter((p) => !p.tags.includes(tag));
    fresh.forEach((p) => setTags(p.id, [...p.tags, tag]));
    toast({ title: `Tagged ${plural(fresh.length, "person", "people")} ${tag}` });
  }

  function copy(text: string, message: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: message }),
      () => toast({ title: "Couldn't copy", description: text }),
    );
  }

  function step(direction: 1 | -1) {
    const i = rows.findIndex((m) => m.id === openId);
    const next = rows[i + direction];
    if (next) setOpenId(next.id);
  }

  const setFilter = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setSelected(new Set());
  };

  const columns: TableColumn<Member>[] = [
    {
      key: "select",
      width: "var(--space-7)",
      header: (
        <Checkbox
          aria-label="Select all"
          checked={rows.length > 0 && rows.every((m) => selected.has(m.id)) ? true : rows.some((m) => selected.has(m.id)) ? "indeterminate" : false}
          onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((m) => m.id)) : new Set())}
        />
      ),
      render: (m) => (
        <Checkbox
          aria-label={`Select ${fullName(m)}`}
          checked={selected.has(m.id)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onCheckedChange={(v) =>
            setSelected((s) => {
              const next = new Set(s);
              if (v === true) next.add(m.id);
              else next.delete(m.id);
              return next;
            })
          }
        />
      ),
    },
    { key: "name", header: "Name", sortKey: "name", render: (m) => fullName(m) },
    { key: "email", header: "Email", sortKey: "email", render: (m) => m.email },
    {
      key: "ends",
      header: "Membership ends",
      sortKey: "ends",
      align: "right",
      render: (m) => {
        const notice = endNotice(m.endsAt);
        return (
          <Ends>
            {formatDate(m.endsAt)}
            {notice && <Badge $variant={notice.tone}>{notice.text}</Badge>}
          </Ends>
        );
      },
    },
  ];

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.endsFrom || filters.endsTo)
    chips.push({
      key: "ends",
      label: `Ends ${filters.endsFrom && filters.endsTo ? `${formatDate(filters.endsFrom)} to ${formatDate(filters.endsTo)}` : filters.endsFrom ? `after ${formatDate(filters.endsFrom)}` : `before ${formatDate(filters.endsTo)}`}`,
      clear: () => setFilters((f) => ({ ...f, endsFrom: "", endsTo: "" })),
    });
  if (filters.first) chips.push({ key: "first", label: `First name: ${filters.first}`, clear: () => setFilter("first", "") });
  if (filters.last) chips.push({ key: "last", label: `Last name: ${filters.last}`, clear: () => setFilter("last", "") });
  if (filters.email) chips.push({ key: "email", label: `Email: ${filters.email}`, clear: () => setFilter("email", "") });
  filters.tags.forEach((t) => chips.push({ key: `tag-${t}`, label: `Tag: ${t}`, clear: () => setFilter("tags", filters.tags.filter((x) => x !== t)) }));
  if (filters.status) chips.push({ key: "status", label: statusLabel[filters.status], clear: () => setFilter("status", "") });

  const bulk = (label: string, all: boolean) => (
    <>
      <strong>{label}</strong>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => setDialog({ kind: "tag", people: target })}>
        {all ? "Tag all" : "Tag"}
        <Icon icon={TagIcon} size={16} />
      </Button>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => toast({ title: `Opens a new email to ${plural(target.length, "person", "people")}` })}>
        {all ? "Email all" : "Email"}
        <Icon icon={Mail} size={16} />
      </Button>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => download("sdc-members.csv", toCsv(target))}>
        Export CSV
        <Icon icon={Download} size={16} />
      </Button>
    </>
  );

  return (
    <ListPage>
      <ListPageHeader
        title="People"
        results={{ query: q, count: rows.length, pending: false }}
        actions={
          <>
            <Button type="button" onClick={() => setDialog({ kind: "add" })}>
              <Icon icon={Plus} size={16} />
              Add member
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" $variant="ghost" aria-label="More people actions">
                  <Icon icon={Ellipsis} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setDialog({ kind: "tagPaste" })}>
                  <Icon icon={TagIcon} size={16} />
                  Tag people by email
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => download("sdc-members.csv", toCsv(rows))}>
                  <Icon icon={Download} size={16} />
                  Export list (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Tools>
        <Button type="button" $variant={filterOpen || filterCount(filters) ? "outline" : "secondary"} aria-expanded={filterOpen} aria-controls="member-filters" onClick={() => setFilterOpen((o) => !o)}>
          <Icon icon={ListFilter} size={16} />
          Filter
          {filterCount(filters) > 0 && <Badge $variant="outline">{filterCount(filters)}</Badge>}
        </Button>
        <SearchField
          aria-label="Search by name, email or tag"
          placeholder="Search name, email or tag"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSelected(new Set());
          }}
          onSearch={setQ}
        />
      </Tools>

      {filterOpen && (
        <FilterPanel id="member-filters" role="group" aria-label="Filters">
          <EndsField>
            <Range>
              <Field label="Membership ends from">
                {(props) => <DatePicker {...props} value={filters.endsFrom} onValueChange={(v) => setFilter("endsFrom", v)} />}
              </Field>
              <span>to</span>
              <Field label="Until">{(props) => <DatePicker {...props} value={filters.endsTo} onValueChange={(v) => setFilter("endsTo", v)} />}</Field>
            </Range>
            <Quick>
              {[30, 60, 90].map((n) => (
                <Button
                  key={n}
                  type="button"
                  $variant="ghost"
                  $size="sm"
                  onClick={() => setFilters((f) => ({ ...f, endsFrom: TODAY, endsTo: addDays(TODAY, n) }))}
                >
                  Next {n} days
                </Button>
              ))}
            </Quick>
          </EndsField>
          <Field label="First name">{(props) => <Input {...props} value={filters.first} onChange={(e) => setFilter("first", e.target.value)} />}</Field>
          <Field label="Last name">{(props) => <Input {...props} value={filters.last} onChange={(e) => setFilter("last", e.target.value)} />}</Field>
          <Field label="Email">{(props) => <Input {...props} value={filters.email} onChange={(e) => setFilter("email", e.target.value)} />}</Field>
          <Field label="Tags" hint="Type a tag, then press Enter">
            {(props) => <TagInput {...props} value={filters.tags} onValueChange={(v) => setFilter("tags", v)} copy={{ tagsLabel: "Tags to filter by" }} />}
          </Field>
          <Field label="Status">
            {(props) => (
              <Select
                {...props}
                options={[{ value: "any", label: "Any" }, ...(Object.keys(statusLabel) as MemberStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))]}
                value={filters.status || "any"}
                onValueChange={(v) => setFilter("status", v === "any" ? "" : (v as MemberStatus))}
              />
            )}
          </Field>
        </FilterPanel>
      )}

      {chips.length > 0 && (
        <Chips role="group" aria-label="Active filters">
          {chips.map((c) => (
            <RemovableTag key={c.key} onRemove={c.clear}>
              {c.label}
            </RemovableTag>
          ))}
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setFilters(noFilters)}>
            <Icon icon={X} size={16} />
            Clear all
          </Button>
        </Chips>
      )}

      <Bar aria-live="polite">
        {chosen.length ? (
          <>
            {bulk(`${chosen.length} selected`, false)}
            <Button type="button" $variant="ghost" $size="sm" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </>
        ) : filtered && rows.length ? (
          bulk(plural(rows.length, "person", "people"), true)
        ) : (
          <span>{plural(rows.length, "person", "people")}</span>
        )}
      </Bar>

      <Table
        aria-label="People"
        columns={columns}
        rows={rows}
        getRowId={(m) => m.id}
        onRowClick={(m) => setOpenId(m.id)}
        sort={sort}
        onSortChange={setSort}
        empty={
          <ListEmptyState
            items="people"
            query={q}
            searchedFields="names, emails and tags"
            filtered={filterCount(filters) ? "people with these filters" : undefined}
            onClearSearch={() => setQ("")}
            onClearFilters={() => setFilters(noFilters)}
            onClearSearchAndFilters={() => {
              setQ("");
              setFilters(noFilters);
            }}
            empty={{ icon: UsersRound, title: "No one here yet", description: "Add a member, or import the people who already pay." }}
          />
        }
      />

      <MemberSheet
        member={open}
        open={Boolean(open)}
        onOpenChange={(o) => !o && setOpenId(null)}
        tagColors={tagColors}
        allTags={allTags}
        flashPaymentId={flashPaymentId}
        onStep={step}
        actions={{
          onAddNote: () => setDialog({ kind: "note" }),
          onEditNote: (note) => setDialog({ kind: "note", note }),
          onDeleteNote: (note) => setDialog({ kind: "deleteNote", note }),
          onEditDetails: () => setDialog({ kind: "details" }),
          onChangeMembership: () => setDialog({ kind: "membership" }),
          onRecordPayment: () => setDialog({ kind: "payment" }),
          onEditPayment: (payment) => setDialog({ kind: "payment", payment }),
          onGift: () => setDialog({ kind: "gift" }),
          onDelete: () => setDialog({ kind: "deletePerson" }),
          onSetTags: (tags) => open && setTags(open.id, tags),
          onCopy: copy,
        }}
      />

      {dialog?.kind === "add" && (
        <AddMemberDialog
          open
          onOpenChange={close}
          emailTaken={(e) => emailTaken(e)}
          onSave={(d) => {
            const m: Member = {
              id: newId("m"),
              firstName: d.firstName,
              lastName: d.lastName,
              email: d.email,
              status: d.kind === "paid" ? "waiting" : "member",
              kind: d.kind,
              amount: d.amount,
              joinedAt: d.joinedAt,
              endsAt: defaultEnd(d.joinedAt),
              subscribed: true,
              tags: [],
              notes: [],
              payments: [],
              activity: [{ id: newId("a"), kind: "joined", title: "Joined", at: d.joinedAt }],
              howJoined: "Added by an admin",
              referrals: [],
            };
            setMembers((list) => [m, ...list]);
            close();
            setOpenId(m.id);
            toast({ title: `Added ${d.firstName}` });
          }}
        />
      )}

      {open && dialog?.kind === "gift" && (
        <AddMemberDialog
          open
          title="Gift a membership"
          submit="Gift membership"
          onOpenChange={close}
          emailTaken={(e) => emailTaken(e)}
          onSave={(d) => {
            const recipient: Member = {
              id: newId("m"),
              firstName: d.firstName,
              lastName: d.lastName,
              email: d.email,
              status: "member",
              kind: "gifted",
              joinedAt: TODAY,
              endsAt: defaultEnd(TODAY),
              subscribed: true,
              tags: [],
              notes: [],
              payments: [],
              activity: [{ id: newId("a"), kind: "joined", title: "Joined", at: TODAY }],
              howJoined: `Gift from ${fullName(open)}`,
              referrals: [],
            };
            const payment: Payment = { id: newId("p"), amount: d.amount ?? 0, date: TODAY, method: d.method, giftFor: fullName(recipient) };
            setMembers((list) => [recipient, ...list.map((m) => (m.id === open.id ? { ...m, payments: [payment, ...m.payments] } : m))]);
            setFlashPaymentId(payment.id);
            close();
            toast({ title: `Gifted a membership to ${d.firstName}` });
          }}
        />
      )}

      {open && dialog?.kind === "note" && (
        <NoteDialog
          open
          onOpenChange={close}
          initial={dialog.note?.text}
          onSave={(text) => {
            const editing = dialog.note;
            update(open.id, (m) => ({
              ...m,
              notes: editing ? m.notes.map((n) => (n.id === editing.id ? { ...n, text } : n)) : [{ id: newId("n"), text, at: TODAY, by: "Suhanya" }, ...m.notes],
            }));
            close();
            toast({ title: editing ? "Note saved" : "Note added" });
          }}
        />
      )}

      {open && dialog?.kind === "deleteNote" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title="Delete this note?"
          description="The note is removed from this member's page. This can't be undone."
          confirm="Delete note"
          onConfirm={() => {
            update(open.id, (m) => ({ ...m, notes: m.notes.filter((n) => n.id !== dialog.note.id) }));
            close();
            toast({ title: "Note deleted" });
          }}
        />
      )}

      {open && dialog?.kind === "details" && (
        <EditDetailsDialog
          open
          onOpenChange={close}
          member={open}
          emailTaken={(e) => emailTaken(e, open.id)}
          onSave={(d) => {
            update(open.id, (m) => ({ ...m, ...d }));
            close();
            toast({ title: "Details saved" });
          }}
        />
      )}

      {open && dialog?.kind === "membership" && (
        <ChangeMembershipDialog
          open
          onOpenChange={close}
          member={open}
          onSave={(d) => {
            update(open.id, (m) => ({ ...m, kind: d.kind, amount: d.amount, endsAt: d.endsAt, status: d.endsAt < TODAY ? "ended" : m.status === "ended" ? "member" : m.status }));
            close();
            toast({ title: "Membership saved" });
          }}
        />
      )}

      {open && dialog?.kind === "payment" && (
        <PaymentDialog
          open
          onOpenChange={close}
          member={open}
          people={members}
          initial={dialog.payment ? { ...dialog.payment, note: dialog.payment.note ?? "" } : undefined}
          onDelete={() => dialog.payment && setDialog({ kind: "deletePayment", payment: dialog.payment })}
          onSave={(d) => {
            const editing = dialog.payment;
            if (editing) {
              update(open.id, (m) => ({ ...m, payments: m.payments.map((p) => (p.id === editing.id ? { ...p, amount: d.amount, date: d.date, method: d.method, note: d.note || undefined } : p)) }));
              toast({ title: "Payment saved" });
            } else {
              const forName = d.forId ? fullName(members.find((x) => x.id === d.forId) ?? open) : undefined;
              const payment: Payment = { id: newId("p"), amount: d.amount, date: d.date, method: d.method, note: d.note || undefined, giftFor: forName };
              update(open.id, (m) => ({ ...m, payments: [payment, ...m.payments], status: forName ? m.status : "member" }));
              setFlashPaymentId(payment.id);
              toast({ title: `Recorded ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(d.amount)}` });
            }
            close();
          }}
        />
      )}

      {open && dialog?.kind === "deletePayment" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title="Delete this payment?"
          description={`It's removed from ${fullName(open)}'s payments and their total. This can't be undone.`}
          confirm="Delete payment"
          onConfirm={() => {
            update(open.id, (m) => ({ ...m, payments: m.payments.filter((p) => p.id !== dialog.payment.id) }));
            close();
            toast({ title: "Payment deleted" });
          }}
        />
      )}

      {open && dialog?.kind === "deletePerson" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title={`Delete ${fullName(open)}?`}
          description="This removes them and their history from the directory. It can't be undone."
          confirm="Delete person"
          onConfirm={() => {
            setMembers((list) => list.filter((m) => m.id !== open.id));
            setOpenId(null);
            close();
            toast({ title: "Person deleted" });
          }}
        />
      )}

      {(dialog?.kind === "tag" || dialog?.kind === "tagPaste") && (
        <TagPeopleDialog
          open
          onOpenChange={close}
          count={dialog.kind === "tag" ? dialog.people.length : undefined}
          pasteEmails={dialog.kind === "tagPaste"}
          allTags={allTags}
          findByEmail={(e) => members.find((m) => m.email.toLowerCase() === e.trim().toLowerCase())}
          onSave={(tag, people) => {
            if (!(tag in tagColors)) setTagColors((c) => ({ ...c, [tag]: undefined }));
            tagPeople(tag, people ?? (dialog.kind === "tag" ? dialog.people : []));
            close();
          }}
        />
      )}
    </ListPage>
  );
}
