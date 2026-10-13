"use client";

import { useEffect, useState } from "react";
import {
  deleteEnquiry,
  listEnquiries,
  setHandled,
  type Enquiry,
} from "@/lib/cms/enquiries";
import { canManageTeam } from "@/lib/cms/auth";
import { CheckIcon, MailIcon, PhoneIcon, TrashIcon } from "@/components/icons";
import { useAdmin } from "./AuthGate";
import { useToast } from "./Toast";

/**
 * Every enquiry the site has received.
 *
 * Read-mostly: the one thing an editor does here is mark something dealt with,
 * so the list answers "what have we not replied to" without anyone keeping a
 * separate tally. Unanswered sort to the top — see listEnquiries.
 *
 * Deleting is a super admin's alone. An enquiry is a record of somebody asking
 * for something, and an editor tidying the list is how that record is lost.
 */

const when = (iso: string) => {
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 36) return `${Math.round(minutes / 60)}h ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function EnquiriesList() {
  const { profile } = useAdmin();
  const { confirm, notify } = useToast();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [showHandled, setShowHandled] = useState(false);
  /** Rows with a save in flight, so a second press cannot race the first. */
  const [saving, setSaving] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    let alive = true;

    /* The promise form, not an async helper called from the effect: only the
       callbacks write state, which is what keeps the `alive` guard honest when
       a sign-out unmounts this mid-flight. */
    listEnquiries().then(
      (data) => {
        if (!alive) return;
        setRows(data);
        setStatus("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "";
        setError(
          /* PostgREST's words, not Postgres's: a missing table comes back as
             "Could not find the table ... in the schema cache", which the
             obvious /relation|does not exist/ never matches. */
          /schema cache|relation .* does not exist/i.test(message)
            ? "The enquiries table is not there yet. Run supabase/migrations/0003_enquiries.sql in the SQL editor."
            : message === "not-configured"
              ? "The database is not configured, so there is nothing to read."
              : message || "Could not read the enquiries.",
        );
        setStatus("error");
      },
    );

    return () => {
      alive = false;
    };
  }, []);

  async function toggle(row: Enquiry) {
    /* Optimistic: the round trip is the only thing between pressing it and it
       being true, and a checkbox that waits reads as one that did not work.

       One in flight per row, because two fast presses would otherwise send two
       requests built from the same stale value and the list could settle on
       the opposite of what the database holds. */
    if (saving.has(row.id)) return;
    const next = !row.handled;

    setSaving((all) => new Set(all).add(row.id));
    setRows((all) =>
      all.map((item) => (item.id === row.id ? { ...item, handled: next } : item)),
    );

    try {
      await setHandled(row.id, next);
    } catch (e) {
      /* Back to what it was, taken from `next` rather than from the row this
         closure captured — the same reason as above. */
      setRows((all) =>
        all.map((item) => (item.id === row.id ? { ...item, handled: !next } : item)),
      );
      notify("Could not save that", e instanceof Error ? e.message : undefined, "danger");
    } finally {
      setSaving((all) => {
        const copy = new Set(all);
        copy.delete(row.id);
        return copy;
      });
    }
  }

  async function remove(row: Enquiry) {
    const ok = await confirm({
      title: `Delete the enquiry from ${row.name}?`,
      body: "This is the only copy. Nothing else on the site keeps a record of it.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      await deleteEnquiry(row.id);
      setRows((all) => all.filter((item) => item.id !== row.id));
      notify("Enquiry deleted", undefined, "success");
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
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Enquiries</h1>
          <p className="mt-1.5 text-[15px] text-ink-500">
            {status === "ready"
              ? open.length === 0
                ? `Nothing waiting. ${rows.length}${rows.length === 500 ? "+ loaded" : " in all"}.`
                : `${open.length} waiting for a reply, ${rows.length}${
                    /* The query stops at 500; past that "in all" would be a
                       lie, so it stops claiming to be a total. */
                    rows.length === 500 ? "+ loaded" : " in all"
                  }.`
              : "From the forms on the site."}
          </p>
        </div>

        {rows.length > open.length && (
          <button
            type="button"
            onClick={() => setShowHandled((shown) => !shown)}
            className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
          >
            {showHandled ? "Hide answered" : `Show answered (${rows.length - open.length})`}
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
            ? "No enquiries yet. They appear here the moment somebody sends one."
            : "Everything has been answered."}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((row) => (
          <li
            key={row.id}
            className={`rounded-2xl border bg-white p-4 transition sm:p-5 ${
              row.handled ? "border-line opacity-60" : "border-brand-200"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg leading-snug font-semibold">{row.name}</p>
                <p className="mt-0.5 text-sm text-ink-500">
                  {when(row.created_at)}
                  {row.source && ` · ${row.source}`}
                  {row.page && row.page !== "/" && ` · ${row.page}`}
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
                  {row.handled ? "Answered" : "Mark answered"}
                </button>

                {canManageTeam(profile) && (
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    aria-label={`Delete the enquiry from ${row.name}`}
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-signal-50 hover:text-signal-500"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Both are links, because the next thing anyone does with an
                enquiry is answer it. */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a
                href={`mailto:${row.email}?subject=${encodeURIComponent("Re: your enquiry to Buildon")}`}
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
              {row.company && <span className="text-ink-500">{row.company}</span>}
              {row.enquiry_type && (
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-ink-500">
                  {row.enquiry_type}
                </span>
              )}
              {/* Tinted, because which product they want is the first thing
                  anyone answering needs and it should not read as one more
                  grey tag among the rest. */}
              {row.product && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-600">
                  {row.product}
                </span>
              )}
            </div>

            {/* whitespace-pre-line: the message was typed into a textarea and
                the line breaks in it are the writer's own. */}
            <p className="mt-3 border-t border-line pt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-900">
              {row.message}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
