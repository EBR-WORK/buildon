"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConflictError, repository } from "@/lib/cms/repository";
import {
  blogAuthorKeys,
  cloneDefaults,
  isShippedPost,
  newId,
  slugify,
  type SiteContent,
} from "@/lib/cms/schema";
import { describeUsage, postUsage } from "@/lib/cms/usage";
import { PlusIcon, SearchIcon } from "@/components/icons";
import RichDocEditor from "./RichDocEditor";
import EntryRow from "./EntryRow";
import { DateField, Field, TextAreaField, TextField, today } from "./Fields";
import ImageField from "./ImageField";
import SaveBar, { type Status } from "./SaveBar";
import { describeProblems, validatePosts } from "@/lib/cms/validate";
import { useToast } from "./Toast";

/**
 * The blog editor.
 *
 * Thirty-three posts is past the point where a plain list works, so this one
 * has a filter the others do not need. Everything else follows the same shape:
 * one collapsible row per post, the body edited through BlockEditor.
 *
 * Tags and authors are not editable here. Authors are three fixed bios with
 * portraits, and the tag cloud's archives are WordPress routes this site does
 * not build — offering either as a form field would imply they do something.
 */
export default function BlogEditor() {
  const { confirm, notify } = useToast();

  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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
    const blocking = validatePosts(content);
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
    notify("Reset", "Back to what the site ships with.");
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

  function addPost() {
    const id = newId();
    const now = today();
    edit((d) =>
      void d.blog.items.unshift({
        id,
        /* New work starts as a draft: incomplete entries should not reach
           the site by being forgotten. */
        live: false,
        slug: "new-post-" + Date.now().toString(36),
        title: "",
        description: "",
        image: "",
        published: now,
        modified: now,
        author: blogAuthorKeys[0] ?? "buildon co",
        body: [],
      }),
    );
    setOpen(id);
    /* A filter in force would hide the row that was just created. */
    setQuery("");
  }

  /**
   * Delete a post.
   *
   * Posts cross-link each other heavily, so the count of what breaks is the
   * part worth reading — see postUsage.
   */
  async function removePost(slug: string, title: string) {
    const live = isShippedPost(slug);

    const ok = await confirm({
      title: `Delete “${title || slug}”?`,
      body: live
        ? [
            `The article at /blog/${slug} will no longer exist.`,
            describeUsage(postUsage(slug), "post"),
            "This cannot be undone.",
          ].join("\n")
        : "This post was never published. This cannot be undone.",
      confirmLabel: "Delete post",
    });
    if (!ok) return;

    edit((d) => void (d.blog.items = d.blog.items.filter((post) => post.slug !== slug)));
    setOpen(null);
    notify("Deleted", `“${title || slug}” is gone from the draft.`);
  }

  /* Filtered for display only — edits still address the real array by id, so a
     filter can never write to the wrong row. */
  const visible = useMemo(() => {
    if (!content) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return content.blog.items;
    return content.blog.items.filter(
      (post) =>
        post.title.toLowerCase().includes(needle) ||
        post.slug.toLowerCase().includes(needle),
    );
  }, [content, query]);

  /* Recomputed on every render rather than on save: an editor should see
     a problem while they can still fix it, not after pressing Save. */
  const problems = content ? validatePosts(content) : [];

  if (!content) {
    return (
      <div className="p-6 sm:p-10">
        <p className="text-[15px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const posts = content.blog.items;

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Blog
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Every article, its details and its body.
        </p>
      </header>

      <div className="space-y-10 p-6 sm:p-10">
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <header className="mb-6 border-b border-line pb-4">
            <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
              Posts
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              {posts.length} {posts.length === 1 ? "article" : "articles"}. Each has its own
              page at /blog/…
            </p>
          </header>

          <div className="relative mb-5">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by title or address"
              aria-label="Filter posts"
              className="w-full rounded-xl border border-line bg-white py-3 pr-4 pl-11 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl bg-surface px-4 py-6 text-center text-[15px] text-ink-500">
              No post matches “{query}”.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((post) => {
                const index = posts.findIndex((entry) => entry.id === post.id);
                const shipped = isShippedPost(post.slug);
                const duplicate = posts.filter((other) => other.slug === post.slug).length > 1;
                const slugError = !post.slug
                  ? "A web address is required."
                  : duplicate
                    ? "Another post already uses this address."
                    : null;

                return (
                  <EntryRow
                    key={post.id}
                    title={post.title || "Untitled post"}
                    subtitle={`${post.published || "No date"} · ${post.author || "No author"}`}
                    badge={
                      !shipped ? (
                        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                          New
                        </span>
                      ) : null
                    }
                    isOpen={open === post.id}
                    onToggle={() => setOpen(open === post.id ? null : post.id)}
                    live={post.live}
                    onToggleLive={() =>
                      edit((d) => void (d.blog.items[index].live = !d.blog.items[index].live))
                    }
                    onDelete={() => void removePost(post.slug, post.title)}
                    deleteLabel={`Delete ${post.title || "this post"}`}
                  >
                    <TextField
                      label="Title"
                      required
                      value={post.title}
                      onChange={(next) =>
                        edit((d) => {
                          d.blog.items[index].title = next;
                          if (!shipped && !touchedSlugs.has(post.id)) {
                            const slug = slugify(next);
                            if (slug) d.blog.items[index].slug = slug;
                          }
                        })
                      }
                    />

                    {shipped ? (
                      <p className="rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed text-ink-500">
                        Live at{" "}
                        <strong className="font-semibold text-ink-900">/blog/{post.slug}</strong>.
                        The address is fixed — other articles link to it, and changing it would
                        break every one of them.
                      </p>
                    ) : (
                      <TextField
                        label="Web address"
                        hint={slugError ?? "Lower case, words joined by hyphens. Becomes /blog/…"}
                        value={post.slug}
                        onChange={(next) => {
                          setTouchedSlugs((prev) => new Set(prev).add(post.id));
                          edit((d) => void (d.blog.items[index].slug = slugify(next)));
                        }}
                      />
                    )}

                    <TextAreaField
                      label="Description"
                      hint="The listing card's excerpt, and the summary search engines show."
                      rows={3}
                      value={post.description}
                      onChange={(next) => edit((d) => void (d.blog.items[index].description = next))}
                    />

                    <ImageField
                      label="Featured image"
                      hint="Used by the listing card and the top of the article."
                      folder="blog"
                      value={post.image}
                      onChange={(next) => edit((d) => void (d.blog.items[index].image = next))}
                    />

                    <div className="grid gap-5 sm:grid-cols-3">
                      <DateField
                        label="Published"
                        required
                        hint="Shown on the article and used by search engines."
                        value={post.published}
                        /* No future dates: this site builds to static files, so
                           a post dated next week is live now and simply lies
                           about when it was written. */
                        max={today()}
                        onChange={(next) =>
                          edit((d) => void (d.blog.items[index].published = next))
                        }
                      />
                      <DateField
                        label="Last updated"
                        hint="Leave as the published date if nothing has changed."
                        value={post.modified}
                        max={today()}
                        onChange={(next) => edit((d) => void (d.blog.items[index].modified = next))}
                      />
                      <Field label="Author" hint="One of the three bios on file.">
                        <select
                          value={post.author}
                          onChange={(event) =>
                            edit((d) => void (d.blog.items[index].author = event.target.value))
                          }
                          className="w-full cursor-pointer rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        >
                          {blogAuthorKeys.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="border-t border-line pt-5">
                      <RichDocEditor
                        blocks={post.body}
                        onChange={(next) => edit((d) => void (d.blog.items[index].body = next))}
                      />
                    </div>
                  </EntryRow>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={addPost}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
          >
            <PlusIcon className="size-4" />
            Add a post
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
