"use client";

import { useEffect, useMemo, useState } from "react";
/* The website form's own option lists, so the two cannot drift apart. */
import { contact } from "@/lib/content";
import { toDigits } from "@/lib/phone";
import {
  addLead,
  archiveLead,
  deleteLead,
  updateLead,
  assign,
  assigneesFor,
  assignMany,
  COLUMNS,
  countViews,
  DEFAULT_COLUMNS,
  downloadCsv,
  filterLeads,
  inView,
  LEAD_STATUSES,
  listLeads,
  listPlaces,
  listStaff,
  NO_FILTERS,
  PRIORITIES,
  setLeadStatus,
  setPriority,
  sourcesIn,
  STATUS_LABEL,
  toCsv,
  VIEWS,
  type ColumnKey,
  type Lead,
  type LeadFilters,
  type LeadStatus,
  type Place,
  type Priority,
  type Staff,
  type ViewKey,
} from "@/lib/cms/leads";
import { allows } from "@/lib/cms/auth";
import { useAdmin } from "./AuthGate";
import { useToast } from "./Toast";

/**
 * Every lead, as a table.
 *
 * It was a list of cards, which reads well for ten rows and badly for a
 * thousand: a table is what lets somebody scan a column rather than read every
 * entry. The row expands in place for the message and the notes, so opening
 * one does not lose the list.
 *
 * Nothing here decides who sees what. The same query runs for every role and
 * the policies return a different set, so a salesperson's "all leads" is their
 * own. What the role decides is which controls are drawn.
 */

const PAGE = 20;

const TONE: Record<LeadStatus, string> = {
  new: "bg-brand-500 text-white",
  assigned: "bg-brand-50 text-brand-600",
  contacted: "bg-surface text-ink-900",
  qualified: "bg-surface text-ink-900",
  quoted: "bg-surface text-ink-900",
  won: "bg-brand-50 text-brand-600",
  lost: "bg-surface text-ink-500",
};

const PRIORITY_TONE: Record<Priority, string> = {
  high: "bg-signal-50 text-signal-500",
  normal: "bg-surface text-ink-500",
  low: "bg-surface text-ink-400",
};

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Remembered per browser: which columns, and the last tab. */
const COLUMN_KEY = "buildon.leads.columns";

