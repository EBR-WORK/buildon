"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ConflictError, repository } from "@/lib/cms/repository";
import {
  cloneDefaults,
  isShippedProduct,
  newId,
  slugify,
  type SiteContent,
} from "@/lib/cms/schema";
import { PagePath, TextAreaField, TextField } from "./Fields";
import { PlusIcon } from "@/components/icons";
import ImageField from "./ImageField";
import { describeUsage, productUsage } from "@/lib/cms/usage";
import RichTextField from "./RichTextField";
import EntryRow from "./EntryRow";
import SaveBar, { type Status } from "./SaveBar";
import { describeProblems, validateProducts } from "@/lib/cms/validate";
import { useToast } from "./Toast";

/**
 * The products editor: the grid's own heading and intro, then each of the nine
 * products.
 *
 * One product open at a time. Nine expanded forms on one screen is a wall; an
 * accordion keeps the list readable and makes it obvious which product is being
 * changed.
 *
 * The intro is the rich text field — the first place on the site where an
 * editor can set bold and links inside a sentence, and the model the blog will
 * need later.
 */
export default function ProductsEditor() {
  const { confirm, notify } = useToast();

  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  /* Slugs the editor has typed into: once touched, the name stops driving it. */
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
    const blocking = validateProducts(content);
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

  /**
   * A new, empty product, opened for editing straight away.
   *
   * It gets a placeholder slug so React has a stable key immediately; typing a
   * name replaces it, because the slug is the page's address and should be seen
   * being set rather than discovered later.
   */
  function addProduct() {
    const id = newId();
    /* A placeholder address until the name supplies one. */
    const slug = "new-product-" + Date.now().toString(36);
    edit((d) =>
      void d.products.items.push({
        id,
        /* New work starts as a draft: incomplete entries should not reach
           the site by being forgotten. */
        live: false,
        slug,
        name: "",
        cardBody: "",
        image: "",
        intro: [],
      }),
    );
    setOpen(id);
  }

  /**
   * Delete, with the consequences spelled out.
   *
   * A live product is linked from the grid, from other products' suggestions,
   * and from blog articles mid-sentence. Those links do not vanish with the
   * page, so the dialog counts them instead of asking a vague "are you sure?".
   */
  async function removeProduct(slug: string, name: string) {
    const live = isShippedProduct(slug);

    const ok = await confirm({
      title: `Delete “${name || slug}”?`,
      body: live
        ? [
            `The page at /products/${slug} will no longer exist.`,
            describeUsage(productUsage(slug), "product"),
            "This cannot be undone.",
          ].join("\n")
        : "This product was never published. This cannot be undone.",
      confirmLabel: "Delete product",
    });
    if (!ok) return;

    edit((d) => void (d.products.items = d.products.items.filter((item) => item.slug !== slug)));
    setOpen(null);
    notify("Deleted", `“${name || slug}” is gone from the draft.`);
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

  /* Recomputed on every render rather than on save: an editor should see
     a problem while they can still fix it, not after pressing Save. */
  const problems = content ? validateProducts(content) : [];

  if (!content) {
    return (
      <div className="p-6 sm:p-10">
        <p className="text-[15px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const { products } = content;

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Products
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          The products grid and the opening paragraph of each product&rsquo;s own
          page.
        </p>
      </header>

      <div className="space-y-10 p-6 sm:p-10">
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <header className="mb-6 border-b border-line pb-4">
            <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
              Grid heading
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              What sits above the nine product cards on /products.
            </p>
          </header>

          <div className="space-y-5">
            <TextField
              label="Heading"
              required
              value={products.heading}
              onChange={(next) => edit((d) => void (d.products.heading = next))}
            />
            <TextAreaField
              label="Intro"
              rows={2}
              required
              value={products.intro}
              onChange={(next) => edit((d) => void (d.products.intro = next))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <header className="mb-6 border-b border-line pb-4">
            <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
              The products
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              {products.items.length} products. The slug is the page&rsquo;s URL and
              cannot be changed here — renaming one would break every link to it.
            </p>
          </header>

          <ul className="space-y-3">
            {products.items.map((product, i) => {
              const isOpen = open === product.id;
              const shipped = isShippedProduct(product.slug);
              const duplicate =
                products.items.filter((other) => other.slug === product.slug).length > 1;
              const slugError = !product.slug
                ? "A web address is required."
                : duplicate
                  ? "Another product already uses this address."
                  : null;

              return (
                <EntryRow
                  key={product.id}
                  title={product.name || "Untitled product"}
                  subtitle={`/products/${product.slug}`}
                  badge={
                    !shipped ? (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                        New
                      </span>
                    ) : null
                  }
                  thumb={
                    product.image ? (
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          sizes="2.5rem"
                          className="object-cover"
                        />
                      </span>
                    ) : null
                  }
                  isOpen={isOpen}
                  onToggle={() => setOpen(isOpen ? null : product.id)}
                  live={product.live}
                  onToggleLive={() =>
                    edit((d) => void (d.products.items[i].live = !d.products.items[i].live))
                  }
                  onDelete={() => void removeProduct(product.slug, product.name)}
                  deleteLabel={`Delete ${product.name || "this product"}`}
                >
                  <TextField
                        label="Name"
                        required
                        hint="Shown on the card, the page heading and in search."
                        value={product.name}
                        onChange={(next) =>
                          edit((d) => {
                            d.products.items[i].name = next;
                            /* A product that has never been published can take
                               its address from its name; a live one cannot, so
                               the URL stays put. */
                            if (!shipped && !touchedSlugs.has(product.id)) {
                              const slug = slugify(next);
                              if (slug) d.products.items[i].slug = slug;
                            }
                          })
                        }
                      />

                      {shipped ? (
                        <div className="rounded-xl bg-surface px-4 py-3">
                          {/* The address, and a way to open it. Live needs both:
                              not a draft, and already built — a page published
                              minutes ago does not exist until the next deploy. */}
                          <PagePath path={`/products/${product.slug}`} live={product.live !== false} />
                          <p className="mt-2 text-sm leading-relaxed text-ink-500">
                            The address is fixed. Changing it would break every link to
                            this page.
                          </p>
                        </div>
                      ) : (
                        <TextField
                          label="Web address"
                          hint={
                            slugError ??
                            "Lower case, words joined by hyphens. Becomes /products/\u2026"
                          }
                          value={product.slug}
                          onChange={(next) => {
                            const slug = slugify(next);
                            setTouchedSlugs((prev) => new Set(prev).add(product.id));
                            edit((d) => void (d.products.items[i].slug = slug));
                          }}
                        />
                      )}

                      <TextAreaField
                        label="Card summary"
                        required
                        hint="The line under the name on the products grid."
                        rows={2}
                        value={product.cardBody}
                        onChange={(next) =>
                          edit((d) => void (d.products.items[i].cardBody = next))
                        }
                      />

                      <ImageField
                        label="Thumbnail"
                        hint="Shown on the products grid and wherever this product is suggested. Square-ish crops work best."
                        folder="products"
                        value={product.image}
                        onChange={(next) => edit((d) => void (d.products.items[i].image = next))}
                      />

                      <RichTextField
                        label="Opening paragraph"
                        hint="Select words, then Bold or Link. Links can only point at pages that exist."
                        runs={product.intro}
                        onChange={(next) =>
                          edit((d) => void (d.products.items[i].intro = next))
                        }
                        rows={7}
                      />

                  {shipped && (
                        <p className="border-t border-line pt-4 text-sm text-ink-500">
                          {describeUsage(productUsage(product.slug), "product")}
                        </p>
                      )}
                </EntryRow>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={addProduct}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
          >
            <PlusIcon className="size-4" />
            Add a product
          </button>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
            A new product joins the grid once the content is exported and the
            site is rebuilt. Its own page also needs specifications and
            photographs, which still live in the product modules \u2014 those move
            into the panel in a later slice.
          </p>
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
