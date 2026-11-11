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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Table, type TableColumn, type TableSort } from "@/components/ui/Table";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  TODAY,
  demoMembers,
  demoTags,
  endNotice,
  formatDate,
  fullName,
  joinedTitle,
  kindLabel,
  plural,
  statusLabel,
  type Member,
  type MemberStatus,
  type Payment,
  type TagColor,
} from "./data";
import { MemberSheet } from "./MemberSheet";
import { TagPicker } from "./TagPicker";
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
`;

/* One added filter: its labelled control, with a × level with the label. */
const FilterSlot = styled.div`
  position: relative;
  min-width: 0;
`;

/* Add filter sits in the next grid cell, level with the fields rather than their labels. */
const AddFilterCell = styled.div`
  align-self: end;
`;

const RemoveFilter = styled(Button)`
  &&& {
    position: absolute;
    top: calc(var(--space-1) * -0.5);
    right: 0;
    width: var(--space-5);
    height: var(--space-5);
    padding: 0;
  }
`;

/* A name with the tags that matched the search, so a tag search shows why each row is there. */
const NameCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
`;

/* The count or bulk actions on the left, Clear all on the right. */
const Results = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const Ends = styled.span`
  font-variant-numeric: tabular-nums;
`;

/* The tag filter: label, then the picker. 6px gap, like Field. */
const TagFilter = styled.div`
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-1) * 1.5);
`;

/*
 * The table's select checkboxes: a 16px box, centred in the row. The ::after keeps the pointer target 24px
 * (WCAG 2.5.8) inside the cell's clip box, which the 24px height makes room for.
 */
const SelectBox = styled.span`
  display: flex;
  align-items: center;
  height: var(--space-5);

  & > button[role="checkbox"] {
    position: relative;
    width: var(--space-4);
    height: var(--space-4);
  }
  & > button[role="checkbox"]::after {
    content: "";
    position: absolute;
    inset: calc(var(--space-1) * -1);
  }
`;

/* The Flags column: membership ending soon or ended. */
const Flags = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;


/* ---------- filters ---------- */

interface Filters {
  /** Membership ends on or before this date. */
  ends: string;
  first: string;
  last: string;
  email: string;
  tags: string[];
  status: "" | MemberStatus;
}

type FilterKey = keyof Filters;

/** What the Filter menu offers, in menu order. */
const filterLabels: Record<FilterKey, string> = {
  first: "First name",
  last: "Last name",
  email: "Email",
  status: "Status",
  ends: "Membership ends",
  tags: "Has tags",
};

const noFilters: Filters = { ends: "", first: "", last: "", email: "", tags: [], status: "" };

const has = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase());

function matches(m: Member, f: Filters, q: string) {
  if (q.trim() && !has(`${fullName(m)} ${m.email} ${m.tags.join(" ")}`, q)) return false;
  if (f.first && !has(m.firstName, f.first)) return false;
  if (f.last && !has(m.lastName, f.last)) return false;
  if (f.email && !has(m.email, f.email)) return false;
  if (f.status && m.status !== f.status) return false;
  if (f.tags.length && !f.tags.every((t) => m.tags.some((x) => x.toLowerCase() === t.toLowerCase()))) return false;
  if (f.ends && m.endsAt > f.ends) return false;
  return true;
}

