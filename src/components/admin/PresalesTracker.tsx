"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addTask,
  assignedOnly,
  completeTask,
  listTasks,
  sinceText,
  watchConnection,
  watchLeads,
  type LeadTask,
} from "@/lib/cms/presales";
import {
  listLeads,
  listPlaces,
  listStaff,
  LEAD_STATUSES,
  STATUS_LABEL,
  type Lead,
  type LeadStatus,
  type Place,
  type Staff,
} from "@/lib/cms/leads";
import { allows } from "@/lib/cms/auth";
import { useAdmin } from "./AuthGate";
import { useToast } from "./Toast";

/**
 * Who is assigned where, what state it is in, and what has to happen next.
 *
 * Everything in the top table is read-only on purpose. Presales advises; the
 * status belongs to whoever owns the lead, because they are the one who spoke
 * to the customer. A tracker that could also change what it tracks would make
 * "who moved this" unanswerable.
 *
 * The bottom table is the exception and the reason this screen exists: the
 * qualification in front of the sale, which presales writes and sales ticks
 * off.
 */

const TONE: Record<LeadStatus, string> = {
  new: "bg-brand-500 text-white",
  assigned: "bg-brand-50 text-brand-600",
  contacted: "bg-surface text-ink-900",
  qualified: "bg-surface text-ink-900",
  quoted: "bg-surface text-ink-900",
  won: "bg-brand-50 text-brand-600",
  lost: "bg-surface text-ink-500",
};

const today = () => new Date().toISOString().slice(0, 10);

