"use client";

/**
 * Turn a file the editor picked into something the site can use.
 *
 * Every image in this project is a resized webp — that is why public/ is 11 MB
 * for 291 images rather than ten times that. An upload path that skipped it
 * would quietly undo the work, so the conversion happens here, in the browser,
 * before anything is stored.
 *
 * It aims at a size rather than a quality setting. A fixed quality is a lie
 * about the output: 0.86 turns one photograph into 90 KB and another into
 * 2 MB, because the number controls how much detail is discarded, not how many
 * bytes come out. A phone camera's 12 MP panorama and a product shot on white
 * both have to end up small enough that a page holding nine of them still
 * loads on a phone, so the encoder is run repeatedly until it does.
 *
 * Canvas does the work: no server, no dependency.
 */

/** Longest edge, in pixels. Nothing on the site is displayed wider. */
const MAX_EDGE = 1600;

/** Below this the picture starts to look resized rather than compressed. */
const MIN_EDGE = 900;

const START_QUALITY = 0.86;
const MIN_QUALITY = 0.5;

/** What a single image should come in under. */
export const TARGET_BYTES = 400_000;

/** Above this, a draft starts crowding the browser's storage quota. */
export const MAX_STORED_BYTES = 1_200_000;

export type PreparedImage = {
  /** webp, as a data URL — what a preview shows and the no-storage path holds. */
  dataUrl: string;
  /** The same bytes, ready to upload without a second encode. */
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  /** What the editor handed over, for a before-and-after they can see. */
  originalBytes: number;
  /** How the budget was met, so the panel can say what it did. */
  quality: number;
  /** True when the picture had to be made smaller, not just compressed. */
  downscaled: boolean;
  /** Suggested filename, derived from the original. */
  filename: string;
};

/** One encode at a given size and quality. */
async function encode(
  bitmap: ImageBitmap | HTMLImageElement,
  edge: number,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the image.");

  /* The browser's own downscaler, at its best setting. Without this a large
     photograph reduced in one step aliases badly on fine detail — brickwork
     and text in a product shot are exactly where it shows. */
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );

  if (!blob || blob.type !== "image/webp") {
    throw new Error("Your browser cannot write webp. Try Chrome, Edge or Firefox.");
  }

  return { blob, width, height };
}

/**
 * Convert, and keep going until it fits.
 *
 * Quality first, then size. Dropping quality costs detail an eye rarely looks
 * for; dropping dimensions costs detail it does, so the picture is only made
 * smaller once compression alone has run out.
 *
 * `target` is a budget, not a guarantee. A noisy photograph at 900px and
 * quality 0.5 may still be large, and the result is returned anyway — too big
 * is a judgement for the caller, and silently mangling the image further is
 * worse than handing back the best it managed.
 */
export async function prepareImage(
  file: File,
  target = TARGET_BYTES,
): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That is not an image.");
  }

  const bitmap = await loadBitmap(file);

  let edge = MAX_EDGE;
  let best = await encode(bitmap, edge, START_QUALITY);
  let quality = START_QUALITY;

  /* An SVG or a small screenshot can already be under budget, in which case
     nothing below runs. */
  while (best.blob.size > target) {
    if (quality > MIN_QUALITY) {
      /* Steps of 0.12: a binary search would land closer to the budget and
         cost several more encodes, and each one of those is a full decode and
         re-encode of a 12 MP image on the editor's machine. */
      quality = Math.max(MIN_QUALITY, quality - 0.12);
    } else if (edge > MIN_EDGE) {
      edge = Math.max(MIN_EDGE, Math.round(edge * 0.85));
      quality = START_QUALITY;
    } else {
      /* Out of room. The loop below would otherwise spin. */
      break;
    }

    best = await encode(bitmap, edge, quality);
  }

  const dataUrl = await blobToDataUrl(best.blob);

  return {
    dataUrl,
    blob: best.blob,
    width: best.width,
    height: best.height,
    bytes: best.blob.size,
    originalBytes: file.size,
    quality,
    downscaled: edge < MAX_EDGE,
    filename: toWebpName(file.name),
  };
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("That image could not be read back."));
    reader.readAsDataURL(blob);
  });
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
  const url = URL.createObjectURL(image.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = image.filename;
  a.click();
  /* Revoked on a turn of the loop: revoking immediately cancels the download
     in Firefox before it has started. */
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "4.2 MB → 310 KB (93% smaller)" — what the panel tells the editor. */
export function describeSaving(image: PreparedImage) {
  const saved = 1 - image.bytes / Math.max(1, image.originalBytes);
  const parts = [`${formatBytes(image.originalBytes)} to ${formatBytes(image.bytes)}`];
  if (saved > 0.02) parts.push(`${Math.round(saved * 100)}% smaller`);
  if (image.downscaled) parts.push(`resized to ${image.width}x${image.height}`);
  return parts.join(" - ");
}
