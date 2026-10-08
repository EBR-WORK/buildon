"use client";

import { useCallback, useEffect, useState } from "react";
import { ConflictError, repository } from "@/lib/cms/repository";
import {
  cloneDefaults,
  isShippedJob,
  newId,
  slugify,
  type SiteContent,
} from "@/lib/cms/schema";
import { PlusIcon } from "@/components/icons";
import { PagePath, TextField } from "./Fields";
import EntryRow from "./EntryRow";
import RichDocEditor from "./RichDocEditor";
import SaveBar, { type Status } from "./SaveBar";
import { describeProblems, validateJobs } from "@/lib/cms/validate";
import { useToast } from "./Toast";
import { describeUsage, jobUsage } from "@/lib/cms/usage";

/**
 * The careers editor: the open roles.
 *
 * "Life at Buildon" is not here. Its four galleries are fixed event albums that
 * change once a year at most, and managing 24 photographs through a form earns
 * nothing over editing the list in content.ts.
 *
 * Responsibilities are plain text rather than rich text. The reference sets no
 * links inside them, and offering formatting that nothing uses invites an
 * editor to add some — which the job page does not render.
 */
export default function CareerEditor() {
  const { confirm, notify } = useToast();

  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  /* Ids whose address the editor has typed into: once touched, the name
     stops driving it. Keyed by id, not slug — the slug is what changes. */
  const [touchedSlugs, setTouchedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    repository.load().then((loaded) => {
      setContent(loaded);
      setStatus("idle");
    });
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = useCallback((change: (draft: SiteContent) => void) => {
    setContent((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      change(next);
      return next;
    });
    setDirty(true);
    setStatus("idle");
  }, []);

  async function save() {
    if (!content) return;

    /* Checked here too, not only in the disabled button: a stale render or
       a keyboard submit must not get past it. */
    const blocking = validateJobs(content);
    if (blocking.length > 0) {
      setStatus("error");
      setError(describeProblems(blocking));
      notify("Not saved", describeProblems(blocking), "danger");
      return;
    }

    setStatus("saving");
    try {
      await repository.save(content);
      setDirty(false);
      setStatus("saved");
      setError("");
      notify("Saved", `Stored in ${repository.destination}.`);
    } catch (e) {
      setStatus("error");
      const message = e instanceof Error ? e.message : "Could not save.";
      setError(message);
      /* A conflict is not a failed save, it is a refused one, and the editor
         has to decide what to do — so it gets a toast rather than only a line
         in the bar they may have scrolled past. */
      if (e instanceof ConflictError) {
        notify("Not saved", message, "danger");
      }
    }
  }

  async function reset() {
    const ok = await confirm({
      title: "Discard every change?",
      body: "Everything goes back to what the site ships with. This cannot be undone.",
      confirmLabel: "Discard",
    });
    if (!ok) return;
    await repository.reset();
    setContent(cloneDefaults());
    setDirty(false);
    setStatus("idle");
  }

  function exportJson() {
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildon-content.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function addJob() {
    const id = newId();
    /* A placeholder address until the name supplies one. */
    const slug = "new-opening-" + Date.now().toString(36);
    edit((d) =>
      void d.career.jobs.push({
        id,
        /* New work starts as a draft: incomplete entries should not reach
           the site by being forgotten. */
        live: false,
        slug,
        title: "",
        category: "",
        type: "",
        location: "",
        body: [],
      }),
    );
    setOpen(id);
  }

  /**
   * Delete an opening.
   *
   * A job URL travels further than most — into emails, job boards and
   * applicants' bookmarks — so a live one says that plainly before it goes.
   */
  async function removeJob(slug: string, title: string) {
    const live = isShippedJob(slug);

    const ok = await confirm({
      title: `Delete “${title || slug}”?`,
      body: live
        ? [
            `The page at /career/${slug} will no longer exist. Anyone holding the link, from an email or a job board, will find nothing there.`,
            describeUsage(jobUsage(slug), "opening"),
            "This cannot be undone.",
          ].join("\n")
        : "This opening was never published. This cannot be undone.",
      confirmLabel: "Delete opening",
    });
    if (!ok) return;

    edit((d) => void (d.career.jobs = d.career.jobs.filter((job) => job.slug !== slug)));
    setOpen(null);
    notify("Deleted", `“${title || slug}” is gone from the draft.`);
  }

  /* Recomputed on every render rather than on save: an editor should see
     a problem while they can still fix it, not after pressing Save. */
  const problems = content ? validateJobs(content) : [];

  if (!content) {
    return (
      <div className="p-6 sm:p-10">
        <p className="text-[15px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const { career } = content;

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Careers
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          The open roles and the page each card opens.
        </p>
      </header>

      <div className="space-y-10 p-6 sm:p-10">
        {/* ------------------------------------------------------ Openings */}
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <header className="mb-6 border-b border-line pb-4">
            <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
              Open roles
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              {career.jobs.length} {career.jobs.length === 1 ? "opening" : "openings"}. Each
              has its own page with an application form.
            </p>
          </header>

          <div className="mb-6 grid gap-5 sm:grid-cols-2">
            <TextField
              label="Section heading"
              required
              value={career.openingsTitle}
              onChange={(next) => edit((d) => void (d.career.openingsTitle = next))}
            />
            <TextField
              label="Card link label"
              hint="The words on each card's link."
              value={career.moreLabel}
              onChange={(next) => edit((d) => void (d.career.moreLabel = next))}
            />
          </div>

          <ul className="space-y-3">
            {career.jobs.map((job, i) => {
              const isOpen = open === job.id;
              const shipped = isShippedJob(job.slug);
              const duplicate = career.jobs.filter((other) => other.slug === job.slug).length > 1;
              const slugError = !job.slug
                ? "A web address is required."
                : duplicate
                  ? "Another opening already uses this address."
                  : null;

              return (
                <EntryRow
                  key={job.id}
                  title={job.title || "Untitled opening"}
                  subtitle={
                    [job.location, job.type].filter(Boolean).join(" · ") || "No details yet"
                  }
                  badge={
                    !shipped ? (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                        New
                      </span>
                    ) : null
                  }
                  isOpen={isOpen}
                  onToggle={() => setOpen(isOpen ? null : job.id)}
                  live={job.live}
                  onToggleLive={() =>
                    edit((d) => void (d.career.jobs[i].live = !d.career.jobs[i].live))
                  }
                  onDelete={() => void removeJob(job.slug, job.title)}
                  deleteLabel={`Delete ${job.title || "this opening"}`}
                >
                  <TextField
                        label="Job title"
                        required
                        value={job.title}
                        onChange={(next) =>
                          edit((d) => {
                            d.career.jobs[i].title = next;
                            if (!shipped && !touchedSlugs.has(job.id)) {
                              const slug = slugify(next + "-" + job.location);
                              if (slug) d.career.jobs[i].slug = slug;
                            }
                          })
                        }
                      />

                      {shipped ? (
                        <div className="rounded-xl bg-surface px-4 py-3">
                          {/* The address, and a way to open it. Live needs both:
                              not a draft, and already built — a page published
                              minutes ago does not exist until the next deploy. */}
                          <PagePath path={`/career/${job.slug}`} live={job.live !== false} />
                          <p className="mt-2 text-sm leading-relaxed text-ink-500">
                            The address is fixed. Changing it would break every link to
                            this page.
                          </p>
                        </div>
                      ) : (
                        <TextField
                          label="Web address"
                          hint={
                            slugError ?? "Lower case, words joined by hyphens. Becomes /career/…"
                          }
                          value={job.slug}
                          onChange={(next) => {
                            const slug = slugify(next);
                            setTouchedSlugs((prev) => new Set(prev).add(job.id));
                            edit((d) => void (d.career.jobs[i].slug = slug));
                          }}
                        />
                      )}

                      <div className="grid gap-5 sm:grid-cols-3">
                        <TextField
                          label="Category"
                          hint="The job family."
                          value={job.category}
                          onChange={(next) => edit((d) => void (d.career.jobs[i].category = next))}
                        />
                        <TextField
                          label="Experience"
                          hint="e.g. 5 years Experience"
                          value={job.type}
                          onChange={(next) => edit((d) => void (d.career.jobs[i].type = next))}
                        />
                        <TextField
                          label="Location"
                          required
                          hint="Also drives the filter on /career."
                          value={job.location}
                          onChange={(next) => edit((d) => void (d.career.jobs[i].location = next))}
                        />
                      </div>

                      {/* Keyed on the opening: switching rows must give the
                          editor a new instance rather than reusing one still
                          holding the last job's description. */}
                      <RichDocEditor
                        key={job.id}
                        blocks={job.body}
                        onChange={(next) => edit((d) => void (d.career.jobs[i].body = next))}
                      />
                      <p className="text-sm text-ink-500">
                        Leave this empty if the role has no description yet &mdash; the page
                        says so rather than showing an empty heading.
                      </p>

                  {shipped && (
                        <p className="border-t border-line pt-4 text-sm text-ink-500">
                          Filled roles are usually better removed than left open.
                        </p>
                      )}
                </EntryRow>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={addJob}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
          >
            <PlusIcon className="size-4" />
            Add an opening
          </button>
        </section>

      </div>

      <SaveBar
        status={status}
        dirty={dirty}
        error={error}
        problems={problems}
        onSave={save}
        onReset={reset}
        onExport={exportJson}
      />
    </div>
  );
}
