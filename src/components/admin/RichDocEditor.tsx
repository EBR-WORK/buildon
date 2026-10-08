"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import type { BlogBlockEntry } from "@/lib/cms/schema";
import { blocksToDoc, docToBlocks, sameBlocks, type RichDoc } from "@/lib/cms/richdoc";
import { BlockLabels } from "@/lib/cms/blockLabels";
import { internalRoutes } from "@/lib/cms/schema";
import { ImagesIcon, PlusIcon } from "@/components/icons";
import ImageField from "./ImageField";
import { measureImage } from "@/lib/cms/storage";

/**
 * The post body, written the way it reads.
 *
 * Contextual rather than chrome: there is no permanent toolbar. A bar appears
 * over text when something is selected, and a plus appears in the gutter of an
 * empty line. That is how a rich text field behaves in Webflow, Notion and
 * most things written since, and the reason is the same in all of them — an
 * article is mostly uninterrupted typing, and a strip of buttons along the top
 * is in view for all of it while being useful for almost none.
 *
 * The schema is cut down to exactly what the renderer understands. StarterKit
 * ships blockquote, code blocks, horizontal rules, strike, italic and more;
 * every one would be typeable, saveable, and then silently dropped by
 * published.ts on the way to the site. An editor that cannot produce them is
 * better than one that accepts them and lies.
 *
 * The conversion both ways lives in richdoc.ts and is verified by
 * `npm run check:richdoc`, which round-trips all thirty-three posts and every
 * one of their hundred and fifty-one links before any of this is trusted.
 */

const ITEM =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition";

