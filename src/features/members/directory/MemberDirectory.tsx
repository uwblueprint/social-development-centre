"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Download, Ellipsis, ListFilter, Plus, Tag as TagIcon, UsersRound, X } from "lucide-react";
import { ListEmptyState, ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Table, type TableColumn, type TableSort } from "@/components/ui/Table";
import { RemovableTag, TagList } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import type { CreatableComboboxValue } from "@/components/ui/CreatableCombobox";
import { normalizeEmail } from "@/lib/email";
import {
  addNote,
  deleteNote,
  editNote,
  loadMember,
  removeMember,
  tagByEmails,
  tagMembers,
  unsubscribeMember,
  untagMembers,
} from "../actions";
import type { MemberDetail, MemberRow, Note, Subscription, TagSummary } from "../types";
import { addDays, endNotice, formatDay, localDay, plural } from "./dates";
import {
  AddManyDialog,
  AddMemberDialog,
  ConfirmDialog,
  MembershipEndDialog,
  NoteDialog,
  TagPeopleDialog,
  tagIdFor,
} from "./dialogs";
import { MemberSheet } from "./MemberSheet";
import { toCsv } from "./csv";

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
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: var(--space-3) var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
`;

const Quick = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: calc(var(--space-2) * -1);
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
`;

/* ---------- filters ---------- */

interface Filters {
  endsFrom: string;
  endsTo: string;
  tagId: string;
  subscription: "" | Subscription;
}

const noFilters: Filters = { endsFrom: "", endsTo: "", tagId: "", subscription: "" };

const subscriptionLabel: Record<Subscription, string> = {
  subscribed: "Subscribed",
  unsubscribed: "Unsubscribed",
  bounced: "Email bounced",
};

const nameOf = (m: { name: string | null; email: string }) => m.name ?? m.email;

function matches(m: MemberRow, f: Filters, q: string) {
  const query = q.trim().toLowerCase();
  if (query && !`${m.name ?? ""} ${m.email} ${m.tags.map((t) => t.name).join(" ")}`.toLowerCase().includes(query)) return false;
  if (f.subscription && m.subscription !== f.subscription) return false;
  if (f.tagId && !m.tags.some((t) => t.id === f.tagId)) return false;
  if (f.endsFrom && m.endsAt < f.endsFrom) return false;
  if (f.endsTo && m.endsAt > f.endsTo) return false;
  return true;
}

const filterCount = (f: Filters) => [f.endsFrom || f.endsTo, f.tagId, f.subscription].filter(Boolean).length;

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
  | { kind: "addMany" }
  | { kind: "tag"; people: MemberRow[] }
  | { kind: "tagByEmail" }
  | { kind: "note"; note?: Note }
  | { kind: "deleteNote"; note: Note }
  | { kind: "end" }
  | { kind: "unsubscribe" }
  | { kind: "remove" }
  | null;

/**
 * The Member Directory: everyone who's a member, with each one's page in a side panel. Built from
 * Shallot's design (src/app/design/member-directory/, PR #41), on real data and simplified: no payments,
 * membership types or tag colours until those exist.
 */