export default function LeadsTable() {
  const { profile } = useAdmin();
  const { confirm, notify } = useToast();

  const [rows, setRows] = useState<Lead[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  /* The row a notification pointed at.
     
     This was CSS alone — an id on the row and `tr:target` in globals.css —
     which works on a fresh page load and not at all here. Next navigates
     client-side, so by the time the URL carries #lead-42 the table is still
     loading and there is no such element: nothing to match, nothing to scroll
     to. The hash is read once the rows exist instead. */
  const [flash, setFlash] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [view, setView] = useState<ViewKey>("all");
  const [filters, setFilters] = useState<LeadFilters>(NO_FILTERS);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  /* Read once, as the initial value rather than in an effect: it is where
     this component starts, not something that changes later. The function form
     runs on the first render only. */
  const [columns, setColumns] = useState<ColumnKey[]>(() => {
    try {
      const saved = window.localStorage.getItem(COLUMN_KEY);
      return saved ? (JSON.parse(saved) as ColumnKey[]) : DEFAULT_COLUMNS;
    } catch {
      /* Private windows throw on read. The defaults are fine. */
      return DEFAULT_COLUMNS;
    }
  });
  const [showColumns, setShowColumns] = useState(false);
  const [adding, setAdding] = useState(false);

  const [bulkTo, setBulkTo] = useState("");
  const [bulkPriority, setBulkPriority] = useState<Priority>("normal");

  const mayAssign = allows(profile, "leads:assign");

  /* Handing out an unassigned lead is marketing's job. Taking one off the
     person already working it is not — see 0023_lock_assignment.sql, which is
     where that is actually enforced. The dropdown below only shows it, so the
     answer arrives before the attempt rather than as an error after it. */
  const mayReassign = profile?.role === "super_admin";
  /* The role, not a capability. The policy underneath is is_super_admin(), and
     inventing a "leads:delete" capability would be a second statement of the
     same rule — free to drift from the one that actually decides. */
  const mayDelete = profile?.role === "super_admin";

  /* The lead being corrected, or null. Held here rather than in the row so
     the dialog is not unmounted when the table re-sorts underneath it. */
  const [editing, setEditing] = useState<Lead | null>(null);
  const mayWork = allows(profile, "leads:work");
  const readOnly = profile?.role === "presales";

  useEffect(() => {
    let alive = true;

    Promise.all([listLeads(), listPlaces(), listStaff()]).then(
      ([leadRows, placeRows, staffRows]) => {
        if (!alive) return;
        setRows(leadRows);
        setPlaces(placeRows);
        setStaff(staffRows);
        setStatus("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "";
        setError(
          /schema cache|column|does not exist/i.test(message)
            ? "Some lead columns are missing. Run the migrations in supabase/migrations."
            : message || "Could not read the leads.",
        );
        setStatus("error");
      },
    );

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;

    const id = Number(window.location.hash.match(/^#lead-(\d+)$/)?.[1]);
    if (!Number.isFinite(id) || id === 0) return;

    /* A beat, so the row is painted before it is scrolled to. */
    const timer = window.setTimeout(() => {
      document
        .getElementById(`lead-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(id);
    }, 60);

    /* Cleared so the colour fades rather than marking the row for the rest of
       the session — the highlight answers "which one", and once the eye has
       found it a permanent colour reads as a status the row does not have. */
    const done = window.setTimeout(() => setFlash(null), 4000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(done);
    };
  }, [status]);

  function toggleColumn(key: ColumnKey) {
    setColumns((all) => {
      const next = all.includes(key) ? all.filter((c) => c !== key) : [...all, key];
      try {
        window.localStorage.setItem(COLUMN_KEY, JSON.stringify(next));
      } catch {
        /* Not worth failing over; it is a preference. */
      }
      return next;
    });
  }

  const inThisView = useMemo(
    () => rows.filter((lead) => inView(lead, view)),
    [rows, view],
  );
  const matched = useMemo(() => filterLeads(inThisView, filters), [inThisView, filters]);
  const counts = useMemo(() => countViews(rows), [rows]);
  const sources = useMemo(() => sourcesIn(rows), [rows]);
  const names = useMemo(
    () => Object.fromEntries(staff.map((person) => [person.id, person.email])),
    [staff],
  );

  /* Clamped rather than reset: filtering from page 4 to a set with two pages
     should land on the last one, not throw you back to the first. */
  const pages = Math.max(1, Math.ceil(matched.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = matched.slice(current * PAGE, current * PAGE + PAGE);

  const shows = (key: ColumnKey) => columns.includes(key);

  async function patchRow(lead: Lead, change: Partial<Lead>, run: () => Promise<void>) {
    const before = { ...lead };
    setRows((all) => all.map((r) => (r.id === lead.id ? { ...r, ...change } : r)));
    try {
      await run();
    } catch (e) {
      setRows((all) => all.map((r) => (r.id === lead.id ? before : r)));
      notify("Could not save that", e instanceof Error ? e.message : undefined, "danger");
    }
  }

  const reassign = (lead: Lead, to: string | null) =>
    patchRow(
      lead,
      {
        assigned_to: to,
        place_id: lead.place_id ?? staff.find((p) => p.id === to)?.place_id ?? null,
        status: lead.status === "new" && to ? "assigned" : lead.status,
      },
      () => assign(lead.id, to),
    );

  const move = (lead: Lead, next: LeadStatus) =>
    patchRow(lead, { status: next }, () => setLeadStatus(lead.id, next));

  const prioritise = (lead: Lead, next: Priority) =>
    patchRow(lead, { priority: next }, () => setPriority(lead.id, next));

  async function archive(lead: Lead, next: boolean) {
    if (next) {
      const ok = await confirm({
        title: `Archive the lead from ${lead.name}?`,
        body: "It leaves every list but the Archived tab. Nothing is deleted and it can come back.",
        confirmLabel: "Archive",
      });
      if (!ok) return;
    }
    await patchRow(lead, { archived: next }, () => archiveLead(lead.id, next));
    setMenu(null);
  }

  async function remove(lead: Lead) {
    const ok = await confirm({
      title: `Delete the lead from ${lead.name}?`,
      body: "This cannot be undone, and its notes and history go with it. To take it out of the lists without losing it, archive it instead.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    setMenu(null);
    try {
      await deleteLead(lead.id);
      setRows((all) => all.filter((r) => r.id !== lead.id));
      notify(`The lead from ${lead.name} was deleted.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "That did not delete.");
    }
  }

  async function bulkAssign() {
    const ids = [...picked];
    if (!bulkTo || ids.length === 0) return;

    const { done, failed } = await assignMany(ids, bulkTo, bulkPriority);
    setRows((all) =>
      all.map((r) =>
        done.includes(r.id)
          ? {
              ...r,
              assigned_to: bulkTo,
              priority: bulkPriority,
              status: r.status === "new" ? "assigned" : r.status,
            }
          : r,
      ),
    );
    setPicked(new Set());
    notify(
      failed.length === 0 ? `${done.length} assigned` : `${done.length} assigned, ${failed.length} refused`,
      failed[0]?.reason,
      failed.length === 0 ? "success" : "danger",
    );
  }

  async function bulkStatus(next: LeadStatus) {
    const ids = [...picked];
    for (const id of ids) {
      const lead = rows.find((r) => r.id === id);
      if (lead) await move(lead, next);
    }
    setPicked(new Set());
  }

  async function bulkArchive() {
    const ids = [...picked];
    const ok = await confirm({
      title: `Archive ${ids.length} lead${ids.length === 1 ? "" : "s"}?`,
      body: "They leave every list but the Archived tab. Nothing is deleted.",
      confirmLabel: "Archive",
    });
    if (!ok) return;

    for (const id of ids) {
      const lead = rows.find((r) => r.id === id);
      if (lead) await patchRow(lead, { archived: true }, () => archiveLead(id, true));
    }
    setPicked(new Set());
  }

  function exportPicked() {
    /* What is selected, or what is on screen when nothing is — exporting a
       different set from the one being looked at is the surprise to avoid. */
    const chosen = picked.size > 0 ? matched.filter((l) => picked.has(l.id)) : matched;
    downloadCsv(`buildon-leads-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(chosen, names, places));
  }

  const allShownPicked = shown.length > 0 && shown.every((lead) => picked.has(lead.id));

  return (
    <div className="p-5 sm:p-8" onClick={() => setMenu(null)}>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Leads</h1>
          <p className="mt-1.5 text-[15px] text-ink-500">
            {status === "ready"
              ? `${matched.length} shown of ${rows.length}`
              : "Enquiries from the website."}
          </p>
        </div>

        {mayAssign && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="cursor-pointer rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            + Add lead
          </button>
        )}
      </header>

      {/* ------------------------------------------------------------ tabs */}
      <nav className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {VIEWS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setView(tab.key);
              setPage(0);
            }}
            className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-semibold transition ${
              view === tab.key
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            {tab.label}
            {/* A count on every tab would be noise; on the ones that are a
                queue it is the reason to press them. */}
            {(tab.key === "unassigned" || tab.key === "archived") && counts[tab.key] > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-xs text-white">
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* --------------------------------------------------------- filters */}
      {status === "ready" && rows.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={filters.search}
            onChange={(e) => {
              setFilters((all) => ({ ...all, search: e.target.value }));
              setPage(0);
            }}
            placeholder="Search name, company, phone, email..."
            aria-label="Search leads"
            className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2 text-sm outline-none transition focus:border-brand-500 sm:max-w-xs"
          />

          {places.length > 0 && (
            <Select
              label="Place"
              value={String(filters.placeId)}
              onChange={(v) =>
                setFilters((all) => ({ ...all, placeId: v === "all" ? "all" : Number(v) }))
              }
              options={[
                { value: "all", label: "All places" },
                ...places.map((p) => ({ value: String(p.id), label: p.name })),
              ]}
            />
          )}

          {sources.length > 1 && (
            <Select
              label="Source"
              value={filters.source}
              onChange={(v) => setFilters((all) => ({ ...all, source: v }))}
              options={[
                { value: "all", label: "All sources" },
                ...sources.map((s) => ({ value: s, label: s })),
              ]}
            />
          )}

          <Select
            label="Status"
            value={filters.status}
            onChange={(v) => setFilters((all) => ({ ...all, status: v as LeadStatus | "all" }))}
            options={[
              { value: "all", label: "Any status" },
              ...LEAD_STATUSES.map((v) => ({ value: v, label: STATUS_LABEL[v] })),
            ]}
          />

          {mayAssign && (
            <Select
              label="Salesperson"
              value={filters.assignedTo}
              onChange={(v) => setFilters((all) => ({ ...all, assignedTo: v }))}
              options={[
                { value: "all", label: "Anyone" },
                { value: "none", label: "Nobody yet" },
                ...staff.map((p) => ({ value: p.id, label: p.email })),
              ]}
            />
          )}

          <Select
            label="Priority"
            value={filters.priority}
            onChange={(v) => setFilters((all) => ({ ...all, priority: v as Priority | "all" }))}
            options={[
              { value: "all", label: "Any priority" },
              ...PRIORITIES.map((v) => ({ value: v, label: v })),
            ]}
          />

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColumns((v) => !v);
              }}
              className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold transition hover:border-brand-200"
            >
              Columns
            </button>
            {showColumns && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-line bg-white p-2 shadow-lift"
              >
                {COLUMNS.map((column) => (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface"
                  >
                    <input
                      type="checkbox"
                      checked={shows(column.key)}
                      onChange={() => toggleColumn(column.key)}
                      className="size-4 cursor-pointer accent-brand-500"
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={exportPicked}
            className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold transition hover:border-brand-200"
          >
            Export
          </button>
        </div>
      )}

      {/* -------------------------------------------------------- bulk bar */}
      {mayAssign && picked.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 p-2.5">
          <span className="px-1 text-sm font-semibold">{picked.size} selected</span>

          <select
            value={bulkTo}
            onChange={(e) => setBulkTo(e.target.value)}
            aria-label="Assign the selected leads to"
            className="select-chevron cursor-pointer rounded-lg border border-line bg-white py-1.5 pl-3 pr-8 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Assign to...</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.email}
              </option>
            ))}
          </select>

          <select
            value={bulkPriority}
            onChange={(e) => setBulkPriority(e.target.value as Priority)}
            aria-label="Priority"
            className="select-chevron cursor-pointer rounded-lg border border-line bg-white py-1.5 pl-3 pr-8 text-sm capitalize outline-none focus:border-brand-500"
          >
            {PRIORITIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void bulkAssign()}
            disabled={!bulkTo}
            className="cursor-pointer rounded-full bg-brand-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Assign
          </button>

          <select
            value=""
            onChange={(e) => e.target.value && void bulkStatus(e.target.value as LeadStatus)}
            aria-label="Change status of the selected leads"
            className="select-chevron cursor-pointer rounded-lg border border-line bg-white py-1.5 pl-3 pr-8 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Change status...</option>
            {LEAD_STATUSES.map((v) => (
              <option key={v} value={v}>
                {STATUS_LABEL[v]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={exportPicked}
            className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold transition hover:border-brand-200"
          >
            Export
          </button>

          <button
            type="button"
            onClick={() => void bulkArchive()}
            className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold transition hover:border-signal-200 hover:text-signal-500"
          >
            Archive
          </button>

          <button
            type="button"
            onClick={() => setPicked(new Set())}
            className="cursor-pointer px-2 text-sm font-semibold text-ink-500 transition hover:text-ink-900"
          >
            Clear
          </button>
        </div>
      )}

      {status === "loading" && <p className="text-[15px] text-ink-500">Loading…</p>}

      {status === "error" && (
        <p className="rounded-xl border border-signal-200 bg-signal-50 p-4 text-[15px] text-ink-900">
          {error}
        </p>
      )}

      {status === "ready" && matched.length === 0 && (
        <p className="rounded-xl bg-surface p-6 text-center text-[15px] text-ink-500">
          {rows.length === 0
            ? "No leads yet. Enquiries from the website appear here."
            : "Nothing matches that."}
        </p>
      )}

      {/* ----------------------------------------------------------- table */}
      {status === "ready" && matched.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-line bg-surface text-left">
              <tr className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                {mayAssign && (
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allShownPicked}
                      onChange={(e) =>
                        setPicked((all) => {
                          const next = new Set(all);
                          for (const lead of shown) {
                            if (e.target.checked) next.add(lead.id);
                            else next.delete(lead.id);
                          }
                          return next;
                        })
                      }
                      aria-label="Select everything on this page"
                      className="size-4 cursor-pointer accent-brand-500"
                    />
                  </th>
                )}
                <th className="px-3 py-2.5">Name</th>
                {shows("contact") && <th className="px-3 py-2.5">Contact</th>}
                {shows("place") && <th className="px-3 py-2.5">Place</th>}
                {shows("source") && <th className="px-3 py-2.5">Source</th>}
                {shows("status") && <th className="px-3 py-2.5">Status</th>}
                {shows("assigned") && <th className="px-3 py-2.5">Assigned</th>}
                {shows("priority") && <th className="px-3 py-2.5">Prio</th>}
                {shows("created") && <th className="px-3 py-2.5">Created</th>}
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {shown.map((lead) => (
                <Row
                  key={lead.id}
                  lead={lead}
                  columns={columns}
                  places={places}
                  staff={staff}
                  names={names}
                  mayAssign={mayAssign}
                  mayReassign={mayReassign}
                  mayWork={mayWork && !readOnly}
                  picked={picked.has(lead.id)}
                  expanded={open === lead.id}
                  menuOpen={menu === lead.id}
                  onPick={(on) =>
                    setPicked((all) => {
                      const next = new Set(all);
                      if (on) next.add(lead.id);
                      else next.delete(lead.id);
                      return next;
                    })
                  }
                  onExpand={() => setOpen(open === lead.id ? null : lead.id)}
                  onMenu={() => setMenu(menu === lead.id ? null : lead.id)}
                  onAssign={(to) => void reassign(lead, to)}
                  onStatus={(next) => void move(lead, next)}
                  onPriority={(next) => void prioritise(lead, next)}
                  onArchive={() => void archive(lead, !lead.archived)}
                  flash={flash === lead.id}
                  /* An assigned lead belongs to the person holding it, and
                     to nobody else — see 0023_lock_assignment.sql, which is
                     where this is actually enforced. */
                  locked={Boolean(lead.assigned_to) && lead.assigned_to !== profile?.id}
                  /* Marketing and the super admin, whoever is selling it.
                     Correcting a misheard number is keeping the record true,
                     not working the lead — see 0024_owner_only.sql. */
                  mayEdit={mayAssign}
                  onEdit={() => {
                    setMenu(null);
                    setEditing(lead);
                  }}
                  mayDelete={mayDelete}
                  onDelete={() => void remove(lead)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------ pagination */}
      {status === "ready" && pages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-ink-500">
            {current * PAGE + 1}–{Math.min((current + 1) * PAGE, matched.length)} of{" "}
            {matched.length}
            {picked.size > 0 && ` · ${picked.size} selected`}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 font-semibold transition hover:border-brand-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-ink-500">
              {current + 1} / {pages}
            </span>
            <button
              type="button"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 font-semibold transition hover:border-brand-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {adding && (
        <LeadForm
          onClose={() => setAdding(false)}
          onSaved={(lead) => {
            setRows((all) => [lead, ...all]);
            setAdding(false);
            notify("Lead added", `${lead.name} is in the list.`, "success");
          }}
        />
      )}

      {editing && (
        <LeadForm
          lead={editing}
          onClose={() => setEditing(null)}
          onSaved={(lead) => {
            setRows((all) => all.map((r) => (r.id === lead.id ? lead : r)));
            setEditing(null);
            notify("Saved", `${lead.name} updated.`, "success");
          }}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- the bits */

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="select-chevron cursor-pointer rounded-xl border border-line bg-white py-2 pl-3 pr-9 text-sm capitalize outline-none transition focus:border-brand-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Row({
  lead,
  columns,
  places,
  staff,
  names,
  mayAssign,
  mayWork,
  picked,
  expanded,
  menuOpen,
  onPick,
  onExpand,
  onMenu,
  onAssign,
  mayReassign,
  onStatus,
  onPriority,
  onArchive,
  flash,
  locked,
  mayEdit,
  onEdit,
  mayDelete,
  onDelete,
}: {
  lead: Lead;
  columns: ColumnKey[];
  places: Place[];
  staff: Staff[];
  names: Record<string, string>;
  mayAssign: boolean;
  mayWork: boolean;
  picked: boolean;
  expanded: boolean;
  menuOpen: boolean;
  onPick: (on: boolean) => void;
  onExpand: () => void;
  onMenu: () => void;
  onAssign: (to: string | null) => void;
  /** May change an owner the lead already has. */
  mayReassign: boolean;
  onStatus: (status: LeadStatus) => void;
  onPriority: (priority: Priority) => void;
  onArchive: () => void;
  /** Lit because a notification pointed here. */
  flash: boolean;
  /** Somebody else is working this one. Read-only for everyone but them. */
  locked: boolean;
  mayEdit: boolean;
  onEdit: () => void;
  mayDelete: boolean;
  onDelete: () => void;
}) {
  const shows = (key: ColumnKey) => columns.includes(key);
  const place = places.find((p) => p.id === lead.place_id)?.name;
  const span = 2 + columns.length + (mayAssign ? 1 : 0);

  return (
    <>
      {/* Anchored so a notification can link straight at this row.
         `:target` in globals.css does the highlighting — no JavaScript,
         and the browser scrolls to it on its own. */}
      <tr
        id={`lead-${lead.id}`}
        className={
          flash ? "lead-found" : picked ? "bg-brand-50/40" : "hover:bg-row-hover"
        }
      >
        {mayAssign && (
          <td className="px-3 py-2.5">
            <input
              type="checkbox"
              checked={picked}
              onChange={(event) => onPick(event.target.checked)}
              aria-label={`Select the lead from ${lead.name}`}
              className="size-4 cursor-pointer accent-brand-500"
            />
          </td>
        )}

        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={onExpand}
            className="cursor-pointer text-left font-semibold hover:text-brand-500"
          >
            {lead.name}
          </button>
          {lead.company && <p className="text-xs text-ink-500">{lead.company}</p>}
        </td>

        {shows("contact") && (
          <td className="px-3 py-2.5 whitespace-nowrap">
            <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="text-brand-500">
              {lead.phone}
            </a>
          </td>
        )}
        {shows("place") && <td className="px-3 py-2.5">{place ?? "—"}</td>}
        {shows("source") && <td className="px-3 py-2.5">{lead.source ?? "—"}</td>}

        {shows("status") && (
          <td className="px-3 py-2.5">
            {mayWork ? (
              <select
                value={lead.status}
                onChange={(event) => onStatus(event.target.value as LeadStatus)}
                aria-label={`Status of the lead from ${lead.name}`}
                disabled={locked}
                title={locked ? "Assigned to somebody else. Only they can change this." : undefined}
                className={`select-chevron select-chevron-sm cursor-pointer rounded-full py-1 pl-2.5 pr-6 text-xs font-semibold outline-none disabled:cursor-default disabled:opacity-100 ${TONE[lead.status]}`}
              >
                {LEAD_STATUSES.map((value) => (
                  <option key={value} value={value} className="bg-white text-ink-900">
                    {STATUS_LABEL[value]}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[lead.status]}`}>
                {STATUS_LABEL[lead.status]}
              </span>
            )}
          </td>
        )}

        {shows("assigned") && (
          <td className="px-3 py-2.5">
            {mayAssign ? (
              <select
                value={lead.assigned_to ?? ""}
                onChange={(event) => onAssign(event.target.value || null)}
                aria-label={`Assign the lead from ${lead.name}`}
                /* Locked once somebody holds it, for everyone but a super
                   admin. The database refuses the change either way; this is
                   so the person finds out by the control being shut rather
                   than by an error after they chose a name. */
                disabled={Boolean(lead.assigned_to) && !mayReassign}
                title={
                  Boolean(lead.assigned_to) && !mayReassign
                    ? "Already assigned. Only a super admin can change this."
                    : undefined
                }
                className="select-chevron select-chevron-sm max-w-[11rem] cursor-pointer rounded-lg border border-line bg-white py-1 pl-2 pr-6 text-xs outline-none focus:border-brand-500 disabled:cursor-default disabled:border-transparent disabled:bg-transparent disabled:text-ink-700"
              >
                <option value="">—</option>
                {assigneesFor(lead, staff).map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.email}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-ink-500">
                {lead.assigned_to ? (names[lead.assigned_to] ?? "—") : "—"}
              </span>
            )}
          </td>
        )}

        {shows("priority") && (
          <td className="px-3 py-2.5">
            {mayAssign ? (
              <select
                value={lead.priority}
                onChange={(event) => onPriority(event.target.value as Priority)}
                aria-label={`Priority of the lead from ${lead.name}`}
                disabled={locked}
                title={locked ? "Assigned to somebody else. Only they can change this." : undefined}
                className={`select-chevron select-chevron-sm cursor-pointer rounded-full py-1 pl-2.5 pr-6 text-xs font-semibold capitalize outline-none disabled:cursor-default disabled:opacity-100 ${PRIORITY_TONE[lead.priority]}`}
              >
                {PRIORITIES.map((value) => (
                  <option key={value} value={value} className="bg-white text-ink-900">
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${PRIORITY_TONE[lead.priority]}`}
              >
                {lead.priority}
              </span>
            )}
          </td>
        )}

        {shows("created") && (
          <td className="px-3 py-2.5 whitespace-nowrap text-ink-500">{when(lead.created_at)}</td>
        )}

        <td className="relative px-3 py-2.5 text-right">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMenu();
            }}
            aria-label={`Actions for ${lead.name}`}
            className="cursor-pointer rounded-lg px-2 py-1 text-ink-500 transition hover:bg-surface hover:text-ink-900"
          >
            ···
          </button>

          {menuOpen && (
            <div
              onClick={(event) => event.stopPropagation()}
              className="absolute right-3 z-20 mt-1 w-44 rounded-xl border border-line bg-white p-1 text-left shadow-lift"
            >
              <MenuItem onClick={onExpand}>{expanded ? "Close" : "Open"}</MenuItem>
              <MenuItem onClick={() => window.open(`mailto:${lead.email}`, "_blank")}>
                Email them
              </MenuItem>
              {/* Only for somebody the database would actually let through:
                  marketing or a super admin, assigned or not. Offering it to
                  everyone would mean a form that fills in and then refuses to
                  save. */}
              {mayEdit && <MenuItem onClick={onEdit}>Edit</MenuItem>}
              {mayAssign && !locked && (
                <MenuItem onClick={onArchive}>
                  {lead.archived ? "Restore" : "Archive"}
                </MenuItem>
              )}
              {/* Last, and separated: the one item here that cannot be undone
                  sits apart from the ones that can, so it is not the thing a
                  hand lands on by momentum. */}
              {mayDelete && !locked && (
                <>
                  <span className="my-1 block h-px bg-line" />
                  <MenuItem onClick={onDelete} tone="danger">
                    Delete
                  </MenuItem>
                </>
              )}
            </div>
          )}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={span} className="bg-surface/60 px-4 py-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-500">
              <span>{lead.email}</span>
              {lead.product && <span>{lead.product}</span>}
              {lead.enquiry_type && <span>{lead.enquiry_type}</span>}
              {lead.page && <span>{lead.page}</span>}
            </div>
            <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink-900">
              {lead.message}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

function MenuItem({
  onClick,
  children,
  tone = "normal",
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: "normal" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-sm transition ${
        tone === "danger"
          ? "text-signal-500 hover:bg-signal-50"
          : "hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

/** Manual intake: the counter and the telephone, into the same table. */
/**
 * One dialog for adding a lead and for correcting one.
 *
 * The same fields either way, so two components would be two places to
 * fix the next thing wrong with them. `lead` is what tells them apart: absent
 * means a new row, present means that row.
 */
function LeadForm({
  lead,
  onClose,
  onSaved,
}: {
  /** The lead being corrected, or undefined when adding one. */
  lead?: Lead;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}) {
  const editing = Boolean(lead);

  const [form, setForm] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    company: lead?.company ?? "",
    /* Kept although nothing on this form sets them any more.

       Source: a lead edited here must keep the one it arrived with, or
       correcting a typo on a website enquiry would relabel it as one taken by
       hand and lose where it actually came from.

       Place: filled in the moment the lead is assigned, from the branch the
       salesperson works at — which is a better answer than asking the person
       taking the call to guess. */
    source: lead?.source ?? "Added by hand",
    /* The same two questions the website form asks, so a lead taken on the
       phone arrives in the same shape as one that came through the site —
       and the product column is filterable whichever road it came by. */
    enquiryType: lead?.enquiry_type ?? "",
    product: lead?.product ?? "",
    quantity: lead?.quantity != null ? String(lead.quantity) : "",
    message: lead?.message ?? "",
    placeId: lead?.place_id ? String(lead.place_id) : "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const placeId = form.placeId ? Number(form.placeId) : null;
      const quantity = form.quantity.trim() ? Number(form.quantity) : null;

      if (lead) {
        await updateLead(lead.id, {
          name: form.name,
          phone: form.phone,
          email: form.email,
          company: form.company,
          message: form.message,
          enquiry_type: form.enquiryType || null,
          product: form.product || null,
          quantity,
          place_id: placeId,
          source: form.source,
        });
        /* The row the table already holds, with the edits folded in — rather
           than a re-fetch, which would also discard the status and assignment
           the person can see on screen. */
        onSaved({
          ...lead,
          name: form.name,
          phone: form.phone,
          email: form.email,
          company: form.company,
          message: form.message,
          enquiry_type: form.enquiryType || null,
          product: form.product || null,
          quantity,
          place_id: placeId,
          source: form.source,
        });
        return;
      }

      const made = await addLead({ ...form, placeId, quantity });
      onSaved(made);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] outline-none transition focus:border-brand-500";

  /* The same control with room on the right for the arrow the browser draws
     inside a <select>. Shared padding put the text underneath it. */
  const selectField =
    "select-chevron w-full rounded-xl border border-line bg-white py-2.5 pl-4 pr-10 text-[15px] outline-none transition focus:border-brand-500";

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-secondary/50 p-4 backdrop-blur-sm sm:p-8">
      <button type="button" onClick={onClose} aria-label="Close" tabIndex={-1} className="fixed inset-0 cursor-default" />

      <form
        onSubmit={submit}
        className="relative z-10 my-auto w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 text-left shadow-lift sm:p-8"
      >
        <h2 className="font-display text-xl font-semibold">
          {editing ? "Edit this lead" : "Add a lead"}
        </h2>
        <p className="text-sm text-ink-500">
          {editing
            ? "Corrects the details only. Status, priority and who it belongs to are changed on the row itself."
            : "Somebody who rang, or walked in. It joins the same list as the website enquiries."}
        </p>

        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        {/* Digits only, the same as every form on the website — a lead taken
            on the phone must be as dialable as one that came through the
            site. See lib/phone.ts. */}
        <input
          required
          type="tel"
          inputMode="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: toDigits(e.target.value) })}
          className={field}
        />
        <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
        <input placeholder="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={field} />

        {/* The website form's own two questions, from the same lists — so the
            product names cannot drift apart between the site and the panel. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.enquiryType}
            onChange={(e) => setForm({ ...form, enquiryType: e.target.value })}
            aria-label="Enquiry type"
            className={`${selectField} cursor-pointer`}
          >
            <option value="">Enquiry type (optional)</option>
            {contact.enquiryTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
            aria-label="Which product"
            className={`${selectField} cursor-pointer`}
          >
            <option value="">Which product (optional)</option>
            {contact.productOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Its own box, not a line inside the message.
            
            It used to arrive as "Quantity: 3 bags" at the top of the message
            text, so correcting it here meant editing the visitor's own words
            and hoping the shape survived. 0025 gave it a column. */}
        <input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="How many bags (optional)"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className={field}
        />

        <textarea rows={3} placeholder="What did they ask for?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${field} resize-none`} />

        {error && <p className="text-sm font-medium text-signal-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={busy} className="cursor-pointer rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
            {busy ? "Saving…" : editing ? "Save changes" : "Add lead"}
          </button>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition hover:border-brand-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
