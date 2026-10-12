"use client";

/**
 * Enquiries, both ends: the public form writes one, the admin panel reads them.
 *
 * The write goes straight from the browser to Postgres with the publishable
 * key, which is what makes it portable — there is no server in this project,
 * and the previous two routes both belonged to someone else. A `mailto:` link
 * hands the message back to the visitor and asks them to send it; Netlify
 * Forms works only while the site is on Netlify. Moving the site to another
 * host silently breaks the second one, with nothing in the build to say so.
 *
 * What stops the table filling with rubbish is not this file. Anything here
 * can be skipped by anyone who opens devtools and calls Supabase directly, so
 * the real limits are the length checks in the insert policy — see
 * 0003_enquiries.sql. The checks below exist to give a person a sensible error
 * before they press send.
 */

import { supabase } from "./supabase";

export type Enquiry = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  company: string | null;
  enquiry_type: string | null;
  source: string | null;
  page: string | null;
  handled: boolean;
  handled_at: string | null;
  note: string | null;
};

export type NewEnquiry = {
  name: string;
  email: string;
  phone: string;
  message: string;
  company?: string;
  enquiryType?: string;
  source?: string;
  page?: string;
};

/** Empty strings become null: a column that means "not asked" should not hold "". */
const orNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Record an enquiry.
 *
 * Throws on failure so the form can fall back to a mail draft rather than
 * telling someone their message was received when it was not.
 */
export async function submitEnquiry(entry: NewEnquiry) {
  if (!supabase) throw new Error("not-configured");

  const { error } = await supabase.from("enquiries").insert({
    name: entry.name.trim(),
    email: entry.email.trim(),
    phone: entry.phone.trim(),
    message: entry.message.trim(),
    company: orNull(entry.company),
    enquiry_type: orNull(entry.enquiryType),
    source: orNull(entry.source),
    page: orNull(entry.page),
  });

  if (!error) return;

  /* A policy refusal means the row failed the length checks — which the form
     checks first, so reaching this is a bug rather than a typo. It is still
     thrown, because the visitor's message must not be lost either way. */
  throw new Error(error.message);
}

/* ------------------------------------------------------------------ admin */

export async function listEnquiries(): Promise<Enquiry[]> {
  /* Thrown, not an empty list. A screen that cannot reach the database and one
     with no enquiries in it look identical otherwise, and "No enquiries yet"
     is a bad thing to tell somebody whose leads are simply unreachable. */
  if (!supabase) throw new Error("not-configured");

  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    /* Unanswered first, then newest. Opening this list is almost always the
       question "what have we not replied to", and sorting by date alone buries
       that under everything already dealt with. */
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as Enquiry[];
}

/**
 * Mark one dealt with, or put it back. The trigger stamps who and when.
 *
 * The returned rows are counted, not just the error. An update that row level
 * security filters out is not an error — it is a success that changed nothing,
 * so without this an editor whose access had been revoked would watch the
 * button tick over and find it untouched on the next reload.
 */
export async function setHandled(id: number, handled: boolean) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("enquiries")
    .update({ handled })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That did not save. Your account may no longer have permission to edit.");
  }
}

/** Super admins only — the policy refuses everyone else. */
export async function deleteEnquiry(id: number) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("enquiries")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    if (/row-level security|policy/i.test(error.message)) {
      throw new Error("Only a super admin can delete an enquiry.");
    }
    throw new Error(error.message);
  }
  /* As above: a filtered delete reports no error and removes nothing. */
  if (!data || data.length === 0) {
    throw new Error("Nothing was deleted. Only a super admin can delete an enquiry.");
  }
}
