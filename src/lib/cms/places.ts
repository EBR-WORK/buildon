"use client";

/**
 * Branches — the offices and depots a lead belongs to.
 *
 * The table has existed since the leads work and nothing has ever managed it,
 * so it has sat empty: the Place dropdown on a lead had nothing to offer, the
 * presales tracker had nothing to group by, and `profiles.place_id` tied
 * nobody to anywhere.
 *
 * Writing is super admins only, which is what the policy says. Nothing here
 * checks that a second time — a filtered write returns no error and no rows,
 * so the row count is what tells us whether it happened.
 */

import { supabase } from "./supabase";
import type { Place } from "./leads";

export type { Place };

/** Every branch, inactive ones included — the admin screen shows both. */
export async function listAllPlaces(): Promise<Place[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("places")
    .select("id, name, active")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Place[];
}

export async function addPlace(name: string): Promise<Place> {
  if (!supabase) throw new Error("The database is not configured.");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("A branch needs a name.");

  const { data, error } = await supabase
    .from("places")
    .insert({ name: trimmed })
    .select("id, name, active")
    .single();

  if (error) {
    /* The one failure worth naming: a second branch with the same name is a
       mistake every time, and "duplicate key" says nothing to the person who
       just typed it. */
    if (/duplicate|unique/i.test(error.message)) {
      throw new Error(`There is already a branch called ${trimmed}.`);
    }
    throw new Error(
      /row-level security|policy/i.test(error.message)
        ? "Only a super admin can add a branch."
        : error.message,
    );
  }

  return data as Place;
}

export async function renamePlace(id: number, name: string) {
  if (!supabase) throw new Error("The database is not configured.");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("A branch needs a name.");

  const { data, error } = await supabase
    .from("places")
    .update({ name: trimmed })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That did not save. Only a super admin can rename a branch.");
  }
}

/**
 * Closed rather than deleted.
 *
 * Leads and people point at a branch, and removing the row would either take
 * them with it or leave them pointing at nothing. Closing it keeps the history
 * readable — "this lead belonged to the Pune office" stays true after Pune
 * shuts — and takes it out of the lists where somebody would pick it.
 */
export async function setPlaceActive(id: number, active: boolean) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("places")
    .update({ active })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That did not save. Only a super admin can close a branch.");
  }
}

/** How many leads and people point at each branch, so closing one is informed. */
export async function placeUsage(): Promise<Record<number, { leads: number; staff: number }>> {
  if (!supabase) return {};

  const [leads, staff] = await Promise.all([
    supabase.from("enquiries").select("place_id").not("place_id", "is", null),
    supabase.from("profiles").select("place_id").not("place_id", "is", null),
  ]);

  const usage: Record<number, { leads: number; staff: number }> = {};
  const bump = (id: number | null, key: "leads" | "staff") => {
    if (id === null) return;
    usage[id] ??= { leads: 0, staff: 0 };
    usage[id][key] += 1;
  };

  for (const row of leads.data ?? []) bump(row.place_id, "leads");
  for (const row of staff.data ?? []) bump(row.place_id, "staff");
  return usage;
}

/**
 * The branches a visitor may choose, for the enquiry form.
 *
 * Active only, and only id and name — which is every column the table has
 * besides the flag. Readable with the publishable key since 0029; before that
 * this returned 200 and an empty array, which is RLS working as written and a
 * dropdown with nothing in it.
 *
 * Returns [] rather than throwing. A branch is one field on a form, and a form
 * that will not open because a list did not load is worse than a form with one
 * question missing — the enquiry is the thing that matters, and staff can set
 * the branch afterwards as they always have.
 */
export async function listPublicBranches(): Promise<Place[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("places")
    .select("id, name, active")
    .eq("active", true)
    .order("name");

  if (error) return [];
  return (data ?? []) as Place[];
}
