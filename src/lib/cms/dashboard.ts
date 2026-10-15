"use client";

/**
 * The numbers behind the landing screen.
 *
 * Every count below comes from a query the signed-in account is allowed to
 * make, which is what keeps the dashboard honest per role without a single
 * `if (role === …)` in it: a salesperson's "total leads" is their own, because
 * the policies return their own, and the same code produces both.
 *
 * It is computed in the browser from the rows themselves rather than by
 * `count` queries. Six aggregates over a few hundred rows is cheaper in one
 * round trip than six round trips, and the same rows then answer the lists
 * below them without being fetched again.
 */

import { supabase } from "./supabase";
import { LEAD_STATUSES, type Lead, type LeadStatus, type Place } from "./leads";

export type Activity = {
  id: string;
  at: string;
  text: string;
  /** Who, where the row knows. Null for a lead nobody has touched. */
  who: string | null;
};

export type Dashboard = {
  leads: Lead[];
  places: Place[];
  /** Email by user id, for the activity lines and the assign column. */
  names: Record<string, string>;
  /** Openings marked live on the careers page. */
  activeJobs: number;
  /** Applications waiting, for HR. Zero for anyone the policies refuse. */
  newApplications: number;
};

const sinceStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

export async function loadDashboard(): Promise<Dashboard> {
  if (!supabase) throw new Error("not-configured");

  /* In parallel, and each one allowed to come back empty: a role that may not
     read applications gets [] from the policy rather than an error, and the
     card simply reads zero. Refusing to render the whole screen because one
     card is not for you would be the wrong shape. */
  const [leadRows, placeRows, staffRows, careerRow, applicationRows] = await Promise.all([
    supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("places").select("id,name,active").order("name"),
    supabase.from("profiles").select("id,email"),
    supabase.from("content").select("data").eq("key", "career").maybeSingle(),
    supabase.from("applications").select("id,handled"),
  ]);

  if (leadRows.error) throw new Error(leadRows.error.message);

  const jobs = (careerRow.data?.data as { jobs?: { live?: boolean }[] } | undefined)?.jobs ?? [];

  return {
    leads: (leadRows.data ?? []) as Lead[],
    places: ((placeRows.data ?? []) as Place[]).filter((place) => place.active),
    names: Object.fromEntries(
      ((staffRows.data ?? []) as { id: string; email: string }[]).map((row) => [
        row.id,
        row.email,
      ]),
    ),
    /* `live !== false`, matching how the site reads it: an opening written
       before the flag existed has no `live` key and is shown. */
    activeJobs: jobs.filter((job) => job.live !== false).length,
    newApplications: ((applicationRows.data ?? []) as { handled: boolean }[]).filter(
      (row) => !row.handled,
    ).length,
  };
}

/* ------------------------------------------------------------- aggregates */

export const countsByStatus = (leads: Lead[]) =>
  LEAD_STATUSES.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));

export function countsByPlace(leads: Lead[], places: Place[]) {
  const rows = places.map((place) => ({
    id: place.id as number | null,
    name: place.name,
    count: leads.filter((lead) => lead.place_id === place.id).length,
  }));

  /* The ones with no branch are a real group, not a rounding error: until
     somebody is assigned, a lead belongs nowhere, and that is exactly the pile
     the dashboard exists to show. */
  const unplaced = leads.filter((lead) => lead.place_id === null).length;
  if (unplaced > 0) rows.push({ id: null, name: "No place yet", count: unplaced });

  return rows.sort((a, b) => b.count - a.count);
}

export const wonThisMonth = (leads: Lead[]) => {
  const from = sinceStartOfMonth();
  /* By when the lead arrived, not when it was won — nothing records the
     second. See the note in the activity feed below: there is no history of
     status changes yet, so this counts leads created this month that are now
     won, which is close but not the same thing. */
  return leads.filter((lead) => lead.status === "won" && lead.created_at >= from).length;
};

/**
 * What has happened lately, from what the rows actually remember.
 *
 * Three kinds of event, because three are all that leave a trace: a lead
 * arriving (created_at), a lead being handed to somebody (assigned_at and
 * assigned_by) and a note being written.
 *
 * Status changes are deliberately absent. Nothing records them — the column
 * holds the current value and no history — so "moved to Contacted" cannot be
 * shown without inventing it. Adding a lead_events table would fix that
 * properly; a feed that quietly omits the most interesting change is better
 * than one that makes it up.
 */
export function recentActivity(
  leads: Lead[],
  notes: { id: number; enquiry_id: number; author_id: string | null; body: string; created_at: string }[],
  names: Record<string, string>,
  limit = 8,
): Activity[] {
  const who = (id: string | null) => (id ? (names[id] ?? "Someone") : null);
  const leadName = (id: number) => leads.find((lead) => lead.id === id)?.name ?? "a lead";

  const events: Activity[] = [
    ...leads.map((lead) => ({
      id: `new-${lead.id}`,
      at: lead.created_at,
      text: `${lead.name} enquired${lead.product ? ` about ${lead.product}` : ""}`,
      who: null,
    })),
    ...leads
      .filter((lead) => lead.assigned_at && lead.assigned_to)
      .map((lead) => ({
        id: `assign-${lead.id}`,
        at: lead.assigned_at!,
        text: `${lead.name} assigned to ${who(lead.assigned_to) ?? "someone"}`,
        who: who(lead.assigned_by),
      })),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      at: note.created_at,
      text: `Note on ${leadName(note.enquiry_id)}: ${note.body.slice(0, 60)}${note.body.length > 60 ? "…" : ""}`,
      who: who(note.author_id),
    })),
  ];

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export async function recentNotes(limit = 20) {
  if (!supabase) return [];
  const { data } = await supabase
    .from("enquiry_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as {
    id: number;
    enquiry_id: number;
    author_id: string | null;
    body: string;
    created_at: string;
  }[];
}

export type { LeadStatus };
