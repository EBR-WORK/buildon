"use client";

/**
 * Asking for a panel account, and answering.
 *
 * Both ends live here: the login screen writes a request with the publishable
 * key, and the Team screen reads and decides them. The policies in
 * 0011_access_requests.sql are what make that safe — anyone may insert, only a
 * super admin may read back, so the form cannot be turned into a way to list
 * who has asked.
 */

import { supabase } from "./supabase";
import type { AdminRole } from "./roles";

export type AccessRequest = {
  id: number;
  created_at: string;
  email: string;
  name: string;
  requested_role: string;
  note: string | null;
  status: "pending" | "approved" | "declined";
  decided_at: string | null;
};

/**
 * Ask for an account.
 *
 * Resolves the same way whether or not the address already has one, and
 * whether or not a request is already open for it. A form that answers "you
 * already have an account" is a way to find out who the staff are, one guess
 * at a time — the same reason the password reset form says nothing.
 */
export async function requestAccess(entry: {
  email: string;
  name: string;
  role: AdminRole;
  note?: string;
}) {
  if (!supabase) throw new Error("The database is not configured.");

  const { error } = await supabase.from("access_requests").insert({
    email: entry.email.trim().toLowerCase(),
    name: entry.name.trim(),
    requested_role: entry.role,
    note: entry.note?.trim() || null,
  });

  if (!error) return;

  /* The unique index on a pending request per address. Not an error worth
     showing: from the asker's side, "I already asked" and "asked just now"
     are the same outcome. */
  if (/duplicate key|unique constraint/i.test(error.message)) return;

  if (/rate|limit|too many/i.test(error.message)) {
    throw new Error("Too many requests just now. Wait a minute and try again.");
  }
  throw new Error(error.message);
}

/* ------------------------------------------------------------------ admin */

export async function listAccessRequests(): Promise<AccessRequest[]> {
  if (!supabase) throw new Error("not-configured");

  const { data, error } = await supabase
    .from("access_requests")
    .select("*")
    /* Pending first, then newest: this list is opened to answer something. */
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []) as AccessRequest[];
}

/**
 * Mark one decided.
 *
 * Deliberately does not create the account — approving is two separate things,
 * and the panel does them in order: make the account (which can fail, and
 * returns a password somebody has to be given), then record the decision. A
 * request marked approved for an account that was never made is worse than
 * one still showing as pending.
 */
export async function decideAccessRequest(id: number, status: "approved" | "declined") {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("access_requests")
    .update({ status })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  /* A filtered update is no error and no rows — see enquiries.ts. */
  if (!data || data.length === 0) {
    throw new Error("That did not save. Only a super admin can decide a request.");
  }
}