export default function RichDocEditor({
  blocks,
  onChange,
}: {
  blocks: BlogBlockEntry[];
  onChange: (next: BlogBlockEntry[]) => void;
}) {
  const [linking, setLinking] = useState(false);
  const [inserting, setInserting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        /* Everything the site cannot render, switched off at the schema so it
           cannot be typed in the first place. */
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        italic: false,
        orderedList: false,
        heading: { levels: [2, 3] },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        /* The href is written into the page, so the schemes it may carry are
           the ones a browser should follow. javascript: and data: are not. */
        protocols: ["http", "https"],
        HTMLAttributes: { rel: "noopener" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      BlockLabels,
    ],

    content: blocksToDoc(blocks),

    /* Next renders this during `next build`; without it the first client
       render disagrees with that HTML and React replaces the whole subtree. */
    immediatelyRender: false,

    editorProps: {
      attributes: {
        class:
          "prose-admin min-h-[26rem] w-full px-12 py-6 text-[15px] leading-relaxed text-ink-900 outline-none",
      },
    },

    onUpdate: ({ editor: instance }) => {
      const next = docToBlocks(instance.getJSON() as RichDoc);
      /* Compared before reporting: TipTap fires on selection changes and on
         edits that leave the document identical, and each of those would
         otherwise mark the form dirty and re-render the editor screen. */
      if (!sameBlocks(next, blocks)) onChange(next);
    },
  });

  /* The row being edited can change under this component — switching posts in
     the list keeps the same editor mounted. Without this the second post opens
     showing the first one's body. */
  useEffect(() => {
    if (!editor) return;
    const current = docToBlocks(editor.getJSON() as RichDoc);
    if (sameBlocks(current, blocks)) return;
    editor.commands.setContent(blocksToDoc(blocks), { emitUpdate: false });
  }, [editor, blocks]);

  const setLink = useCallback(
    (href: string) => {
      if (!editor) return;
      if (!href) editor.chain().focus().unsetLink().run();
      else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      setLinking(false);
    },
    [editor],
  );

  if (!editor) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 text-[15px] text-ink-500">
        Loading the editor…
      </div>
    );
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-ink-900">Body</h3>
        <span className="text-sm text-ink-500">
          {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
        </span>
      </div>

      {/* Not overflow-hidden: the bubble menu floats above the selection, and
          over the first line that puts it outside this box. Clipping it would
          leave the formatting controls invisible exactly where an article
          starts. The footer rounds its own corners instead. */}
      <div className="relative rounded-2xl border border-line bg-white">
        {/* Over the selection. Two modes: the tools, and the link editor —
            which belongs here rather than in a panel at the top of the box,
            because it is about the words that are highlighted and needs to be
            where they are. */}
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e, from, to }) => from !== to && !e.isActive("image")}
          options={{ placement: "top", offset: 8 }}
          className="flex items-center gap-0.5 rounded-xl border border-ink-900/10 bg-ink-900 p-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)]"
        >
          {linking ? (
            <LinkBar
              editor={editor}
              onApply={setLink}
              onClose={() => setLinking(false)}
            />
          ) : (
            <>
              <Dark
                label="Bold"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <span className="font-bold">B</span>
              </Dark>
              <Dark
                label={editor.isActive("link") ? "Edit link" : "Link"}
                active={editor.isActive("link")}
                onClick={() => setLinking(true)}
              >
                Link
              </Dark>

              <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />

              <Dark
                label="Heading"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                H2
              </Dark>
              <Dark
                label="Sub-heading"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                H3
              </Dark>
              <Dark
                label="Bulleted list"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                &bull; List
              </Dark>
            </>
          )}
        </BubbleMenu>

        {/* A selected image. Alt text is the only thing worth editing here and
            there was no way to set it at all — every inserted picture went to
            the site with an empty alt. */}
        <BubbleMenu
          editor={editor}
          pluginKey="imageMenu"
          shouldShow={({ editor: e }) => e.isActive("image")}
          options={{ placement: "bottom", offset: 8 }}
          className="flex items-center gap-2 rounded-xl border border-line bg-white p-2 shadow-card"
        >
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-500">Alt text</span>
            <input
              type="text"
              value={(editor.getAttributes("image").alt as string) ?? ""}
              placeholder="What the image shows"
              onChange={(event) =>
                editor.chain().updateAttributes("image", { alt: event.target.value }).run()
              }
              className="w-56 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().deleteSelection().run()}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink-500 transition hover:bg-signal-50 hover:text-signal-500"
          >
            Remove
          </button>
        </BubbleMenu>

        {/* In the gutter of an empty line — what to put here, rather than what
            to do to what is already there. */}
        <FloatingMenu
          editor={editor}
          shouldShow={({ editor: e, state }) => {
            const { $from, empty } = state.selection;
            return empty && $from.parent.type.name === "paragraph" && $from.parent.childCount === 0 && e.isEditable;
          }}
          options={{ placement: "left-start", offset: 8 }}
          className="flex items-center gap-0.5 rounded-xl border border-line bg-white p-1 shadow-card"
        >
          <Pale label="Heading" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </Pale>
          <Pale label="Sub-heading" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </Pale>
          <Pale label="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            &bull;
          </Pale>
          <Pale label="Insert an image" onClick={() => setInserting(true)}>
            <ImagesIcon className="size-4" />
          </Pale>
        </FloatingMenu>

        {/* A dialog, not a strip at the top of the box.
            Inline, it rendered above the whole article — so clicking the icon
            with the cursor partway down a long post scrolled nothing into
            view and looked exactly like a dead button. */}
        {inserting && (
          <ImageDialog
            onClose={() => setInserting(false)}
            onPick={(src) => {
              /* Raced against a timeout: a probe <img> whose load neither
                 succeeds nor errors — a blocked request, an unreachable
                 bucket — leaves a promise that never settles, and with the
                 insert inside .then() the picture never appears. The
                 dimensions are worth waiting a moment for, not forever. */
              const measured = Promise.race([
                measureImage(src),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
              ]).catch(() => null);

              void measured
                .then((size) =>
                  editor
                    .chain()
                    .focus()
                    .setImage(size ? { src, alt: "", ...size } : { src, alt: "" })
                    .run(),
                )
                .finally(() => setInserting(false));
            }}
          />
        )}

        <EditorContent editor={editor} />

        {/* The only permanent control, because an empty document has no line to
            put a cursor on and nothing to select. */}
        <div className="flex items-center gap-3 rounded-b-2xl border-t border-line bg-surface px-5 py-2.5">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus("end").createParagraphNear().run()}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-500"
          >
            <PlusIcon className="size-4" />
            New line
          </button>

          {/* Also here, not only in the gutter menu. That menu appears on an
              empty paragraph and nowhere else, so adding a picture after a
              paragraph of text meant pressing Enter first and noticing a menu
              that had not been there a moment earlier — which is no way to
              find a feature. */}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              /* Focused first so the picture lands where the cursor is rather
                 than at the top of an editor that was never clicked into. */
              editor.chain().focus().run();
              setInserting(true);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-500"
          >
            <ImagesIcon className="size-4" />
            Add an image
          </button>

          <p className="ml-auto text-xs text-ink-400">
            Select text to format it
          </p>
        </div>
      </div>
    </section>
  );
}

