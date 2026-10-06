"use client";

import { useState } from "react";
import { newId, type BlogBlockEntry, type RichRun } from "@/lib/cms/schema";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Field, TextField } from "./Fields";
import ImageField from "./ImageField";
import RichTextField from "./RichTextField";
import { useToast } from "./Toast";

/**
 * A post's body: an ordered list of typed blocks.
 *
 * The blog renderer understands five kinds and no more, so the editor offers
 * exactly those five. A free-form HTML box would let an editor write markup the
 * renderer drops on the floor — which is how the reference's own content lost
 * 143 links before they were recovered.
 *
 * Each block is edited in place rather than behind a collapse. A post is read
 * top to bottom and written the same way, and a body of fifteen collapsed rows
 * hides the one thing the editor came to check: how it reads.
 */

const KINDS = [
  { kind: "p", label: "Paragraph" },
  { kind: "h2", label: "Heading" },
  { kind: "h3", label: "Sub-heading" },
  { kind: "ul", label: "Bulleted list" },
  { kind: "image", label: "Image" },
] as const;

/** A fresh block of the given kind. */
function blank(kind: BlogBlockEntry["kind"]): BlogBlockEntry {
  const id = newId();
  switch (kind) {
    case "h2":
    case "h3":
      return { id, kind, text: "" };
    case "ul":
      return { id, kind: "ul", items: [[]] };
    case "image":
      /* 1600x1200 matches what prepareImage caps an upload to, so a block added
         and then filled from the gallery already has the right ratio. */
      return { id, kind: "image", src: "", alt: "", width: 1600, height: 1200 };
    default:
      return { id, kind: "p", runs: [] };
  }
}

