"use client";

import { useEffect, useState } from "react";
import {
  cvLink,
  deleteApplication,
  listApplications,
  setApplicationHandled,
  type Application,
} from "@/lib/cms/applications";
import { canManageTeam } from "@/lib/cms/auth";
import { CheckIcon, DownloadIcon, MailIcon, PhoneIcon, TrashIcon } from "@/components/icons";
import { useAdmin } from "./AuthGate";
import { useToast } from "./Toast";

/**
 * Applications to the openings on the careers pages.
 *
 * The same shape as the Enquiries screen on purpose: unanswered first, one
 * press to mark something dealt with, delete for super admins only.
 *
 * The CV is the difference. It lives in a private bucket, so there is no URL
 * to put in the page — the link is made when the button is pressed and lasts
 * an hour. A permanent link sitting in this markup would be the private bucket
 * undone the moment anyone shared a screenshot.
 */

const when = (iso: string) => {
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 36) return `${Math.round(minutes / 60)}h ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function ApplicationsList() {
  const { profile } = useAdmin();
  const { confirm, notify } = useToast();
  const [rows, setRows] = useState<Application[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [showHandled, setShowHandled] = useState(false);
  const [saving, setSaving] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    let alive = true;

    listApplications().then(
      (data) => {
        if (!alive) return;
        setRows(data);
        setStatus("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "";
        setError(
          /schema cache|relation .* does not exist/i.test(message)
            ? "The applications table is not there yet. Run supabase/migrations/0007_applications.sql in the SQL editor."
            : message === "not-configured"
              ? "The database is not configured, so there is nothing to read."
              : message || "Could not read the applications.",
        );
        setStatus("error");
      },
    );

    return () => {
      alive = false;
    };
  }, []);

  async function toggle(row: Application) {
    if (saving.has(row.id)) return;
    const next = !row.handled;

    setSaving((all) => new Set(all).add(row.id));
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, handled: next } : r)));

    try {
      await setApplicationHandled(row.id, next);
    } catch (e) {
      setRows((all) => all.map((r) => (r.id === row.id ? { ...r, handled: !next } : r)));
      notify("Could not save that", e instanceof Error ? e.message : undefined, "danger");
    } finally {
      setSaving((all) => {
        const copy = new Set(all);
        copy.delete(row.id);
        return copy;
      });
    }
  }

  async function openCv(row: Application) {
    if (!row.cv_path) return;
    try {
      /* Opened from the handler, not an href: the link does not exist until
         now, and asking for it is what creates it. */
      window.open(await cvLink(row.cv_path), "_blank", "noopener");
    } catch (e) {
      notify("Could not open that CV", e instanceof Error ? e.message : undefined, "danger");
    }
  }

  async function remove(row: Application) {
    const ok = await confirm({
      title: `Delete ${row.first_name} ${row.last_name}'s application?`,
      body: "This removes their details and their CV for good. It is the only copy.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      await deleteApplication(row.id);
      setRows((all) => all.filter((r) => r.id !== row.id));
      notify("Application deleted", undefined, "success");
    } catch (e) {
      notify("Could not delete it", e instanceof Error ? e.message : undefined, "danger");
    }
  }

  const open = rows.filter((row) => !row.handled);
  const visible = showHandled ? rows : open;

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Applications</h1>
          <p className="mt-1.5 text-[15px] text-ink-500">
            {status === "ready"
              ? open.length === 0
                ? `Nothing waiting. ${rows.length} in all.`
                : `${open.length} waiting, ${rows.length} in all.`
              : "From the careers pages."}
          </p>
        </div>

        {rows.length > open.length && (
          <button
            type="button"
            onClick={() => setShowHandled((shown) => !shown)}
            className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
          >
            {showHandled ? "Hide reviewed" : `Show reviewed (${rows.length - open.length})`}
          </button>
        )}
      </header>

      {status === "loading" && <p className="text-[15px] text-ink-500">Loading…</p>}

      {status === "error" && (
        <p className="rounded-xl border border-signal-200 bg-signal-50 p-4 text-[15px] text-ink-900">
          {error}
        </p>
      )}

      {status === "ready" && visible.length === 0 && (
        <p className="rounded-xl bg-surface p-6 text-center text-[15px] text-ink-500">
          {rows.length === 0
            ? "No applications yet. They appear here the moment somebody applies."
            : "Everything has been reviewed."}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((row) => (
          <li
            key={row.id}
            /* Anchored for the notification bell — see globals.css. */
            id={`application-${row.id}`}
            className={`rounded-2xl border bg-white p-4 transition sm:p-5 ${
              row.handled ? "border-line opacity-60" : "border-brand-200"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg leading-snug font-semibold">
                  {row.first_name} {row.last_name}
                </p>
                <p className="mt-0.5 text-sm text-ink-500">
                  {row.job} · {when(row.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggle(row)}
                  aria-pressed={row.handled}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                    row.handled
                      ? "border-line bg-surface text-ink-500 hover:text-ink-900"
                      : "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
                  }`}
                >
                  <CheckIcon className="size-4" />
                  {row.handled ? "Reviewed" : "Mark reviewed"}
                </button>

                {canManageTeam(profile) && (
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    aria-label={`Delete ${row.first_name} ${row.last_name}'s application`}
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-signal-50 hover:text-signal-500"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a
                href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: your application — ${row.job}`)}`}
                className="inline-flex items-center gap-1.5 font-medium text-brand-500 transition hover:text-brand-600"
              >
                <MailIcon className="size-4" />
                {row.email}
              </a>
              <a
                href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 font-medium text-brand-500 transition hover:text-brand-600"
              >
                <PhoneIcon className="size-4" />
                {row.phone}
              </a>
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-3 text-sm">
              {[
                ["Qualification", row.qualification],
                ["Experience", row.experience],
                ["Current CTC", row.ctc],
                ["Prefers", row.preference],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-ink-500">{label}</dt>
                    <dd className="font-medium text-ink-900">{value}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-3">
              {row.cv_path ? (
                <button
                  type="button"
                  onClick={() => void openCv(row)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
                >
                  <DownloadIcon className="size-4" />
                  {row.cv_name ?? "Open CV"}
                </button>
              ) : (
                <p className="text-sm text-ink-500">No CV attached.</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
