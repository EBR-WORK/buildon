"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { repository } from "@/lib/cms/repository";
import {
  cloneDefaults,
  isShippedProject,
  newId,
  slugify,
  type RichRun,
  type SiteContent,
} from "@/lib/cms/schema";
import { PlusIcon } from "@/components/icons";
import { TextAreaField, TextField } from "./Fields";
import ImageField from "./ImageField";
import { describeUsage, projectUsage } from "@/lib/cms/usage";
import RichTextField from "./RichTextField";
import EntryRow from "./EntryRow";
import SaveBar, { type Status } from "./SaveBar";
import { useToast } from "./Toast";

/**
 * The projects editor: the 24 developments, their cards and their pages.
 *
 * Same accordion as products, for the same reason — 24 open forms is a wall.
 * The difference is the body: a project page is several paragraphs rather than
 * one, so each is its own rich text field, and they can be added, removed and
 * reordered.
 */
export default function ProjectsEditor() {
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
    setStatus("saving");
    try {
      await repository.save(content);
      setDirty(false);
      setStatus("saved");
      setError("");
      notify("Saved", "The draft is stored in this browser.");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not save.");
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

  function addProject() {
    const id = newId();
    /* A placeholder address until the name supplies one. */
    const slug = "new-project-" + Date.now().toString(36);
    edit((d) =>
      void d.projects.items.push({
        id,
        slug,
        name: "",
        title: "",
        cardBody: "",
        image: "",
        paragraphs: [[]],
      }),
    );
    setOpen(id);
  }

  /** Delete, naming what will stop working. See removeProduct. */
  async function removeProject(slug: string, name: string) {
    const live = isShippedProject(slug);

    const ok = await confirm({
      title: `Delete “${name || slug}”?`,
      body: live
        ? [
            `The page at /projects/${slug} will no longer exist.`,
            describeUsage(projectUsage(slug), "project"),
            "This cannot be undone.",
          ].join("\n")
        : "This project was never published. This cannot be undone.",
      confirmLabel: "Delete project",
    });
    if (!ok) return;

    edit((d) => void (d.projects.items = d.projects.items.filter((item) => item.slug !== slug)));
    setOpen(null);
    notify("Deleted", `“${name || slug}” is gone from the draft.`);
  }

  if (!content) {
    return (
      <div className="p-6 sm:p-10">
        <p className="text-[15px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const { projects } = content;

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Projects
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          The developments shown on /projects, and the page each card opens.
        </p>
      </header>

      <div className="space-y-10 p-6 sm:p-10">
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <header className="mb-6 border-b border-line pb-4">
            <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
              The projects
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              {projects.items.length} developments, in the order the grid shows them.
            </p>
          </header>

          <ul className="space-y-3">
            {projects.items.map((project, i) => {
              const isOpen = open === project.id;
              const shipped = isShippedProject(project.slug);
              const duplicate =
                projects.items.filter((other) => other.slug === project.slug).length > 1;
              const slugError = !project.slug
                ? "A web address is required."
                : duplicate
                  ? "Another project already uses this address."
                  : null;

              return (
                <EntryRow
                  key={project.id}
                  title={project.name || "Untitled project"}
                  subtitle={`/projects/${project.slug}`}
                  badge={
                    !shipped ? (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                        New
                      </span>
                    ) : null
                  }
                  thumb={
                    project.image ? (
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                        <Image
                          src={project.image}
                          alt=""
                          fill
                          sizes="2.5rem"
                          unoptimized
                          className="object-cover"
                        />
                      </span>
                    ) : null
                  }
                  isOpen={isOpen}
                  onToggle={() => setOpen(isOpen ? null : project.id)}
                  onDelete={() => void removeProject(project.slug, project.name)}
                  deleteLabel={`Delete ${project.name || "this project"}`}
                >
                  <TextField
                        label="Name"
                        hint="As the card shows it — this is also how the page is found."
                        value={project.name}
                        onChange={(next) =>
                          edit((d) => {
                            d.projects.items[i].name = next;
                            if (!shipped && !touchedSlugs.has(project.id)) {
                              const slug = slugify(next);
                              if (slug) d.projects.items[i].slug = slug;
                            }
                          })
                        }
                      />

                      {shipped ? (
                        <p className="rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed text-ink-500">
                          Live at{" "}
                          <strong className="font-semibold text-ink-900">
                            /projects/{project.slug}
                          </strong>
                          . The address is fixed — changing it would break every link to
                          this page.
                        </p>
                      ) : (
                        <TextField
                          label="Web address"
                          hint={
                            slugError ??
                            "Lower case, words joined by hyphens. Becomes /projects/…"
                          }
                          value={project.slug}
                          onChange={(next) => {
                            const slug = slugify(next);
                            setTouchedSlugs((prev) => new Set(prev).add(project.id));
                            edit((d) => void (d.projects.items[i].slug = slug));
                          }}
                        />
                      )}

                      <TextField
                        label="Page heading"
                        hint="The heading on the project's own page. Often the same as the name, but the site writes some with a hyphen where the card uses a dash."
                        value={project.title}
                        onChange={(next) => edit((d) => void (d.projects.items[i].title = next))}
                      />

                      <TextAreaField
                        label="Card summary"
                        hint="The excerpt under the name on the projects grid."
                        rows={3}
                        value={project.cardBody}
                        onChange={(next) =>
                          edit((d) => void (d.projects.items[i].cardBody = next))
                        }
                      />

                      <ImageField
                        label="Photograph"
                        hint="Shown on the card and at the top of the project's page."
                        folder="projects"
                        value={project.image}
                        onChange={(next) => edit((d) => void (d.projects.items[i].image = next))}
                      />

                      <Paragraphs
                        paragraphs={project.paragraphs}
                        onChange={(next) =>
                          edit((d) => void (d.projects.items[i].paragraphs = next))
                        }
                      />

                  {shipped && (
                        <p className="border-t border-line pt-4 text-sm text-ink-500">
                          {describeUsage(projectUsage(project.slug), "project")}
                        </p>
                      )}
                </EntryRow>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={addProject}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
          >
            <PlusIcon className="size-4" />
            Add a project
          </button>
        </section>
      </div>

      <SaveBar
        status={status}
        dirty={dirty}
        error={error}
        onSave={save}
        onReset={reset}
        onExport={exportJson}
      />
    </div>
  );
}

/**
 * The body copy: one rich text field per paragraph.
 *
 * Paragraphs are separate fields rather than one box split on blank lines,
 * because each carries its own formatting — a link in the second paragraph has
 * to stay in the second paragraph.
 */
function Paragraphs({
  paragraphs,
  onChange,
}: {
  paragraphs: RichRun[][];
  onChange: (next: RichRun[][]) => void;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= paragraphs.length) return;
    const next = [...paragraphs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-ink-900">Body copy</h3>
        <span className="text-sm text-ink-500">
          {paragraphs.length} {paragraphs.length === 1 ? "paragraph" : "paragraphs"}
        </span>
      </div>

      <ul className="space-y-4">
        {paragraphs.map((runs, i) => (
          <li key={i} className="rounded-2xl border border-line p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                Paragraph {i + 1}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="cursor-pointer text-sm text-ink-500 underline disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={i === paragraphs.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="cursor-pointer text-sm text-ink-500 underline disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Down
                </button>
                <button
                  type="button"
                  disabled={paragraphs.length <= 1}
                  onClick={() => onChange(paragraphs.filter((_, n) => n !== i))}
                  className="cursor-pointer text-sm text-signal-500 underline disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </div>

            <RichTextField
              label=""
              hint="Select words, then Bold or Link."
              runs={runs}
              rows={5}
              onChange={(next) => onChange(paragraphs.map((old, n) => (n === i ? next : old)))}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...paragraphs, []])}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
      >
        <PlusIcon className="size-4" />
        Add paragraph
      </button>
    </section>
  );
}