/** The words shown on a block's own header. */
function describe(block: BlogBlockEntry) {
  const label = KINDS.find((entry) => entry.kind === block.kind)?.label ?? block.kind;
  switch (block.kind) {
    case "h2":
    case "h3":
      return `${label} — ${block.text || "empty"}`;
    case "ul":
      return `${label} — ${block.items.length} ${block.items.length === 1 ? "bullet" : "bullets"}`;
    case "image":
      return `${label} — ${block.src ? block.src.split("/").pop() : "none chosen"}`;
    default: {
      const text = block.runs.map((run) => run.text).join("");
      return `${label} — ${text ? `${text.slice(0, 60)}${text.length > 60 ? "…" : ""}` : "empty"}`;
    }
  }
}

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: BlogBlockEntry[];
  onChange: (next: BlogBlockEntry[]) => void;
}) {
  const { confirm } = useToast();
  const [adding, setAdding] = useState(false);

  const update = (index: number, next: BlogBlockEntry) =>
    onChange(blocks.map((block, i) => (i === index ? next : block)));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  async function remove(index: number) {
    const ok = await confirm({
      title: "Delete this block?",
      body: describe(blocks[index]),
      confirmLabel: "Delete block",
    });
    if (ok) onChange(blocks.filter((_, i) => i !== index));
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-ink-900">Body</h3>
        <span className="text-sm text-ink-500">
          {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
        </span>
      </div>

      <ul className="space-y-3">
        {blocks.map((block, i) => (
          <li key={block.id} className="rounded-2xl border border-line bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
              <span className="min-w-0 truncate text-sm text-ink-500">
                <span className="font-semibold text-ink-900">{i + 1}.</span> {describe(block)}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ChevronDownIcon className="size-4 rotate-180" />
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={i === blocks.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ChevronDownIcon className="size-4" />
                </IconButton>
                <IconButton label="Delete block" danger onClick={() => void remove(i)}>
                  <TrashIcon className="size-4" />
                </IconButton>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <BlockFields block={block} onChange={(next) => update(i, next)} />
            </div>
          </li>
        ))}
      </ul>

      {/* The kind is chosen before the block exists, not changed afterwards: a
          paragraph turned into an image has no sensible answer for what
          happens to its text. */}
      {adding ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-ink-900">Add which kind of block?</p>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((entry) => (
              <button
                key={entry.kind}
                type="button"
                onClick={() => {
                  onChange([...blocks, blank(entry.kind)]);
                  setAdding(false);
                }}
                className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
              >
                {entry.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-ink-500 transition hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          <PlusIcon className="size-4" />
          Add a block
        </button>
      )}
    </section>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: BlogBlockEntry;
  onChange: (next: BlogBlockEntry) => void;
}) {
  if (block.kind === "h2" || block.kind === "h3") {
    return (
      <>
        <TextField
          label={block.kind === "h2" ? "Heading" : "Sub-heading"}
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
        />

        {/* Optional, and rarely used: one heading on the whole site carries a
            link today. The hint names the constraint that actually bites —
            the phrase has to appear in the heading or nothing is linked. */}
        <details className="rounded-xl border border-line bg-surface px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink-900">
            Link part of this heading
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Phrase to link"
              hint="Must appear in the heading word for word."
              value={block.linkText ?? ""}
              onChange={(linkText) => onChange({ ...block, linkText: linkText || undefined })}
            />
            <TextField
              label="Goes to"
              hint="A path on this site, e.g. /blog/some-post"
              value={block.linkHref ?? ""}
              onChange={(linkHref) => onChange({ ...block, linkHref: linkHref || undefined })}
              placeholder="/blog/…"
            />
          </div>
        </details>
      </>
    );
  }

  if (block.kind === "p") {
    return (
      <RichTextField
        label="Paragraph"
        hint="Select text, then Bold or Link."
        runs={block.runs}
        onChange={(runs) => onChange({ ...block, runs })}
      />
    );
  }

  if (block.kind === "ul") {
    const setItem = (index: number, runs: RichRun[]) =>
      onChange({ ...block, items: block.items.map((item, i) => (i === index ? runs : item)) });

    return (
      <Field label="Bullets" hint="Each bullet takes its own formatting and links.">
        <ul className="space-y-3">
          {block.items.map((item, i) => (
            /* Keyed by index, which is safe here only because a bullet is
               never reordered — the controls below add and remove at the end
               and in place, so index identity holds. */
            <li key={i} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  Bullet {i + 1}
                </span>
                <IconButton
                  label="Remove bullet"
                  danger
                  disabled={block.items.length <= 1}
                  onClick={() =>
                    onChange({ ...block, items: block.items.filter((_, n) => n !== i) })
                  }
                >
                  <TrashIcon className="size-4" />
                </IconButton>
              </div>
              <RichTextField
                label={`Bullet ${i + 1}`}
                rows={2}
                runs={item}
                onChange={(runs) => setItem(i, runs)}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => onChange({ ...block, items: [...block.items, []] })}
          className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          <PlusIcon className="size-4" />
          Add bullet
        </button>
      </Field>
    );
  }

  /* Explicit rather than relying on what the three returns above ruled out:
     h2 and h3 share one union member, so narrowing it away with `||` leaves
     TypeScript still holding it here. */
  if (block.kind !== "image") return null;

  return (
    <>
      <ImageField
        label="Image"
        folder="blog"
        value={block.src}
        onChange={(src) => onChange({ ...block, src })}
      />
      <TextField
        label="Alt text"
        hint="What the image shows, for a reader who cannot see it. Leave empty only if it is decorative."
        value={block.alt}
        onChange={(alt) => onChange({ ...block, alt })}
      />

      {/* Both are required by next/image and reserve the space before the file
          loads, which is what stops the article jumping as it comes in. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Width"
          hint="In pixels."
          value={String(block.width)}
          onChange={(value) => onChange({ ...block, width: Number(value) || 0 })}
        />
        <TextField
          label="Height"
          hint="In pixels. Together these set the aspect ratio."
          value={String(block.height)}
          onChange={(value) => onChange({ ...block, height: Number(value) || 0 })}
        />
      </div>
    </>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-8 cursor-pointer place-items-center rounded-lg text-ink-500 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? "hover:bg-signal-50 hover:text-signal-500" : "hover:bg-surface hover:text-ink-900"
      }`}
    >
      {children}
    </button>
  );
}
