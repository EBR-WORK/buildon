"use client";

/**
 * Branches: the offices a lead belongs to and a salesperson works from.
 *
 * Small on purpose. A branch is a name and whether it is still open, and
 * every field beyond that would be a field somebody has to keep true.
 */

import { useEffect, useState } from "react";
import {
  addPlace,
  listAllPlaces,
  placeUsage,
  renamePlace,
  setPlaceActive,
  type Place,
} from "@/lib/cms/places";
import { useToast } from "./Toast";
import { PlusIcon } from "@/components/icons";

export default function PlacesEditor() {
  const { notify, confirm } = useToast();

  const [places, setPlaces] = useState<Place[]>([]);
  const [usage, setUsage] = useState<Record<number, { leads: number; staff: number }>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  /* Which row is being renamed, and to what. One at a time: a screen with
     every row editable is a screen where a stray keystroke changes something
     nobody meant to touch. */
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([listAllPlaces(), placeUsage()]).then(
      ([rows, counts]) => {
        if (!alive) return;
        setPlaces(rows);
        setUsage(counts);
        setStatus("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "";
        setError(
          /schema cache|does not exist/i.test(message)
            ? "The places table is missing. Run the migrations in supabase/migrations."
            : message || "Could not load the branches.",
        );
        setStatus("error");
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    try {
      const made = await addPlace(name);
      setPlaces((all) => [...all, made].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      notify("Branch added", `${made.name} can now be picked on a lead.`, "success");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not add that.", undefined, "danger");
    }
    setBusy(false);
  }

  async function rename(place: Place) {
    const next = draft.trim();
    setEditing(null);
    if (!next || next === place.name) return;

    try {
      await renamePlace(place.id, next);
      setPlaces((all) => all.map((p) => (p.id === place.id ? { ...p, name: next } : p)));
      notify("Renamed", `${place.name} is now ${next}.`, "success");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not rename that.", undefined, "danger");
    }
  }

  async function toggle(place: Place) {
    const counts = usage[place.id];

    if (place.active) {
      const attached =
        counts && (counts.leads > 0 || counts.staff > 0)
          ? ` ${counts.leads} lead${counts.leads === 1 ? "" : "s"} and ${counts.staff} ${
              counts.staff === 1 ? "person" : "people"
            } are attached to it; they keep it.`
          : "";

      const ok = await confirm({
        title: `Close ${place.name}?`,
        body: `It stops being offered on new leads.${attached} Nothing is deleted, and it can be reopened.`,
        confirmLabel: "Close branch",
      });
      if (!ok) return;
    }

    try {
      await setPlaceActive(place.id, !place.active);
      setPlaces((all) =>
        all.map((p) => (p.id === place.id ? { ...p, active: !p.active } : p)),
      );
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save that.", undefined, "danger");
    }
  }

  if (status === "loading") {
    return <div className="p-5 text-[15px] text-ink-500 sm:p-8">Loading…</div>;
  }

  if (status === "error") {
    return (
      <div className="p-5 sm:p-8">
        <p className="rounded-2xl border border-signal-200 bg-signal-50 p-5 text-[15px] text-ink-900">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Branches</h1>
        <p className="mt-1.5 text-[15px] text-ink-500">
          Where a lead belongs and a salesperson works from. Used on the leads
          screen, the presales tracker and the dashboard filter.
        </p>
      </header>

      <form onSubmit={create} className="mb-6 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Mumbai"
          aria-label="New branch name"
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] outline-none transition focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-default disabled:opacity-50"
        >
          <PlusIcon className="size-4" />
          {busy ? "Adding…" : "Add branch"}
        </button>
      </form>

      {places.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-6 text-[15px] text-ink-500">
          No branches yet. Add the first above — until there is one, the Place
          field on a lead has nothing to offer.
        </p>
      ) : (
        <ul className="space-y-2">
          {places.map((place) => {
            const counts = usage[place.id] ?? { leads: 0, staff: 0 };
            return (
              <li
                key={place.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 ${
                  place.active ? "border-line" : "border-line opacity-60"
                }`}
              >
                {editing === place.id ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => void rename(place)}
                    onKeyDown={(event) => {
                      /* Enter closes the input, which fires blur, which would
                         call rename a second time — two writes and two toasts
                         for one rename. Clearing the row first makes the
                         second call a no-op, because rename reads `editing`
                         having already been reset. */
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                        return;
                      }
                      if (event.key === "Escape") {
                        setDraft(place.name);
                        setEditing(null);
                      }
                    }}
                    aria-label={`Rename ${place.name}`}
                    className="min-w-0 flex-1 rounded-lg border border-brand-500 px-3 py-1.5 text-[15px] outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(place.name);
                      setEditing(place.id);
                    }}
                    className="min-w-0 flex-1 cursor-pointer text-left text-[15px] font-medium text-ink-900"
                  >
                    {place.name}
                    {!place.active && (
                      <span className="ml-2 text-sm font-normal text-ink-500">closed</span>
                    )}
                  </button>
                )}

                <span className="text-sm text-ink-500">
                  {counts.leads} lead{counts.leads === 1 ? "" : "s"} ·{" "}
                  {counts.staff} {counts.staff === 1 ? "person" : "people"}
                </span>

                <button
                  type="button"
                  onClick={() => void toggle(place)}
                  className="cursor-pointer rounded-full border border-line px-4 py-1.5 text-sm font-medium transition hover:border-brand-200"
                >
                  {place.active ? "Close" : "Reopen"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-sm text-ink-500">
        A branch is closed rather than deleted: leads and people point at it, and
        removing it would either take them with it or leave them pointing at
        nothing.
      </p>
    </div>
  );
}
