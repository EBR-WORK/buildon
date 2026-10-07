"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { videoLibrary } from "@/lib/cms/media";
import { formatBytes } from "@/lib/cms/image";
import { canUpload, replaceUpload, uploadVideo } from "@/lib/cms/storage";
import {
  canCompressVideo,
  needsCompression,
  readVideoFacts,
  TARGET_BYTES as VIDEO_TARGET,
  type VideoFacts,
} from "@/lib/cms/video";
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
  const [busy, setBusy] = useState(false);
  /* Real-time re-encoding, so the editor needs to see it moving and be able
     to stop it. */
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  /* A file chosen but not yet sent: too big to upload as it is, waiting for
     the editor to say whether to spend the time compressing it. */
  const [oversized, setOversized] = useState<{ file: File; facts: VideoFacts } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
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
  /* An uploaded video is an absolute URL in the bucket, not a path in
     public/, so only an unknown local path counts as missing. */
  const missing = Boolean(value) && !value.startsWith("http") && !videoLibrary.includes(value);

  /**
   * Send it to the bucket, or fall back to the two-step.
   *
   * With storage connected a video is a normal upload and the stored value is
   * its URL. Without it there is nowhere to put a file this size — the draft
   * holds about five megabytes in total and a banner loop is tens — so the
   * panel is honest about the two steps it really takes instead.
   */
  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(mp4|webm)$/i.test(file.name)) {
      setError("Use an mp4 or webm. Other formats will not play in every browser.");
      return;
    }
    setError("");

    if (canUpload()) {
      setNote("");
      setOversized(null);

      /* Measured before anything is sent. A 140 MB file uploaded and then
         compressed would cost the editor the upload twice over, and the
         decision of whether to wait is theirs to make. */
      let facts;
      try {
        facts = await readVideoFacts(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "That file could not be read as a video.");
        return;
      }

      if (needsCompression(facts, VIDEO_TARGET)) {
        setOversized({ file, facts });
        return;
      }

      await send(file, facts, false);
      return;
    }

    if (picked) URL.revokeObjectURL(picked.url);
    setPicked({ file, url: URL.createObjectURL(file) });
  }


  /**
   * Send it, replacing whatever the field held before.
   *
   * The previous file is deleted only once the new one is stored, so a failure
   * halfway leaves the old video in place rather than the field pointing at
   * nothing.
   */
  async function send(file: File, facts: VideoFacts, compress: boolean) {
    setBusy(true);
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    const previous = value;

    try {
      const result = await uploadVideo(file, "video", {
        onProgress: setProgress,
        signal: controller.signal,
        compress,
      });

      onChange(result.url);
      setOversized(null);
      setNote(
        result.compressed
          ? `${formatBytes(facts.bytes)} to ${formatBytes(result.bytes)} - the original was not kept`
          : `Uploaded ${formatBytes(result.bytes)} - already small enough to leave alone`,
      );

      if (picked) URL.revokeObjectURL(picked.url);
      setPicked(null);
      await replaceUpload(previous, result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That video could not be uploaded.");
    } finally {
      setBusy(false);
      setProgress(0);
      abortRef.current = null;
    }
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
              onClick={() => {
                const previous = value;
                onChange("");
                setNote("");
                /* Removed after the field is cleared, so a slow delete cannot
                   leave the field pointing at a file that is already gone. */
                void replaceUpload(previous, "");
              }}
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
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="size-4" />
          {busy ? `Compressing ${Math.round(progress * 100)}%` : "Upload video"}
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

      {/* Chosen, measured, and too big. The numbers are stated before the
          button, because "140 MB, and the site takes 6" is the whole reason
          the button exists — an editor who is only told to press it learns
          nothing about the file they picked. */}
      {oversized && !busy && (
        <div className="mt-3 rounded-2xl border border-signal-200 bg-signal-50 p-5">
          <p className="text-[15px] font-semibold text-ink-900">
            {formatBytes(oversized.facts.bytes)} is too large for the site.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            A background clip needs to be about {formatBytes(VIDEO_TARGET)} or under.
          </p>

          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-ink-500">Length</dt>
              <dd className="font-medium text-ink-900">
                {Math.round(oversized.facts.durationSeconds)}s
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">Size on screen</dt>
              <dd className="font-medium text-ink-900">
                {oversized.facts.width}&times;{oversized.facts.height}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">Bitrate</dt>
              <dd className="font-medium text-ink-900">
                {(oversized.facts.bitrate / 1_000_000).toFixed(1)} Mbps
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            Compressing shrinks it here in the browser and uploads only the smaller
            file &mdash; the original is never stored. It plays the clip through to do
            it, so expect about {Math.round(oversized.facts.durationSeconds)} seconds.
            The sound is dropped; a banner loop is muted anyway.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {canCompressVideo() ? (
              <button
                type="button"
                onClick={() => void send(oversized.file, oversized.facts, true)}
                className="cursor-pointer rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Compress and upload
              </button>
            ) : (
              <p className="text-sm font-medium text-signal-500">
                This browser cannot re-encode video. Use Chrome, Edge or Firefox, or
                compress the file yourself.
              </p>
            )}

            <button
              type="button"
              onClick={() => setOversized(null)}
              className="cursor-pointer rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200"
            >
              Choose a different file
            </button>
          </div>
        </div>
      )}

      {/* Re-encoding plays the clip through, so it takes as long as the clip
          does. Saying so, with a way out, beats a button that looks stuck. */}
      {busy && (
        <div className="mt-3 rounded-xl border border-line bg-surface p-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-ink-500">
              Shrinking the file for the web. This plays the clip through, so it takes
              about as long as the clip runs.
            </p>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="shrink-0 cursor-pointer text-sm font-semibold text-ink-500 transition hover:text-signal-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {note && !busy && !error && (
        <p className="mt-2 text-sm font-medium text-brand-600">{note}</p>
      )}

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
