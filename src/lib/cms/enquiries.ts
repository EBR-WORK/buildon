"use client";

/**
 * Enquiries, as the website writes them. Reading them back is leads.ts.
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
  product: string | null;
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
  product?: string;
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
    product: orNull(entry.product),
    source: orNull(entry.source),
    page: orNull(entry.page),
  });

  if (!error) return;

  /* A policy refusal means the row failed the length checks — which the form
     checks first, so reaching this is a bug rather than a typo. It is still
     thrown, because the visitor's message must not be lost either way. */
  throw new Error(error.message);
}

/* The admin half of this file moved to leads.ts when an enquiry became a
   lead with an owner, a place and a status. What is left is the public write:
   the only thing the website itself does. */