function dueText(due: string | null) {
  if (!due) return "No date";
  const now = today();
  if (due === now) return "Today";
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (due === tomorrow) return "Tomorrow";
  return new Date(due).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function PresalesTracker() {
  const { profile } = useAdmin();
  const { notify } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);

  const [place, setPlace] = useState<number | "all">("all");
  const [person, setPerson] = useState<string | "all">("all");
  const [state, setState] = useState<LeadStatus | "all">("all");

  const [adding, setAdding] = useState<number | null>(null);
  const [action, setAction] = useState("");
  const [due, setDue] = useState("");

  const mayWrite = allows(profile, "leads:all");

  async function refresh() {
    const [leadRows, taskRows] = await Promise.all([listLeads(), listTasks()]);
    setLeads(leadRows);
    setTasks(taskRows);
  }

  useEffect(() => {
    let alive = true;

    Promise.all([listLeads(), listTasks(), listPlaces(), listStaff()]).then(
      ([leadRows, taskRows, placeRows, staffRows]) => {
        if (!alive) return;
        setLeads(leadRows);
        setTasks(taskRows);
        setPlaces(placeRows);
        setStaff(staffRows);
        setStatus("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "";
        setError(
          /schema cache|does not exist|column/i.test(message)
            ? "The tracker tables are missing. Run supabase/migrations/0014_presales_tracker.sql."
            : message || "Could not load the tracker.",
        );
        setStatus("error");
      },
    );

    /* Two subscriptions: one for the data, one for whether the socket is up.
       The badge follows the second, because a LIVE badge over a dropped
       connection is worse than no badge at all. */
    const stopData = watchLeads(() => {
      if (alive) void refresh();
    });
    const stopState = watchConnection((connected) => {
      if (alive) setLive(connected);
    });

    return () => {
      alive = false;
      stopData();
      stopState();
    };
  }, []);

  const names = useMemo(
    () => Object.fromEntries(staff.map((p) => [p.id, p.email])),
    [staff],
  );
  const placeName = (id: number | null) => places.find((p) => p.id === id)?.name ?? "—";

  const tracked = useMemo(() => {
    return assignedOnly(leads)
      .filter((lead) => place === "all" || lead.place_id === place)
      .filter((lead) => person === "all" || lead.assigned_to === person)
      .filter((lead) => state === "all" || lead.status === state)
      .sort((a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at));
  }, [leads, place, person, state]);

  const openTasks = tasks.filter((task) => !task.done);
  const leadById = (id: number) => leads.find((lead) => lead.id === id);

  async function saveTask(enquiryId: number) {
    if (action.trim().length < 3) return;
    try {
      const saved = await addTask(enquiryId, action, due || null);
      setTasks((all) => [saved, ...all]);
      setAction("");
      setDue("");
      setAdding(null);
    } catch (e) {
      notify("Could not add that", e instanceof Error ? e.message : undefined, "danger");
    }
  }

  async function tick(task: LeadTask) {
    const before = task.done;
    setTasks((all) => all.map((t) => (t.id === task.id ? { ...t, done: !before } : t)));
    try {
      await completeTask(task.id, !before);
    } catch (e) {
      setTasks((all) => all.map((t) => (t.id === task.id ? { ...t, done: before } : t)));
      notify("Could not save that", e instanceof Error ? e.message : undefined, "danger");
    }
  }

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Assignment tracker</h1>
          <p className="mt-1.5 text-[15px] text-ink-500">
            Who is assigned where, and the state it is in. Read-only — the status belongs to
            whoever owns the lead.
          </p>
        </div>

        {/* Lit by the socket, not by hope. */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            live ? "bg-brand-50 text-brand-600" : "bg-surface text-ink-500"
          }`}
          title={live ? "Changes arrive without refreshing" : "Not connected — reload to refresh"}
        >
          <span className={`size-1.5 rounded-full ${live ? "bg-brand-500" : "bg-ink-400"}`} />
          {live ? "Live" : "Offline"}
        </span>
      </header>

      {status === "loading" && <p className="text-[15px] text-ink-500">Loading…</p>}

      {status === "error" && (
        <p className="rounded-xl border border-signal-200 bg-signal-50 p-4 text-[15px] text-ink-900">
          {error}
        </p>
      )}

      {status === "ready" && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {places.length > 0 && (
              <select
                value={place}
                onChange={(e) => setPlace(e.target.value === "all" ? "all" : Number(e.target.value))}
                aria-label="Filter by place"
                className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value="all">All places</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              aria-label="Filter by salesperson"
              className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="all">Anyone</option>
              {staff.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email}
                </option>
              ))}
            </select>

            <select
              value={state}
              onChange={(e) => setState(e.target.value as LeadStatus | "all")}
              aria-label="Filter by status"
              className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="all">Any status</option>
              {LEAD_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {STATUS_LABEL[v]}
                </option>
              ))}
            </select>
          </div>

          {/* --------------------------------------------------- tracker */}
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="border-b border-line bg-surface text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Lead</th>
                  <th className="px-3 py-2.5">Place</th>
                  <th className="px-3 py-2.5">Salesperson</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Updated</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tracked.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-ink-500">
                      Nothing assigned yet.
                    </td>
                  </tr>
                )}
                {tracked.map((lead) => (
                  <tr key={lead.id} className="hover:bg-row-hover">
                    <td className="px-3 py-2.5 font-semibold">{lead.name}</td>
                    <td className="px-3 py-2.5">{placeName(lead.place_id)}</td>
                    <td className="px-3 py-2.5">
                      {lead.assigned_to ? (names[lead.assigned_to] ?? "—") : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[lead.status]}`}>
                        {STATUS_LABEL[lead.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-ink-500">
                      {sinceText(lead.updated_at ?? lead.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {mayWrite && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdding(adding === lead.id ? null : lead.id);
                            setAction("");
                            setDue("");
                          }}
                          className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-brand-200 hover:text-brand-500"
                        >
                          + Task
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {adding !== null && (
                  <tr className="bg-brand-50/40">
                    <td colSpan={6} className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          autoFocus
                          value={action}
                          onChange={(e) => setAction(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && void saveTask(adding)}
                          placeholder="What has to happen next? e.g. Verify budget and requirement"
                          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand-500"
                        />
                        <input
                          type="date"
                          value={due}
                          min={today()}
                          onChange={(e) => setDue(e.target.value)}
                          aria-label="Due date"
                          className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() => void saveTask(adding)}
                          disabled={action.trim().length < 3}
                          className="cursor-pointer rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdding(null)}
                          className="cursor-pointer px-2 text-sm font-semibold text-ink-500 hover:text-ink-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ----------------------------------------------------- tasks */}
          <div className="mt-8">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">Qualification and follow-up</h2>
                <p className="mt-1 text-sm text-ink-500">
                  The one thing presales writes. Whoever holds the lead ticks it off.
                </p>
              </div>
              <span className="text-sm text-ink-500">{openTasks.length} open</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="border-b border-line bg-surface text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  <tr>
                    <th className="w-10 px-3 py-2.5" />
                    <th className="px-3 py-2.5">Lead</th>
                    <th className="px-3 py-2.5">Place</th>
                    <th className="px-3 py-2.5">Salesperson</th>
                    <th className="px-3 py-2.5">Next action</th>
                    <th className="px-3 py-2.5">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-ink-500">
                        No tasks yet. Add one from a row above.
                      </td>
                    </tr>
                  )}
                  {tasks.map((task) => {
                    const lead = leadById(task.enquiry_id);
                    const overdue = !task.done && task.due_on && task.due_on < today();
                    return (
                      <tr key={task.id} className={task.done ? "opacity-50" : "hover:bg-row-hover"}>
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => void tick(task)}
                            aria-label={`Mark "${task.action}" done`}
                            className="size-4 cursor-pointer accent-brand-500"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-semibold">{lead?.name ?? "—"}</td>
                        <td className="px-3 py-2.5">{placeName(lead?.place_id ?? null)}</td>
                        <td className="px-3 py-2.5">
                          {lead?.assigned_to ? (
                            (names[lead.assigned_to] ?? "—")
                          ) : (
                            <span className="text-ink-400">unassigned</span>
                          )}
                        </td>
                        <td className={`px-3 py-2.5 ${task.done ? "line-through" : ""}`}>
                          {task.action}
                        </td>
                        <td
                          className={`px-3 py-2.5 whitespace-nowrap ${
                            overdue ? "font-semibold text-signal-500" : "text-ink-500"
                          }`}
                        >
                          {dueText(task.due_on)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