export function MemberDirectory({ members, tags, today }: { members: MemberRow[]; tags: TagSummary[]; today: string }) {
  const { toast } = useToast();
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(noFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<TableSort>({ key: "ends", direction: "asc" });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState<MemberDetail | null>(null);
  const [dialog, setDialog] = React.useState<DialogState>(null);

  const filtered = Boolean(q.trim()) || filterCount(filters) > 0;
  const rows = React.useMemo(() => {
    const list = members.filter((m) => matches(m, filters, q));
    const key = (m: MemberRow) => (sort.key === "name" ? nameOf(m).toLowerCase() : sort.key === "email" ? m.email : m.endsAt);
    const dir = sort.direction === "asc" ? 1 : -1;
    return list.sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));
  }, [members, filters, q, sort]);
  const chosen = members.filter((m) => selected.has(m.id));
  const target = chosen.length ? chosen : rows;
  const openRow = members.find((m) => m.id === openId);
  const memberEmails = React.useMemo(() => new Set(members.map((m) => m.email)), [members]);

  // The open member's page: loaded when the panel opens, and again after every change to it. A slow
  // load for someone who's no longer open is ignored.
  const detail = loaded && loaded.id === openId ? loaded : null;
  async function reload(id: string) {
    const next = await loadMember(id).catch(() => null);
    if (next) setLoaded(next);
    else if (next === null) toast({ title: "We couldn’t load this member. Try again." });
  }
  function openMember(id: string | null) {
    setOpenId(id);
    if (id) void reload(id);
  }

  const close = () => setDialog(null);
  const done = (message: string) => {
    close();
    toast({ title: message });
    if (openId) void reload(openId);
  };
  const failed = () => toast({ title: "Something went wrong. Try again." });

  function setFilter<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
    setSelected(new Set());
  }

  function step(direction: 1 | -1) {
    const i = rows.findIndex((m) => m.id === openId);
    const next = rows[i + direction];
    if (next) openMember(next.id);
  }

  async function addTag(choice: CreatableComboboxValue) {
    if (!openId) return;
    const tagId = await tagIdFor(choice);
    const result = tagId ? await tagMembers(tagId, [openId]).catch(() => null) : null;
    if (result?.status === "success") void reload(openId);
    else failed();
  }

  async function removeTag(tagId: string) {
    if (!openId) return;
    const result = await untagMembers(tagId, [openId]).catch(() => null);
    if (result?.status === "success") void reload(openId);
    else failed();
  }

  const columns: TableColumn<MemberRow>[] = [
    {
      key: "select",
      width: "var(--space-7)",
      header: (
        <Checkbox
          aria-label="Select all"
          checked={
            rows.length > 0 && rows.every((m) => selected.has(m.id))
              ? true
              : rows.some((m) => selected.has(m.id))
                ? "indeterminate"
                : false
          }
          onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((m) => m.id)) : new Set())}
        />
      ),
      render: (m) => (
        <Checkbox
          aria-label={`Select ${nameOf(m)}`}
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
    { key: "name", header: "Name", sortKey: "name", render: (m) => nameOf(m) },
    { key: "email", header: "Email", sortKey: "email", render: (m) => m.email },
    {
      key: "ends",
      header: "Membership ends",
      sortKey: "ends",
      align: "right",
      render: (m) => {
        const notice = endNotice(m.endsAt, today);
        return (
          <Ends>
            {formatDay(m.endsAt)}
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
      label: `Ends ${
        filters.endsFrom && filters.endsTo
          ? `${formatDay(filters.endsFrom)} to ${formatDay(filters.endsTo)}`
          : filters.endsFrom
            ? `after ${formatDay(filters.endsFrom)}`
            : `before ${formatDay(filters.endsTo)}`
      }`,
      clear: () => setFilters((f) => ({ ...f, endsFrom: "", endsTo: "" })),
    });
  if (filters.tagId)
    chips.push({
      key: "tag",
      label: `Tag: ${tags.find((t) => t.id === filters.tagId)?.name ?? "deleted tag"}`,
      clear: () => setFilter("tagId", ""),
    });
  if (filters.subscription)
    chips.push({ key: "subscription", label: subscriptionLabel[filters.subscription], clear: () => setFilter("subscription", "") });

  const bulk = (label: string, all: boolean) => (
    <>
      <strong>{label}</strong>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => setDialog({ kind: "tag", people: target })}>
        <Icon icon={TagIcon} size={16} />
        {all ? "Tag all" : "Tag"}
      </Button>
      <Button type="button" $variant="ghost" $size="sm" onClick={() => download("sdc-members.csv", toCsv(target))}>
        <Icon icon={Download} size={16} />
        Export CSV
      </Button>
    </>
  );

  return (
    <ListPage>
      <ListPageHeader
        title="Members"
        results={{ query: q, count: rows.length, pending: false }}
        actions={
          <>
            <Button type="button" onClick={() => setDialog({ kind: "add" })}>
              <Icon icon={Plus} size={16} />
              Add member
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" $variant="ghost" aria-label="More member actions">
                  <Icon icon={Ellipsis} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setDialog({ kind: "addMany" })}>
                  <Icon icon={Plus} size={16} />
                  Add members from a list
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialog({ kind: "tagByEmail" })}>
                  <Icon icon={TagIcon} size={16} />
                  Tag members by email
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
          onClick={() => setFilterOpen((o) => !o)}
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
        <FilterPanel id="member-filters" role="group" aria-label="Filters">
          <Field label="Membership ends from">
            {(props) => <DatePicker {...props} value={filters.endsFrom} onValueChange={(v) => setFilter("endsFrom", v)} />}
          </Field>
          <Field label="Membership ends by">
            {(props) => <DatePicker {...props} value={filters.endsTo} onValueChange={(v) => setFilter("endsTo", v)} />}
          </Field>
          <Quick>
            {[30, 60, 90].map((n) => (
              <Button
                key={n}
                type="button"
                $variant="ghost"
                $size="sm"
                onClick={() => setFilters((f) => ({ ...f, endsFrom: today, endsTo: addDays(today, n) }))}
              >
                Ends in the next {n} days
              </Button>
            ))}
          </Quick>
          <Field label="Tag">
            {(props) => (
              <Select
                {...props}
                options={[{ value: "any", label: "Any" }, ...tags.map((t) => ({ value: t.id, label: t.name }))]}
                value={filters.tagId || "any"}
                onValueChange={(v) => setFilter("tagId", v === "any" ? "" : v)}
              />
            )}
          </Field>
          <Field label="Email subscription">
            {(props) => (
              <Select
                {...props}
                options={[
                  { value: "any", label: "Any" },
                  ...(Object.keys(subscriptionLabel) as Subscription[]).map((s) => ({ value: s, label: subscriptionLabel[s] })),
                ]}
                value={filters.subscription || "any"}
                onValueChange={(v) => setFilter("subscription", v === "any" ? "" : (v as Subscription))}
              />
            )}
          </Field>
        </FilterPanel>
      )}

      {chips.length > 0 && (
        <TagList role="group" aria-label="Active filters">
          {chips.map((c) => (
            <RemovableTag key={c.key} onRemove={c.clear}>
              {c.label}
            </RemovableTag>
          ))}
          <Button type="button" $variant="ghost" $size="sm" onClick={() => setFilters(noFilters)}>
            <Icon icon={X} size={16} />
            Clear all
          </Button>
        </TagList>
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
          bulk(plural(rows.length, "member"), true)
        ) : (
          <span>{plural(rows.length, "member")}</span>
        )}
      </Bar>

      <Table
        aria-label="Members"
        columns={columns}
        rows={rows}
        getRowId={(m) => m.id}
        onRowClick={(m) => openMember(m.id)}
        sort={sort}
        onSortChange={setSort}
        empty={
          <ListEmptyState
            items="members"
            query={q}
            searchedFields="names, emails and tags"
            filtered={filterCount(filters) ? "members with these filters" : undefined}
            onClearSearch={() => setQ("")}
            onClearFilters={() => setFilters(noFilters)}
            onClearSearchAndFilters={() => {
              setQ("");
              setFilters(noFilters);
            }}
            empty={{ icon: UsersRound, title: "No members yet", description: "Add a member, or add many at once from a list." }}
          />
        }
      />

      <MemberSheet
        open={Boolean(openRow)}
        onOpenChange={(o) => !o && openMember(null)}
        member={detail}
        name={openRow ? nameOf(openRow) : ""}
        tags={tags}
        today={today}
        onStep={step}
        actions={{
          onAddNote: () => setDialog({ kind: "note" }),
          onEditNote: (note) => setDialog({ kind: "note", note }),
          onDeleteNote: (note) => setDialog({ kind: "deleteNote", note }),
          onChangeEnd: () => setDialog({ kind: "end" }),
          onAddTag: (choice) => choice && void addTag(choice),
          onRemoveTag: (tagId) => void removeTag(tagId),
          onUnsubscribe: () => setDialog({ kind: "unsubscribe" }),
          onRemove: () => setDialog({ kind: "remove" }),
        }}
      />

      {dialog?.kind === "add" && <AddMemberDialog open onOpenChange={close} today={today} onDone={done} />}
      {dialog?.kind === "addMany" && <AddManyDialog open onOpenChange={close} today={today} onDone={done} />}

      {(dialog?.kind === "tag" || dialog?.kind === "tagByEmail") && (
        <TagPeopleDialog
          open
          onOpenChange={close}
          count={dialog.kind === "tag" ? dialog.people.length : undefined}
          byEmail={dialog.kind === "tagByEmail"}
          tags={tags}
          isMemberEmail={(e) => memberEmails.has(normalizeEmail(e) ?? "")}
          onSave={async (tagId, emails) => {
            const result =
              dialog.kind === "tag"
                ? await tagMembers(tagId, dialog.people.map((p) => p.id)).catch(() => null)
                : await tagByEmails(tagId, emails.join("\n")).catch(() => null);
            if (result?.status !== "success") return "Something went wrong. Try again.";
            setSelected(new Set());
            done(`Tagged ${plural(result.data?.changed ?? 0, "member")}`);
          }}
        />
      )}

      {detail && dialog?.kind === "note" && (
        <NoteDialog
          open
          onOpenChange={close}
          initial={dialog.note?.body}
          onSave={async (body) => {
            const result = await (dialog.note ? editNote(detail.id, dialog.note.id, body) : addNote(detail.id, body)).catch(() => null);
            if (result?.status !== "success") return false;
            done(dialog.note ? "Note saved" : "Note added");
            return true;
          }}
        />
      )}

      {detail && dialog?.kind === "deleteNote" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title="Delete this note?"
          description="It’s removed from this member’s page."
          confirm="Delete note"
          onConfirm={async () => {
            const result = await deleteNote(detail.id, dialog.note.id).catch(() => null);
            if (result?.status === "success") done("Note deleted");
            else failed();
          }}
        />
      )}

      {detail && dialog?.kind === "end" && (
        <MembershipEndDialog
          open
          onOpenChange={close}
          personId={detail.id}
          joinedDay={localDay(detail.joinedAt)}
          endsAt={detail.endsAt}
          onDone={done}
        />
      )}

      {detail && dialog?.kind === "unsubscribe" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title={`Unsubscribe ${nameOf({ name: detail.fullName, email: detail.email })}?`}
          description="They won’t get any more emails from SDC, including ones waiting to go out. Only they can resubscribe, from the unsubscribe link in an email."
          confirm="Unsubscribe"
          onConfirm={async () => {
            const result = await unsubscribeMember(detail.id).catch(() => null);
            if (result?.status === "success") done("Unsubscribed");
            else failed();
          }}
        />
      )}

      {detail && dialog?.kind === "remove" && (
        <ConfirmDialog
          open
          onOpenChange={close}
          title={`Remove ${nameOf({ name: detail.fullName, email: detail.email })} from members?`}
          description="They leave the member list. Their tags, notes and history are kept."
          confirm="Remove from members"
          onConfirm={async () => {
            const result = await removeMember(detail.id).catch(() => null);
            if (result?.status !== "success") return failed();
            openMember(null);
            close();
            toast({ title: "Removed from members" });
          }}
        />
      )}
    </ListPage>
  );
}