/** A button on the dark selection bar. */
function Dark({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      /* The selection is lost the moment the bar takes focus, and every command
         here acts on the selection. */
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`${ITEM} ${active ? "bg-white text-ink-900" : "text-white/80 hover:bg-white/15 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

/** A button on the pale gutter menu. */
function Pale({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`${ITEM} text-ink-500 hover:bg-surface hover:text-brand-500`}
    >
      {children}
    </button>
  );
}

/**
 * The link editor, inside the selection bar.
 *
 * One input rather than a grid of route buttons: the internal pages are
 * offered through a datalist, so they autocomplete without taking the space
 * eleven buttons would — and a URL that is not on the list can still be typed,
 * which the button grid could not do without a second control beside it.
 */
function LinkBar({
  editor,
  onApply,
  onClose,
}: {
  editor: Editor;
  onApply: (href: string) => void;
  onClose: () => void;
}) {
  const existing = (editor.getAttributes("link").href as string) ?? "";
  const [href, setHref] = useState(existing);
  const [error, setError] = useState("");

  function apply() {
    const value = href.trim();
    if (!value) {
      onApply("");
      return;
    }

    /* A path on this site needs no further checking — it cannot carry a
       scheme, which is the only thing dangerous about an href. */
    if (value.startsWith("/")) {
      onApply(value);
      return;
    }

    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        setError("Only http and https.");
        return;
      }
      onApply(url.toString());
    } catch {
      setError("Use a full URL, or a path starting with /");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        list="admin-internal-routes"
        autoFocus
        value={href}
        placeholder="/about-us or https://"
        onChange={(event) => {
          setHref(event.target.value);
          setError("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
          if (event.key === "Escape") onClose();
        }}
        className="w-60 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/50"
      />
      <datalist id="admin-internal-routes">
        {internalRoutes.map((route) => (
          <option key={route} value={route} />
        ))}
      </datalist>

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={apply}
        className={`${ITEM} bg-white text-ink-900`}
      >
        Apply
      </button>

      {existing && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onApply("")}
          title="Remove link"
          className={`${ITEM} text-white/80 hover:bg-white/15 hover:text-white`}
        >
          Unlink
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        title="Cancel"
        className={`${ITEM} text-white/60 hover:text-white`}
      >
        &times;
      </button>

      {error && (
        <span className="max-w-[12rem] text-xs font-medium text-signal-300">{error}</span>
      )}
    </div>
  );
}

/**
 * Choosing a picture, over the top of everything.
 *
 * Fixed rather than inline because the editor runs to several screens and an
 * inline panel opens wherever the markup puts it, not where the editor is
 * looking. A dialog is in the same place every time.
 */
function ImageDialog({
  onPick,
  onClose,
}: {
  onPick: (src: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add an image to the article"
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 sm:p-8"
      /* Only a click that both starts and ends on the backdrop closes it —
         otherwise a drag that began inside the card and released outside, as
         happens when selecting text in a field, would shut it. */
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)]">
        <h3 className="mb-1 font-display text-lg font-semibold text-ink-900">
          Add an image to the article
        </h3>
        <p className="mb-5 text-sm text-ink-500">
          It is placed where the cursor is. Large files are compressed first.
        </p>

        <ImageField
          label="Image"
          folder="blog"
          value=""
          onChange={(src) => {
            if (src) onPick(src);
          }}
        />

        <button
          type="button"
          onClick={onClose}
          className="mt-5 cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
