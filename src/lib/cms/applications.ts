"use client";

/**
 * Job applications: the careers form writes one, the admin panel reads them.
 *
 * The CV goes to a private bucket and the row stores its path, never a URL —
 * there is no public URL to store. An editor gets a link that expires, made at
 * the moment they ask for it.
 */

import { supabase } from "./supabase";

const BUCKET = "applications";

export type Application = {
  id: number;
  created_at: string;
  job: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qualification: string | null;
  experience: string | null;
  ctc: string | null;
  preference: string | null;
  cv_path: string | null;
  cv_name: string | null;
  handled: boolean;
  handled_at: string | null;
  note: string | null;
};

export type NewApplication = {
  job: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification?: string;
  experience?: string;
  ctc?: string;
  preference?: string;
};

const orNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * A path nobody can guess.
 *
 * The bucket is private, so this is not what protects the file — but a
 * predictable path would make a future mistake (a policy loosened, a bucket
 * flipped public) into an immediate leak of every CV rather than a scare.
 */
function cvPath(filename: string) {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60);

  const noise =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${new Date().getFullYear()}/${noise}-${safe}`;
}

/**
 * Store an application, with its CV if there is one.
 *
 * The file goes first. If it fails the application is still submitted without
 * it — a CV that would not upload is a reason to ask for it by email, never a
 * reason to throw away someone's application.
 */
export async function submitApplication(entry: NewApplication, cv?: File | null) {
  if (!supabase) throw new Error("not-configured");

  let path: string | null = null;
  let name: string | null = null;

  if (cv && cv.size > 0) {
    const target = cvPath(cv.name);
    const { error } = await supabase.storage.from(BUCKET).upload(target, cv, {
      contentType: cv.type || "application/octet-stream",
      upsert: false,
    });
    if (!error) {
      path = target;
      name = cv.name;
    }
  }

  const { error } = await supabase.from("applications").insert({
    job: entry.job.trim(),
    first_name: entry.firstName.trim(),
    last_name: entry.lastName.trim(),
    email: entry.email.trim(),
    phone: entry.phone.trim(),
    qualification: orNull(entry.qualification),
    experience: orNull(entry.experience),
    ctc: orNull(entry.ctc),
    preference: orNull(entry.preference),
    cv_path: path,
    cv_name: name,
  });

  if (error) throw new Error(error.message);

  /* Said back so the form can tell the applicant their CV did not make it,
     rather than letting them believe it did. */
  return { cvStored: Boolean(path) };
}

/* ------------------------------------------------------------------ admin */

export async function listApplications(): Promise<Application[]> {
  if (!supabase) throw new Error("not-configured");

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as Application[];
}

/**
 * A link to one CV, good for an hour.
 *
 * Made on demand rather than stored: a URL that never expires, sitting in a
 * page or an email, is the private bucket undone.
 */
export async function cvLink(path: string) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not open that file.");
  }
  return data.signedUrl;
}

export async function setApplicationHandled(id: number, handled: boolean) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("applications")
    .update({ handled })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  /* A filtered update is no error and no rows — see enquiries.ts. */
  if (!data || data.length === 0) {
    throw new Error("That did not save. Your account may no longer have permission to edit.");
  }
}

export async function deleteApplication(id: number) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .select("id,cv_path");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Nothing was deleted. Only a super admin can delete an application.");
  }

  /* The CV goes with the row. Leaving it would keep someone's personal data
     in the bucket with nothing left pointing at it — unfindable, undeletable
     through the panel, and still there. */
  const path = (data[0] as { cv_path: string | null }).cv_path;
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}
