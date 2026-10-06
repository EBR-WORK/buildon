"use client";

/**
 * Turn a file the editor picked into something the site can use.
 *
 * Every image in this project is a resized webp — that is why public/ is 11 MB
 * for 291 images rather than ten times that. An upload path that skipped it
 * would quietly undo the work, so the conversion happens here, in the browser,
 * before anything is stored: a 4 MB phone photo becomes a ~100 KB webp.
 *
 * Canvas does the work, so there is no server and no dependency.
 */

/** Longest edge, in pixels. Nothing on the site is displayed wider. */
const MAX_EDGE = 1600;
const QUALITY = 0.86;

/** Above this, a draft starts crowding the browser's storage quota. */
export const MAX_STORED_BYTES = 1_200_000;

export type PreparedImage = {
  /** webp, as a data URL — what the draft holds and the preview shows. */
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
  /** Suggested filename, derived from the original. */
  filename: string;
};

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That is not an image.");
  }

  const bitmap = await loadBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the image.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/webp", QUALITY);
  if (!dataUrl.startsWith("data:image/webp")) {
    throw new Error("Your browser cannot write webp. Try Chrome, Edge or Firefox.");
  }

  return {
    dataUrl,
    width,
    height,
    bytes: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75),
    filename: toWebpName(file.name),
  };
}

/**
 * createImageBitmap where it exists, an <img> elsewhere. Safari only gained the
 * former recently, and an editor on an older machine should still be able to
 * add a photograph.
 */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Fall through to the <img> path. */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file could not be opened as an image."));
      img.src = url;
    });
  } finally {
    /* Revoked after decode; the canvas already holds the pixels. */
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function toWebpName(original: string) {
  return (
    original
      .replace(/\.[a-z0-9]+$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  ) + ".webp";
}

export function formatBytes(bytes: number) {
  return bytes < 1024
    ? `${bytes} B`
    : bytes < 1_048_576
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/** Save a prepared image so it can be committed into public/. */
export function downloadImage(image: PreparedImage) {
  const a = document.createElement("a");
  a.href = image.dataUrl;
  a.download = image.filename;
  a.click();
}
