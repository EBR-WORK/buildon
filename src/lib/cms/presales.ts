"use client";

/**
 * The presales tracker: watching, and the one thing presales writes.
 *
 * Presales does not move a lead. The status belongs to whoever owns it,
 * because they are the one who spoke to the customer — so everything here is
 * read-only except the tasks, which are presales asking for something rather
 * than presales doing it.
 */

import { supabase } from "./supabase";
import type { Lead } from "./leads";

export type LeadTask = {
  id: number;
  enquiry_id: number;
  action: string;
  due_on: string | null;
  done: boolean;
  done_at: string | null;
  created_by: string | null;
  created_at: string;
};

export async function listTasks(): Promise<LeadTask[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lead_tasks")
    .select("*")
    /* Open first, then by when they are due — nulls last, because a task with
       no date is not more urgent than one due today. */
    .order("done", { ascending: true })
    .order("due_on", { ascending: true, nullsFirst: false })
    .limit(300);

  if (error) throw new Error(error.message);
  return (data ?? []) as LeadTask[];
}

export async function addTask(enquiryId: number, action: string, dueOn: string | null) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) throw new Error("Your session has expired. Sign in again.");

  const { data, error } = await supabase
    .from("lead_tasks")
    .insert({
      enquiry_id: enquiryId,
      action: action.trim(),
      due_on: dueOn || null,
      created_by: uid,
    })
    .select("*");

  if (error) throw new Error(error.message);
  /* A filtered insert is no error and no rows — the same shape as everywhere
     else, and the same reason for checking. */
  if (!data || data.length === 0) {
    throw new Error("That did not save. Only presales and marketing can add a task.");
  }
  return data[0] as LeadTask;
}

export async function completeTask(id: number, done: boolean) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("lead_tasks")
    .update({ done })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That did not save. This task is on a lead that is not yours.");
  }
}

/* ---------------------------------------------------------------- realtime */

/**
 * Stream changes to leads and tasks.
 *
 * Supabase applies the same policies to the stream as to a query, so presales
 * receives every assignment and a salesperson receives only their own without
 * either being asked for. The callback is handed the change; what to do with
 * it is the screen's business.
 *
 * Returns the unsubscribe. A channel left open after the screen is gone keeps
 * a socket and keeps calling into a component that no longer exists.
 */
export function watchLeads(onChange: () => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("presales-tracker")
    .on("postgres_changes", { event: "*", schema: "public", table: "enquiries" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "lead_tasks" }, onChange)
    .subscribe();

  return () => {
    void supabase?.removeChannel(channel);
  };
}

/** Whether the socket is actually connected, for the LIVE badge. */
export function watchConnection(onState: (live: boolean) => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("presales-presence")
    .subscribe((state) => {
      /* SUBSCRIBED is the only state that means the stream is flowing. The
         badge must follow it rather than being lit once and left on: a dropped
         socket with a LIVE badge above it is worse than no badge. */
      onState(state === "SUBSCRIBED");
    });

  return () => {
    void supabase?.removeChannel(channel);
  };
}

/* ------------------------------------------------------------- the tracker */

/** Only leads somebody holds. An unassigned lead is marketing's problem. */
export const assignedOnly = (leads: Lead[]) =>
  leads.filter((lead) => lead.assigned_to && !lead.archived);

export const sinceText = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
};
