"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  countsByPlace,
  countsByStatus,
  loadDashboard,
  recentActivity,
  recentNotes,
  wonThisMonth,
  type Dashboard as Data,
} from "@/lib/cms/dashboard";
import { STATUS_LABEL } from "@/lib/cms/leads";
import { allows } from "@/lib/cms/auth";
import { describeRole, panelsFor } from "@/lib/cms/roles";
import { useAdmin } from "./AuthGate";

/**
 * The landing screen, which is a different screen per role without being
 * written twice.
 *
 * Every number comes from a query the signed-in account was allowed to make,
 * so the policies do the filtering: a salesperson's "total leads" is their
 * own, marketing's is everybody's, and the same component renders both. What
 * the role decides here is only which cards are worth drawing — a content
 * editor has no use for a pipeline, and showing one full of zeros would be
 * worse than leaving it out.
 */

const card =
  "rounded-2xl border border-line bg-white p-5 transition hover:border-brand-200";

function Stat({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
}) {
  const body = (
    <>
      <p className="font-display text-3xl font-semibold tabular-nums sm:text-4xl">{value}</p>
      <p className="mt-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
      {hint && <p className="mt-1 text-sm text-ink-500">{hint}</p>}
    </>
  );

  /* A figure that leads somewhere is a link; one that does not is a div. A
     card that looks pressable and is not is the more annoying of the two. */
  return href ? (
    <Link href={href} className={`${card} block hover:-translate-y-0.5 hover:shadow-card`}>
      {body}
    </Link>
  ) : (
    <div className={card}>{body}</div>
  );
}

function Bars({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { key: string; name: string; count: number }[];
  total: number;
}) {
  return (
    <section className={card}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate text-ink-500">{row.name}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
              {/* Against the largest row, not the total: with six statuses the
                  share of the whole is always small, and every bar ends up a
                  stub that compares nothing. */}
              <span
                className="block h-full rounded-full bg-brand-500"
                style={{ width: `${total > 0 ? Math.round((row.count / total) * 100) : 0}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right font-semibold tabular-nums">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Dashboard() {
  const { profile, email } = useAdmin();
  const [data, setData] = useState<Data | null>(null);
  const [notes, setNotes] = useState<Awaited<ReturnType<typeof recentNotes>>>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [place, setPlace] = useState<number | "all">("all");

  const seesLeads = allows(profile, "leads:mine") || allows(profile, "leads:all");
  const seesJobs = allows(profile, "jobs");

  useEffect(() => {
    let alive = true;

    Promise.all([loadDashboard(), recentNotes()]).then(
      ([dashboard, noteRows]) => {
        if (!alive) return;
        setData(dashboard);
        setNotes(noteRows);
        setStatus("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "";
        setError(
          /schema cache|does not exist/i.test(message)
            ? "Some tables are missing. Run the migrations in supabase/migrations."
            : message === "not-configured"
              ? "The database is not configured."
              : message || "Could not load the dashboard.",
        );
        setStatus("error");
      },
    );

    return () => {
      alive = false;
    };
  }, []);

  /* The place filter applies to everything below the cards, which is why it
     sits in the header rather than on one card. */
  const leads = useMemo(() => {
    if (!data) return [];
    return place === "all" ? data.leads : data.leads.filter((lead) => lead.place_id === place);
  }, [data, place]);

  const byStatus = useMemo(() => countsByStatus(leads), [leads]);
  const byPlace = useMemo(
    () => (data ? countsByPlace(data.leads, data.places) : []),
    [data],
  );
  const activity = useMemo(
    () => (data ? recentActivity(leads, notes, data.names) : []),
    [data, leads, notes],
  );

  const unassigned = leads.filter((lead) => !lead.assigned_to).length;
  const biggestPlace = Math.max(1, ...byPlace.map((row) => row.count));
  const biggestStatus = Math.max(1, ...byStatus.map((row) => row.count));

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {describeRole(profile?.role)}
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-500">{email}</p>
        </div>

        {/* Only where there is a choice to make, AND something to make it on.
        
            One branch, or none, is not a filter — it is a dropdown that always
            says the same thing. Neither is a branch filter on a dashboard with
            no leads on it: a content editor's panel is pages and articles, and
            the control sat in their corner doing nothing whatever they picked.
            It filters the lead figures, so it belongs to whoever has them. */}
        {seesLeads && data && data.places.length > 1 && (
          <select
            value={place}
            onChange={(event) =>
              setPlace(event.target.value === "all" ? "all" : Number(event.target.value))
            }
            aria-label="Filter by place"
            className="cursor-pointer rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-brand-500"
          >
            <option value="all">All places</option>
            {data.places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </header>

      {status === "loading" && <p className="text-[15px] text-ink-500">Loading…</p>}

      {status === "error" && (
        <p className="rounded-xl border border-signal-200 bg-signal-50 p-4 text-[15px] text-ink-900">
          {error}
        </p>
      )}

      {status === "ready" && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {seesLeads && (
              <>
                <Stat
                  label={allows(profile, "leads:all") ? "Total leads" : "Your leads"}
                  value={leads.length}
                  href="/admin/leads"
                />
                <Stat
                  label="Unassigned"
                  value={unassigned}
                  href="/admin/leads"
                  hint={unassigned > 0 ? "Waiting for an owner" : undefined}
                />
                <Stat label="Won this month" value={wonThisMonth(leads)} />
              </>
            )}

            {seesJobs && (
              <>
                <Stat label="Active jobs" value={data.activeJobs} href="/admin/career" />
                <Stat
                  label="New applications"
                  value={data.newApplications}
                  href="/admin/applications"
                />
              </>
            )}

            {/* A content editor has no figures of their own: nothing counts
                edits, and a card reading "6 pages" is a fact they can see from
                the menu. They get the panels instead. */}
            {!seesLeads && !seesJobs &&
              panelsFor(profile?.role).map((panel) => (
                <Stat key={panel.href} label={panel.label} value="—" href={panel.href} hint={panel.note} />
              ))}
          </div>

          {seesLeads && (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {byPlace.length > 0 && (
                <Bars
                  title="Leads by place"
                  total={biggestPlace}
                  rows={byPlace.map((row) => ({
                    key: String(row.id ?? "none"),
                    name: row.name,
                    count: row.count,
                  }))}
                />
              )}

              <Bars
                title="Pipeline"
                total={biggestStatus}
                rows={byStatus.map((row) => ({
                  key: row.status,
                  name: STATUS_LABEL[row.status],
                  count: row.count,
                }))}
              />

              <section className={card}>
                <h2 className="font-display text-lg font-semibold">Recent activity</h2>
                {activity.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-500">Nothing yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {activity.map((event) => (
                      <li key={event.id} className="text-sm leading-relaxed">
                        <span className="text-ink-900">{event.text}</span>
                        <span className="block text-xs text-ink-500">
                          {event.who ? `${event.who} · ` : ""}
                          {new Date(event.at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
