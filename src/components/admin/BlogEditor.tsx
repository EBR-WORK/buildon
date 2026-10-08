"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConflictError, repository } from "@/lib/cms/repository";
import {
  blogAuthorKeys,
  cloneDefaults,
  isShippedPost,
  newId,
  slugify,
  type BlogEntry,
  type SiteContent,
} from "@/lib/cms/schema";
import { describeUsage, postUsage } from "@/lib/cms/usage";
import { CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/icons";
import RichDocEditor from "./RichDocEditor";
import { DateField, Field, PagePath, TextAreaField, TextField, today } from "./Fields";
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
  const drafts = posts.filter((post) => post.live === false).length;

  /* Looked up by id rather than held as an object: the list is rebuilt on every
     edit, so a stored reference would be the version from before the keystroke. */
  const selectedPost = posts.find((post) => post.id === open) ?? null;

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-5 sm:px-10">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Blog
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-500">
          {posts.length} {posts.length === 1 ? "article" : "articles"}
          {drafts > 0 && `, ${drafts} in draft`}
        </p>
      </header>

      {/* A list beside the editor, not an accordion above it.
          Thirty-three collapsed rows put the fields of the fourth post below
          the fold, and opening one pushed every other row somewhere new — so
          finding the next post meant scrolling back through the one just
          edited. The list stays still and only the right-hand pane changes. */}
      <div
        className={`grid ${
          selectedPost ? "lg:grid-cols-[22rem_minmax(0,1fr)]" : "grid-cols-1"
        }`}
      >
        {/* Full width until an article is chosen, a column beside it after.
            A fixed narrow column cut every title off mid-word and left two
            thirds of the screen holding the words "Choose an article" — the
            list is the whole job until there is something to show beside it. */}
        <aside
          className={`border-b border-line bg-white ${
            selectedPost
              ? /* h-svh, not max-h-svh. A max-height leaves the box's height
                   undefined, so the `h-full` column inside it has nothing to
                   resolve against and the list grows past the fold instead of
                   scrolling within it. */
                "lg:sticky lg:top-0 lg:h-svh lg:self-start lg:border-r lg:border-b-0"
              : "border-b-0"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-line p-4">
              {/* Capped: a search box the width of a desktop screen is
                  harder to use than one the width of what it searches. */}
              <div className={`relative ${selectedPost ? "" : "max-w-md"}`}>
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter posts"
                  aria-label="Filter posts"
                  className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-10 text-sm outline-none transition placeholder:text-ink-400 focus:border-brand-500"
                />
              </div>

              <button
                type="button"
                onClick={addPost}
                className={`mt-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500 ${
                  selectedPost ? "w-full" : "w-auto"
                }`}
              >
                <PlusIcon className="size-4" />
                Add a post
              </button>
            </div>

            {/* min-h-0 is what lets this scroll inside the column rather than
                pushing it taller than the viewport. */}
            {/* pb-24 clears the fixed save bar, which would otherwise sit on
                top of the last two or three articles with no way to scroll
                them out from under it. */}
            <ul className="min-h-0 flex-1 overflow-y-auto p-2 pb-24 [scrollbar-width:thin]">
              {visible.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-ink-500">
                  Nothing matches &ldquo;{query}&rdquo;.
                </li>
              )}

              {visible.map((post) => {
                const selected = open === post.id;
                return (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(post.id)}
                      aria-current={selected ? "true" : undefined}
                      className={`mb-0.5 block w-full cursor-pointer rounded-xl px-3 py-2.5 text-left transition ${
                        selected ? "bg-brand-50" : "hover:bg-surface"
                      }`}
                    >
                      {/* Wrapped, not truncated. A list of articles whose
                          titles all end in an ellipsis is a list you cannot
                          read, and these run past forty characters. */}
                      <span
                        className={`block text-sm font-medium ${
                          selected ? "text-brand-600" : "text-ink-900"
                        }`}
                      >
                        {post.title || "Untitled post"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                        <span>{post.published || "No date"}</span>
                        {post.live === false && (
                          <span className="shrink-0 rounded-full bg-surface px-1.5 py-0.5 font-semibold text-ink-500">
                            Draft
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Rendered only when there is something to put in it. */}
        {selectedPost && (
          <div className="min-w-0 p-6 sm:p-8">
            <PostFields
              post={selectedPost}
              index={posts.findIndex((entry) => entry.id === selectedPost.id)}
              edit={edit}
              touchedSlugs={touchedSlugs}
              setTouchedSlugs={setTouchedSlugs}
              onDelete={() => void removePost(selectedPost.slug, selectedPost.title)}
              onClose={() => setOpen(null)}
            />
          </div>
        )}
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

/**
 * One article's fields, in the right-hand pane.
 *
 * Split out of the list so the list can stay still while this changes. It takes
 * `index` rather than looking the post up itself: every edit addresses
 * `d.blog.items[index]`, and recomputing that here would mean the same find on
 * every keystroke for no gain.
 */
function PostFields({
  post,
  index,
  edit,
  touchedSlugs,
  setTouchedSlugs,
  onDelete,
  onClose,
}: {
  post: BlogEntry;
  index: number;
  edit: (change: (draft: SiteContent) => void) => void;
  touchedSlugs: Set<string>;
  setTouchedSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const shipped = isShippedPost(post.slug);
  const draft = post.live === false;

  return (
    <div className="space-y-6">
      {/* The way back to the whole list. Without it, choosing one article
          narrows the list for the rest of the session. */}
      <button
        type="button"
        onClick={onClose}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-brand-500"
      >
        <ChevronDownIcon className="size-4 rotate-90" />
        All articles
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-snug font-semibold text-ink-900 sm:text-2xl">
            {post.title || "Untitled post"}
          </h2>
          {/* The address, and a way to open it. Live means two things have to
              be true: the entry is not a draft, and the page has actually been
              built — a post published five minutes ago has no page until the
              next deploy, and an Open button that 404s is worse than none. */}
          <div className="mt-2">
            <PagePath path={`/blog/${post.slug}`} live={shipped && !draft} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => edit((d) => void (d.blog.items[index].live = draft))}
            aria-pressed={!draft}
            title={
              draft
                ? "Draft — not on the site. Click to publish."
                : "Live on the site. Click to make it a draft."
            }
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              draft
                ? "border-line text-ink-500 hover:border-brand-200 hover:text-brand-500"
                : "border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
            }`}
          >
            {!draft && <CheckIcon className="size-3.5" />}
            {draft ? "Draft" : "Live"}
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${post.title || "this post"}`}
            title={`Delete ${post.title || "this post"}`}
            className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink-400 transition hover:bg-signal-50 hover:text-signal-500"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </header>

      <TextField
        label="Title"
        required
        value={post.title}
        onChange={(next) =>
          edit((d) => {
            d.blog.items[index].title = next;
            /* The address follows the title only while the post is new and the
               address has not been typed into — a live one is linked from other
               articles and must not move. */
            if (!shipped && !touchedSlugs.has(post.id)) {
              const slug = slugify(next);
              if (slug) d.blog.items[index].slug = slug;
            }
          })
        }
      />

      {shipped ? (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed text-ink-500">
          The address is fixed. Other articles link to it, and changing it would break every
          one of them.
        </p>
      ) : (
        <TextField
          label="Web address"
          hint="Lower case, words joined by hyphens. Becomes /blog/…"
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
          /* No future dates: this site builds to static files, so a post dated
             next week is live now and simply lies about when it was written. */
          max={today()}
          onChange={(next) => edit((d) => void (d.blog.items[index].published = next))}
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
        {/* Keyed on the post: switching articles must give the editor a new
            instance rather than reusing one still holding the last body. */}
        <RichDocEditor
          key={post.id}
          blocks={post.body}
          onChange={(next) => edit((d) => void (d.blog.items[index].body = next))}
        />
      </div>
    </div>
  );
}
