"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { videoLibrary } from "@/lib/cms/media";
import { formatBytes } from "@/lib/cms/image";
import { CheckIcon, PlayIcon, PlusIcon, SearchIcon } from "@/components/icons";

/**
 * Choose the background video: one already here, or a file from the device.
 *
 * Unlike ImageField, a chosen file is never inlined into the draft. An image is
 * resized to a few hundred kilobytes and survives as a data URL; the banner
 * video in this repo is 34 MB, and base64 adds a third again. localStorage
 * holds about five megabytes in total, so inlining one would not fail at the
 * edge — it would fail every time, after the editor had waited for the encode.
 *
 * So an upload here is explicit about the two steps it really takes: the file
 * is previewed from an object URL, and saving it writes it to the computer to
 * be committed into public/. The path is what the draft stores. When Supabase
 * Storage arrives this becomes a real upload and the second step disappears.
 */
export default function VideoField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [browsing, setBrowsing] = useState(false);
  const [filter, setFilter] = useState("");
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState("");

  /* An object URL is a live handle into the browser's memory; without this the
     tab holds every file the editor previewed until it is closed. */
  useEffect(() => {
    return () => {
      if (picked) URL.revokeObjectURL(picked.url);
    };
  }, [picked]);

  const choices = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle
      ? videoLibrary.filter((file) => file.toLowerCase().includes(needle))
      : videoLibrary;
  }, [filter]);

  /* A path typed or pasted that matches nothing in public/ is worth saying out
     loud: the banner would render a black rectangle and nothing else. */
  const missing = Boolean(value) && !value.startsWith("http") && !videoLibrary.includes(value);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(mp4|webm)$/i.test(file.name)) {
      setError("Use an mp4 or webm. Other formats will not play in every browser.");
      return;
    }
    setError("");
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked({ file, url: URL.createObjectURL(file) });
  }

  function saveToComputer() {
    if (!picked) return;
    const a = document.createElement("a");
    a.href = picked.url;
    a.download = picked.file.name;
    a.click();
  }

  const suggestedPath = picked ? `/brand/${picked.file.name}` : "";

  /* A plain div, not the shared Field: that renders a <label>, and a label
     containing this component's hidden file input forwards every click inside
     it to that input — so the preview, the gallery button and Clear would each
     pop the file dialog, and Upload would pop it twice. ImageField avoids the
     same trap the same way. */
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</span>
      {hint && <p className="mb-3 text-sm text-ink-500">{hint}</p>}
      {/* What is set now. The <video> is the check that matters — a path can
          look right and still point at nothing. */}
      {value ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-line bg-secondary">
          {!missing ? (
            <video
              key={value}
              src={value}
              muted
              loop
              playsInline
              controls
              className="block max-h-56 w-full bg-black object-contain"
            />
          ) : (
            <p className="px-4 py-6 text-center text-sm text-white/70">
              Nothing at this path. The banner will show a black rectangle.
            </p>
          )}
          <div className="flex items-center justify-between gap-3 bg-white px-3 py-2">
            <code className="min-w-0 truncate text-sm text-ink-500">{value}</code>
            <button
              type="button"
              onClick={() => onChange("")}
              className="shrink-0 cursor-pointer text-sm font-semibold text-ink-500 transition hover:text-signal-500"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-3 rounded-xl bg-surface px-4 py-4 text-sm text-ink-500">
          No video set. The banner falls back to its background colour.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Filled, and first by weight rather than by order: two outlined
            buttons side by side read as one choice split in half, and this is
            the one an editor arrives looking for. */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <PlusIcon className="size-4" />
          Upload video
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm"
          hidden
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            /* Cleared so choosing the same file twice still fires a change. */
            event.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => setBrowsing((open) => !open)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          <PlayIcon className="size-4" />
          {browsing ? "Close gallery" : "Choose from gallery"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm font-medium text-signal-500">{error}</p>}

      {/* The gallery. Each entry plays on hover of its own accord, so the
          editor can tell two similarly named files apart without opening both. */}
      {browsing && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
          {videoLibrary.length > 3 && (
            <div className="relative mb-3">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400"
              />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter by name"
                aria-label="Filter videos"
                className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand-500"
              />
            </div>
          )}

          {choices.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-500">
              No video in public/ matches. Upload one and commit it first.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {choices.map((file) => (
                <li key={file}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(file);
                      setBrowsing(false);
                    }}
                    className={`block w-full cursor-pointer overflow-hidden rounded-xl border text-left transition ${
                      value === file
                        ? "border-brand-500 ring-2 ring-brand-500/20"
                        : "border-line hover:border-brand-200"
                    }`}
                  >
                    <video
                      src={file}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={(event) => void event.currentTarget.play().catch(() => {})}
                      onMouseLeave={(event) => {
                        event.currentTarget.pause();
                        event.currentTarget.currentTime = 0;
                      }}
                      className="block aspect-video w-full bg-black object-cover"
                    />
                    <span className="flex items-center justify-between gap-2 bg-white px-3 py-2">
                      <span className="min-w-0 truncate text-sm text-ink-700">
                        {file.split("/").pop()}
                      </span>
                      {value === file && (
                        <CheckIcon className="size-4 shrink-0 text-brand-500" />
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* An uploaded file, and the two steps that put it on the site. */}
      {picked && (
        <div className="mt-3 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
          <video
            src={picked.url}
            muted
            loop
            playsInline
            controls
            className="mb-3 block max-h-48 w-full rounded-lg bg-black object-contain"
          />

          <p className="text-sm font-semibold text-ink-900">
            {picked.file.name}{" "}
            <span className="font-normal text-ink-500">({formatBytes(picked.file.size)})</span>
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            A video is too large to keep in the draft, so it is not uploaded
            anywhere yet. Save it, put it in{" "}
            <strong className="font-semibold text-ink-900">public/brand/</strong>, run{" "}
            <code className="text-ink-900">npm run media</code>, and it joins the gallery.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveToComputer}
              className="cursor-pointer rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Save file
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(suggestedPath);
                URL.revokeObjectURL(picked.url);
                setPicked(null);
              }}
              className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200"
            >
              Use {suggestedPath}
            </button>
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(picked.url);
                setPicked(null);
              }}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-ink-500 transition hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
