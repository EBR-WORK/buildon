"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { mediaLibrary } from "@/lib/cms/media";
import { ImagesIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useToast } from "./Toast";
import {
  canUpload,
  deleteUpload,
  listUploads,
  uploadImage,
  type StoredFile,
} from "@/lib/cms/storage";
import { TARGET_BYTES as IMAGE_TARGET } from "@/lib/cms/image";
import {
  describeSaving,
  downloadImage,
  formatBytes,
  MAX_STORED_BYTES,
  prepareImage,
  type PreparedImage,
} from "@/lib/cms/image";

/**
 * Choose an image: upload one from the device, or reuse one already here.
 *
 * Upload is the primary action. The file never leaves the browser — a static
 * export has no server to receive it — so it is resized and converted to webp
 * here, held in the draft as a data URL, and offered back as a file to commit
 * into public/. That is the honest shape of an upload at this stage, and the
 * conversion is the same one done by hand for the 291 images already here.
 *
 * When Supabase Storage arrives, `onUploaded` is where the PUT goes, and the
 * stored value becomes its URL instead of a data URL. Nothing else changes.
 */
export default function ImageField({
  label,
  hint,
  value,
  onChange,
  /** Narrows the "already here" list to one folder. */
  folder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  folder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [browsing, setBrowsing] = useState(false);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<PreparedImage | null>(null);
  /* What the last upload did to the file, shown once and cleared on the
     next change — an editor should see 9 MB become 280 KB. */
  const [saving, setSaving] = useState("");
  /* Chosen but not yet sent, because it is big enough that the editor should
     see what will happen to it first. */
  const [oversized, setOversized] = useState<File | null>(null);
  /** What is already in the bucket. Empty until the gallery is first opened. */
  const [uploads, setUploads] = useState<StoredFile[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const { confirm, notify } = useToast();

  /** The bucket folder uploads from this field land in — see handleFile. */
  const bucketFolder = folder ?? "uploads";

  /* Fetched when the gallery is opened and after each upload, not on mount:
     most visits never open it, and the listing is a network call. */
  const refreshUploads = useCallback(async () => {
    if (!canUpload()) return;
    setLoadingUploads(true);
    try {
      setUploads(await listUploads(bucketFolder));
    } finally {
      setLoadingUploads(false);
    }
  }, [bucketFolder]);

  function toggleGallery() {
    const next = !browsing;
    setBrowsing(next);
    if (next) void refreshUploads();
  }

  /**
   * Everything the editor may pick from: what has been uploaded to this
   * field's folder, then what is committed in public/.
   *
   * Uploads come first because they are the ones just added and the only ones
   * that can be removed from here — a file in public/ is in the repository,
   * and no button in a browser can reach it.
   */
  const choices = useMemo(() => {
    const scoped = folder
      ? mediaLibrary.filter((file) => file.startsWith(`/${folder}/`))
      : mediaLibrary;
    const all = [
      ...uploads.map((file) => ({
        src: file.url,
        name: file.name,
        path: file.path as string | undefined,
      })),
      ...scoped.map((file) => ({
        src: file,
        name: file.split("/").pop() ?? file,
        path: undefined as string | undefined,
      })),
    ];
    const needle = filter.trim().toLowerCase();
    return needle ? all.filter((file) => file.name.toLowerCase().includes(needle)) : all;
  }, [folder, filter, uploads]);

  /**
   * Remove an uploaded file from the bucket.
   *
   * Deleting the one this field points at clears the field too: leaving the
   * value behind would keep showing an image that no longer exists and publish
   * a 404 on the next save.
   */
  async function handleDelete(file: { path: string; name: string; src: string }) {
    const inUseHere = value === file.src;
    const ok = await confirm({
      title: `Delete ${file.name}?`,
      body: inUseHere
        ? "This is the image set above, so the field will be cleared too. If any other page uses it, that page will break — deleting cannot be undone."
        : "This removes the file from storage for good. If any page uses it, that page will break — run npm run db:prune to see what is safe to remove.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      await deleteUpload(file.path);
      if (inUseHere) onChange("");
      setUploads((all) => all.filter((item) => item.path !== file.path));
      notify(`${file.name} deleted`, undefined, "success");
    } catch (e) {
      notify("Could not delete that file", e instanceof Error ? e.message : undefined, "danger");
    }
  }

  const isUpload = value.startsWith("data:");
  /* An uploaded file is an absolute URL and lives in the bucket, not in the
   manifest, so only a local path that the manifest does not know is missing. */
  const missing =
    Boolean(value) && !isUpload && !value.startsWith("http") && !mediaLibrary.includes(value);

  /**
   * Convert, then send it somewhere real.
   *
   * With storage connected the file goes to the bucket and what is stored is
   * its URL. Without it, the old behaviour stands: the image is held in the
   * draft as a data URL and offered back as a file to commit into public/ —
   * which is the only thing that works with no server and no bucket.
   */
  async function handleFile(file: File | undefined, confirmed = false) {
    if (!file) return;

    /* Over the budget is over the budget. An editor asked to be told whether
       the file they picked is usable, so the line is the budget itself rather
       than a multiple of it that quietly lets middling files through. */
    if (!confirmed && canUpload() && file.size > IMAGE_TARGET) {
      setOversized(file);
      setError("");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (canUpload()) {
        const result = await uploadImage(file, folder ?? "uploads");
        setUploaded(null);
        setOversized(null);
        setSaving(
          result.prepared.originalBytes <= IMAGE_TARGET
            ? `Uploaded ${formatBytes(result.prepared.bytes)} - already a good size`
            : describeSaving(result.prepared),
        );
        onChange(result.url);
        /* So the file that was just sent is in the gallery, not only in the
           field — without this it is invisible until the panel is reloaded. */
        void refreshUploads();
        return;
      }

      const prepared = await prepareImage(file);

      if (prepared.bytes > MAX_STORED_BYTES) {
        setError(
          `That image is still ${formatBytes(prepared.bytes)} after compression — too large to hold in a draft. Try a smaller crop.`,
        );
        return;
      }

      setUploaded(prepared);
      setSaving(describeSaving(prepared));
      onChange(prepared.dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That image could not be read.");
    } finally {
      setBusy(false);
      /* Cleared so choosing the same file twice still fires a change. */
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</span>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
            {value ? (
              <Image src={value} alt="" fill sizes="7rem" unoptimized className="object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-center text-xs text-ink-400">
                No image
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            {/* Upload and gallery are both buttons, side by side. The gallery
                used to be an underlined link under a path box, which made the
                291 images already here the hardest of the three routes to
                find — and the raw path the easiest to get wrong. */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon className="size-4" />
                {busy ? "Processing…" : value ? "Replace image" : "Upload image"}
              </button>

              <button
                type="button"
                onClick={toggleGallery}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
              >
                <ImagesIcon className="size-4" />
                {browsing ? "Close gallery" : "Choose from gallery"}
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setUploaded(null);
                    setError("");
                    setSaving("");
                    setOversized(null);
                  }}
                  className="cursor-pointer px-2 text-sm font-semibold text-ink-500 transition hover:text-signal-500"
                >
                  Remove
                </button>
              )}
            </div>

            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {hint ?? "Pick a photo from your device. It is resized and converted to webp here."}
            </p>

            {error && <p className="mt-1.5 text-sm text-signal-500">{error}</p>}

            {/* Big enough to be worth a word before it is sent. The numbers
                come first: "9.4 MB, and a page shows nine of these" is the
                reason, and the button is only the answer to it. */}
            {oversized && !busy && (
              <div className="mt-3 rounded-xl border border-signal-200 bg-signal-50 p-4">
                <p className="text-sm font-semibold text-ink-900">
                  {formatBytes(oversized.size)} is too large for the site.
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  Pages here show up to nine images at once, so each one needs to be
                  about {formatBytes(IMAGE_TARGET)}. Compressing resizes it to 1600px
                  and converts it to webp in the browser; only the smaller file is
                  uploaded, and the original is never stored.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleFile(oversized, true)}
                    className="cursor-pointer rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
                  >
                    Compress and upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setOversized(null)}
                    className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200"
                  >
                    Choose a different file
                  </button>
                </div>
              </div>
            )}

            {saving && !error && (
              <p className="mt-1.5 text-sm font-medium text-brand-600">Compressed: {saving}</p>
            )}

            {missing && (
              <p className="mt-1.5 text-sm text-signal-500">
                No file at this path. Upload one, or run <code>npm run media</code> if you
                have just added it.
              </p>
            )}

            {/* An uploaded file lives in the draft only. It has to be saved into
                public/ for the built site to find it, and the panel says so
                rather than leaving the editor to discover a missing image. */}
            {uploaded && isUpload && (
              <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-3">
                <p className="text-sm text-ink-900">
                  <strong className="font-semibold">{uploaded.filename}</strong> ·{" "}
                  {uploaded.width}×{uploaded.height} · {formatBytes(uploaded.bytes)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  Held in this draft so you can see it. Save the file and drop it into{" "}
                  <code>public/{folder ?? "uploads"}/</code>, then set the path below — until
                  file storage is connected, that is what the built site reads.
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadImage(uploaded)}
                    className="cursor-pointer rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink-900 transition hover:border-brand-500 hover:text-brand-500"
                  >
                    Save file
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(`/${folder ?? "uploads"}/${uploaded.filename}`)}
                    className="cursor-pointer text-sm text-brand-500 underline"
                  >
                    Use that path
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* The raw path, behind a disclosure. It is still the only way to point
            at a file that is committed but not yet in the manifest, so it
            stays — just not as the first thing an editor reaches for. */}
        <details className="mt-4 border-t border-line pt-3">
          <summary className="cursor-pointer text-sm font-medium text-ink-500 transition hover:text-ink-900">
            Or type a path
          </summary>
          <input
            type="text"
            value={isUpload ? "" : value}
            placeholder="/products/example.webp"
            aria-label="Image path"
            onChange={(event) => {
              setUploaded(null);
              onChange(event.target.value);
            }}
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </details>
      </div>

      {browsing && (
        <div className="mt-3 rounded-2xl border border-line bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <input
              type="search"
              value={filter}
              placeholder="Filter by name…"
              onChange={(event) => setFilter(event.target.value)}
              className="w-full max-w-xs rounded-full border border-line px-4 py-2 text-sm outline-none transition focus:border-brand-500 sm:w-64"
            />
            <span className="text-sm text-ink-500">
              {loadingUploads && uploads.length === 0
                ? "Loading uploads…"
                : `${choices.length} ${choices.length === 1 ? "image" : "images"}`}
            </span>
          </div>

          <ul className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
            {choices.map((file) => (
              <li key={file.src} className="group relative">
                {/* Choosing and deleting are separate buttons, not one tile
                    with a corner that does something else: nesting them would
                    fire the choice when the bin is pressed. */}
                <button
                  type="button"
                  onClick={() => {
                    setUploaded(null);
                    onChange(file.src);
                    setBrowsing(false);
                  }}
                  title={file.name}
                  className={`block w-full cursor-pointer overflow-hidden rounded-lg border-2 transition ${
                    file.src === value ? "border-brand-500" : "border-transparent hover:border-brand-200"
                  }`}
                >
                  <span className="relative block aspect-square bg-surface">
                    <Image src={file.src} alt="" fill sizes="8rem" className="object-cover" />
                  </span>
                  <span className="block truncate px-1 py-1 text-[11px] text-ink-500">
                    {file.name}
                  </span>
                </button>

                {file.path && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete({ path: file.path!, name: file.name, src: file.src })
                    }
                    aria-label={`Delete ${file.name}`}
                    title={`Delete ${file.name}`}
                    /* Always there on touch, where there is no hover to reveal
                       it; faded in on a pointer so it does not sit over every
                       thumbnail in a grid of sixty. */
                    className="absolute top-1.5 right-1.5 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white opacity-100 backdrop-blur-sm transition hover:bg-signal-500 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {choices.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-500">Nothing matches that.</p>
          )}
        </div>
      )}
    </div>
  );
}