const filterCount = (f: Filters) =>
  [f.ends, f.first, f.last, f.email, f.status].filter(Boolean).length + f.tags.length;

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
  | { kind: "note" }
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
  /** The filters on screen, in the order they were added. One can be here with nothing entered yet. */
  const [added, setAdded] = React.useState<FilterKey[]>([]);
  /** The filter row is showing. Hiding it keeps the filters applied; the Filter button's count shows them. */
  const [filterOpen, setFilterOpen] = React.useState(false);
  const addFilterButton = React.useRef<HTMLButtonElement>(null);
  const filterPanel = React.useRef<HTMLDivElement>(null);
  const justAdded = React.useRef<FilterKey | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<TableSort>({ key: "ends", direction: "asc" });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<DialogState>(null);

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

  /** Adds every tag in one go per person, so each person's tags are only set once. */
  function tagPeople(tags: string[], people: Member[]) {
    let changed = 0;
    people.forEach((p) => {
      const missing = tags.filter((t) => !p.tags.includes(t));
      if (!missing.length) return;
      changed++;
      setTags(p.id, [...p.tags, ...missing]);
    });
    toast({ title: `Tagged ${plural(changed, "person", "people")} ${tags.join(", ")}` });
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

  function addFilter(key: FilterKey) {
    justAdded.current = key;
    setAdded((list) => [...list, key]);
  }

  function removeFilter(key: FilterKey) {
    setAdded((list) => list.filter((k) => k !== key));
    setFilter(key, noFilters[key]);
    addFilterButton.current?.focus();
  }

  function clearFilters() {
    setAdded([]);
    setFilters(noFilters);
    setSelected(new Set());
    addFilterButton.current?.focus();
  }

  const filterControl: Record<FilterKey, React.ReactNode> = {
    first: <Field label="First name">{(props) => <Input {...props} value={filters.first} onChange={(e) => setFilter("first", e.target.value)} />}</Field>,
    last: <Field label="Last name">{(props) => <Input {...props} value={filters.last} onChange={(e) => setFilter("last", e.target.value)} />}</Field>,
    email: <Field label="Email">{(props) => <Input {...props} value={filters.email} onChange={(e) => setFilter("email", e.target.value)} />}</Field>,
    status: (
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
    ),
    ends: <Field label="Membership ends">{(props) => <DatePicker {...props} value={filters.ends} onValueChange={(v) => setFilter("ends", v)} />}</Field>,
    tags: (
      <TagFilter>
        <Label id="filter-tags">Has tags</Label>
        <TagPicker labelledBy="filter-tags" label="Has tags" value={filters.tags} options={allTags} colors={tagColors} onValueChange={(tags) => setFilter("tags", tags)} />
      </TagFilter>
    ),
  };

  const columns: TableColumn<Member>[] = [
    {
      key: "select",
      width: "var(--space-7)",
      header: (
        <SelectBox>
          <Checkbox
            aria-label="Select all"
            checked={rows.length > 0 && rows.every((m) => selected.has(m.id)) ? true : rows.some((m) => selected.has(m.id)) ? "indeterminate" : false}
            onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((m) => m.id)) : new Set())}
          />
        </SelectBox>
      ),
      render: (m) => (
        <SelectBox>
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
        </SelectBox>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortKey: "name",
      render: (m) => {
        const needle = q.trim().toLowerCase();
        const hits = needle ? m.tags.filter((t) => t.toLowerCase().includes(needle)) : [];
        return (
          <NameCell>
            {fullName(m)}
            {hits.map((t) => (
              <Badge key={t} $category={tagColors[t]}>
                {t}
              </Badge>
            ))}
          </NameCell>
        );
      },
    },
    { key: "email", header: "Email", sortKey: "email", render: (m) => m.email },
    {
      key: "flags",
      header: "Flags",
      render: (m) => {
        const notice = endNotice(m.endsAt);
        return (
          <Flags>
            {notice && <Badge $variant={notice.tone}>{notice.text}</Badge>}
          </Flags>
        );
      },
    },
    {
      key: "ends",
      header: "Membership ends",
      sortKey: "ends",
      align: "right",
      render: (m) => <Ends>{formatDate(m.endsAt)}</Ends>,
    },
  ];

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
        <Button
          type="button"
          $variant={filterOpen || filterCount(filters) ? "outline" : "secondary"}
          aria-expanded={filterOpen}
          aria-controls="member-filters"
          onClick={() => {
            const opening = !filterOpen;
            setFilterOpen(opening);
            /* Opening goes straight to Add filter, so the next Enter or click opens the list. */
            if (opening) requestAnimationFrame(() => addFilterButton.current?.focus());
          }}
        >
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
        <FilterPanel id="member-filters" ref={filterPanel} role="group" aria-label="Filters">
          {added.map((key) => (
            <FilterSlot key={key} data-filter={key}>
              {filterControl[key]}
              <RemoveFilter type="button" $variant="ghost" aria-label={`Remove ${filterLabels[key]} filter`} onClick={() => removeFilter(key)}>
                <Icon icon={X} size={14} />
              </RemoveFilter>
            </FilterSlot>
          ))}
          <AddFilterCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button ref={addFilterButton} type="button" $variant="secondary">
                  <Icon icon={Plus} size={16} />
                  Add filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                onCloseAutoFocus={(e) => {
                  if (!justAdded.current) return;
                  /* Go straight to the new filter's control, so one click is enough to start typing. */
                  e.preventDefault();
                  const control = filterPanel.current?.querySelector<HTMLElement>(`[data-filter="${justAdded.current}"] :is(input:not([type="hidden"]), [role="combobox"])`);
                  control?.focus();
                  justAdded.current = null;
                }}
              >
                {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
                  <DropdownMenuCheckboxItem key={key} checked={added.includes(key)} onCheckedChange={(on) => (on ? addFilter(key) : removeFilter(key))}>
                    {filterLabels[key]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </AddFilterCell>
        </FilterPanel>
      )}

      <Results>
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
        {added.length > 0 && (
          <Button type="button" $variant="ghost" $size="sm" onClick={clearFilters}>
            <Icon icon={X} size={16} />
            Clear all
          </Button>
        )}
      </Results>

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
            onClearFilters={clearFilters}
            onClearSearchAndFilters={() => {
              setQ("");
              clearFilters();
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
        onStep={step}
        actions={{
          onEditNote: () => setDialog({ kind: "note" }),
          onEditDetails: () => setDialog({ kind: "details" }),
          onChangeMembership: () => setDialog({ kind: "membership" }),
          onRecordPayment: () => setDialog({ kind: "payment" }),
          onEditPayment: (payment) => setDialog({ kind: "payment", payment }),
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
              payments: [],
              activity: [{ id: newId("a"), kind: "joined", title: joinedTitle("Added by an admin"), at: d.joinedAt }],
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

      {open && dialog?.kind === "note" && (
        <NoteDialog
          open
          onOpenChange={close}
          initial={open.note?.text}
          onSave={(text) => {
            update(open.id, (m) => ({ ...m, note: text ? { text, updatedAt: TODAY, by: "Suhanya" } : undefined }));
            close();
            toast({ title: text ? "Note saved" : "Note cleared" });
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
          tagColors={tagColors}
          findByEmail={(e) => members.find((m) => m.email.toLowerCase() === e.trim().toLowerCase())}
          onSave={(tags, people) => {
            tagPeople(tags, people ?? (dialog.kind === "tag" ? dialog.people : []));
            close();
          }}
        />
      )}
    </ListPage>
  );
}
