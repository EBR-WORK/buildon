"use client";

/**
 * Uploads, to the bucket the site serves from.
 *
 * Before this, an upload was held in the draft as a data URL. That made the
 * panel's preview look right and the site show nothing: published.ts strips
 * `data:` values on purpose, because a base64 blob in a content file would be
 * committed into the repo, inflate every page that shows the image, and 404 on
 * anything that re-fetched it. The preview lied, and the only clue was a broken
 * image after a deploy.
 *
 * So a file now goes to Supabase Storage and what gets stored is its URL — a
 * real address the browser, the build and a visitor all resolve the same way.
 *
 * Images are still converted to webp first. Every image in public/ is a resized
 * webp, which is why 291 of them come to 11 MB; uploading a 4 MB phone photo
 * untouched would quietly undo that.
 */

import { prepareImage, type PreparedImage } from "./image";
import {
  canCompressVideo,
  compressVideo,
  extensionFor,
  needsCompression,
  readVideoFacts,
  TARGET_BYTES as VIDEO_TARGET,
  type VideoFacts,
} from "./video";
import { supabase } from "./supabase";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "media";

/** Videos are stored as they arrive — see VideoField for why they are not re-encoded. */
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export type Uploaded = {
  /** The public URL to store and render. */
  url: string;
  /** The path inside the bucket, so the file can be removed later. */
  path: string;
  bytes: number;
  width?: number;
  height?: number;
};

/** Whether uploads can go anywhere other than the draft. */
export const canUpload = () => supabase !== null;

/**
 * A name that cannot collide and cannot be guessed from the original.
 *
 * Two editors uploading `photo.jpg` in the same minute must not overwrite each
 * other, and a bucket is public — a predictable path would let anyone walk it.
 */
function uniquePath(folder: string, filename: string) {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60);

  const stamp = Date.now().toString(36);
  const noise =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${folder}/${stamp}-${noise}-${safe}`;
}

async function put(path: string, body: Blob, contentType: string): Promise<Uploaded> {
  if (!supabase) throw new Error("The database is not configured, so there is nowhere to upload to.");

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    /* Never overwrite: the path already carries a unique prefix, so a clash
       here means something is wrong rather than something to paper over. */
    upsert: false,
  });

  if (error) {
    if (/row-level security|unauthorized|403/i.test(error.message)) {
      throw new Error("You do not have permission to upload. Ask a super admin to check your access.");
    }
    if (/bucket not found/i.test(error.message)) {
      throw new Error(`The "${BUCKET}" bucket does not exist. Apply 0001_content.sql.`);
    }
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, bytes: body.size };
}

/**
 * Compress to the budget, then upload. Returns the URL to store.
 *
 * `prepared` comes back too, so the panel can say what happened to the file —
 * an editor who hands over a 9 MB photograph should see that it became 280 KB
 * rather than wonder whether it uploaded at all.
 */
export async function uploadImage(
  file: File,
  folder = "uploads",
): Promise<Uploaded & { prepared: PreparedImage }> {
  const prepared = await prepareImage(file);

  const result = await put(uniquePath(folder, prepared.filename), prepared.blob, "image/webp");
  return { ...result, width: prepared.width, height: prepared.height, prepared };
}

/**
 * Compress if it is worth it, then upload.
 *
 * A file already under budget is sent untouched: re-encoding it would take the
 * same real-time minute and make it worse, since the second pass starts from
 * the first one's artefacts.
 */
export async function uploadVideo(
  file: File,
  folder = "video",
  {
    onProgress,
    signal,
    compress,
  }: {
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
    /** False uploads as-is even when oversized. The caller owns that choice. */
    compress?: boolean;
  } = {},
): Promise<Uploaded & { facts: VideoFacts; compressed: boolean }> {
  if (!/\.(mp4|webm)$/i.test(file.name)) {
    throw new Error("Use an mp4 or webm. Other formats will not play in every browser.");
  }

  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(
      `That file is ${(file.size / 1024 / 1024).toFixed(0)} MB, past what this can read. ` +
        `Compress it below ${MAX_VIDEO_BYTES / 1024 / 1024} MB first.`,
    );
  }

  const facts = await readVideoFacts(file);

  /* `compress: false` means the caller has already asked and been told no, or
     the file is small enough that nobody was asked. Either way it is not this
     function's place to spend a minute of someone's time unprompted. */
  if (compress === false || !needsCompression(facts, VIDEO_TARGET)) {
    const result = await put(uniquePath(folder, file.name), file, file.type || "video/mp4");
    return { ...result, facts, compressed: false };
  }

  if (!canCompressVideo()) {
    throw new Error(
      `That clip is ${(file.size / 1024 / 1024).toFixed(1)} MB and this browser cannot ` +
        `re-encode video. Compress it below ${VIDEO_TARGET / 1024 / 1024} MB, or use Chrome, Edge or Firefox.`,
    );
  }

  const compressed = await compressVideo(file, { target: VIDEO_TARGET, onProgress, signal });

  /* If the re-encode somehow came out larger — a very short clip at a high
     bitrate can — the original is the better file. */
  if (compressed.bytes >= file.size) {
    const result = await put(uniquePath(folder, file.name), file, file.type || "video/mp4");
    return { ...result, facts, compressed: false };
  }

  const name = file.name.replace(/\.[a-z0-9]+$/i, "") + "." + extensionFor(compressed.mimeType);
  const result = await put(uniquePath(folder, name), compressed.blob, compressed.mimeType);
  return { ...result, facts, compressed: true };
}

/** Remove a file that was uploaded here. Quiet on failure — see the callers. */
export async function removeUpload(path: string) {
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
}

/** Whether a stored value is one of ours, rather than a path in public/. */
export function isUploadedUrl(value: string) {
  return /^https?:\/\//.test(value) && value.includes(`/storage/v1/object/public/${BUCKET}/`);
}

/** The bucket path inside one of our URLs, or null if it is not one. */
export function pathFromUrl(value: string) {
  if (!isUploadedUrl(value)) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const path = value.slice(value.indexOf(marker) + marker.length);
  return path ? decodeURIComponent(path.split("?")[0]) : null;
}

/**
 * Files are no longer deleted when a field is pointed somewhere else.
 *
 * It used to delete the previous file as soon as a new one was uploaded, and
 * that is a step too early: the new URL is not in the database until Save is
 * pressed. An editor who uploaded twice, or uploaded and then navigated away,
 * left the stored content pointing at a file that had already been removed —
 * a banner that 404s, with nothing in the panel to say why.
 *
 * An orphaned file costs a few megabytes of a bucket. A deleted file that the
 * site still references costs a broken page. Keeping both is the wrong trade
 * only if storage is scarce, and it is not.
 */


/**
 * The natural size of an image already on a URL.
 *
 * Needed because an image chosen from the gallery arrives as a path with no
 * dimensions attached, and the renderer needs both: next/image reserves the
 * space before the file loads, which is what stops an article jumping as it
 * comes in. Guessing a 4:3 default turns every portrait photograph into a
 * wrongly-shaped hole.
 */
export function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const probe = new window.Image();
    probe.onload = () =>
      resolve({ width: probe.naturalWidth || 1600, height: probe.naturalHeight || 1200 });
    probe.onerror = () => reject(new Error("That image could not be loaded."));

    /* Deliberately no crossOrigin. Setting it turns this into a CORS request,
       which fails outright on any host that does not send the headers — and
       all this needs is naturalWidth, which is readable from a tainted image.
       Asking for permission that is not required only creates ways to fail. */
    probe.decoding = "async";
    probe.src = src;
  });
}
