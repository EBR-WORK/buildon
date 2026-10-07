"use client";

/**
 * Make an uploaded video small enough to put on a page.
 *
 * The banner clip in this repo is 34 MB. On a phone over mobile data that is
 * most of a minute before anything moves, and it is decorative — so a video
 * that arrives oversized has to be reduced rather than refused, or an editor
 * simply picks the smaller, worse-looking file.
 *
 * How, without a server or a dependency: the video is played into a canvas at
 * a reduced size, the canvas is captured as a stream, and MediaRecorder
 * re-encodes that stream at a bitrate chosen from the duration and the budget.
 * No ffmpeg.wasm — that is tens of megabytes of payload to download before an
 * editor can add a file they change once a year.
 *
 * Two honest costs:
 *
 *   It runs in real time. A sixty-second clip takes about a minute, so the
 *   caller is given progress and can cancel.
 *
 *   Audio is dropped. These are muted background loops — the hero banner sets
 *   `muted` and `loop` — so there is nothing to lose. A clip that needs sound
 *   should be left alone and compressed properly outside the browser, which is
 *   what `needsCompression` deciding not to touch a small file allows.
 */

/**
 * What a background video should come in under.
 *
 * 25 MB, not the 6 MB this started at. A banner runs full width across a
 * desktop screen, and six megabytes spread over a thirty-second loop is a
 * bitrate low enough to show its working — blocking in the gradients and
 * mush wherever the camera moves. The point of compressing is a file that
 * still looks like the one the editor chose.
 *
 * It is a ceiling for a decorative clip, not a target to fill: a short loop
 * that encodes to 4 MB is left at 4 MB.
 */
export const TARGET_BYTES = 25 * 1024 * 1024;

/** Beyond this, re-encoding in real time is not a reasonable thing to ask. */
export const MAX_DURATION_SECONDS = 180;

/** Nothing on the site plays wider than this. */
const MAX_WIDTH = 1280;

export type VideoFacts = {
  durationSeconds: number;
  width: number;
  height: number;
  bytes: number;
  /** Bits per second the file actually uses — what makes it large. */
  bitrate: number;
};

export type CompressedVideo = {
  blob: Blob;
  bytes: number;
  originalBytes: number;
  width: number;
  height: number;
  /** The container that came out; mp4 where the browser offers it. */
  mimeType: string;
};

/** Read a file's dimensions and duration without decoding all of it. */
export function readVideoFacts(file: File): Promise<VideoFacts> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    video.onloadedmetadata = () => {
      const facts: VideoFacts = {
        durationSeconds: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        bytes: file.size,
        bitrate: video.duration > 0 ? (file.size * 8) / video.duration : 0,
      };
      URL.revokeObjectURL(url);
      resolve(facts);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a video."));
    };

    video.src = url;
  });
}

/**
 * The best container this browser will record.
 *
 * mp4 first: it is what every browser plays, and Safari records it. Chrome and
 * Firefox only offer webm, which Safari has played since 14.1 — acceptable,
 * and the alternative is refusing to compress at all there.
 */
function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;

  const candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export const canCompressVideo = () => pickMimeType() !== null;

/** Whether this file is worth the wait. */
export function needsCompression(facts: VideoFacts, target = TARGET_BYTES) {
  return facts.bytes > target;
}

/**
 * Re-encode to fit the budget.
 *
 * The bitrate is derived from the target and the duration rather than picked:
 * the same 6 MB has to stretch over whatever length the clip is, and a fixed
 * number would overshoot on a long one and waste quality on a short one. Nine
 * tenths of the budget is aimed at, because a recorder overshoots slightly and
 * landing just over would make the whole exercise pointless.
 */
export async function compressVideo(
  file: File,
  {
    target = TARGET_BYTES,
    onProgress,
    signal,
  }: {
    target?: number;
    /** 0 to 1. Real time, so this matters. */
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<CompressedVideo> {
  const mimeType = pickMimeType();
  if (!mimeType) {
    throw new Error("This browser cannot re-encode video. Try Chrome, Edge or Firefox.");
  }

  const facts = await readVideoFacts(file);

  if (facts.durationSeconds > MAX_DURATION_SECONDS) {
    throw new Error(
      `That clip is ${Math.round(facts.durationSeconds)} seconds long. Compressing happens in ` +
        `real time, so anything over ${MAX_DURATION_SECONDS} seconds should be trimmed first.`,
    );
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("That video could not be decoded."));
    });

    const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
    /* Even dimensions: h.264 encoders reject odd ones outright. */
    const width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    const height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process the video.");

    /* Capped as well as floored. Without the ceiling a five-second clip gets
       the whole budget as bitrate — forty megabits for something decorative,
       which no browser needs and some encoders refuse. */
    const bitrate = Math.min(
      12_000_000,
      Math.max(800_000, Math.floor((target * 8 * 0.9) / Math.max(1, facts.durationSeconds))),
    );

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const done = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start(1000);
    await video.play();

    let frame = 0;
    const draw = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, width, height);

      /* Reported every tenth frame: calling back thirty times a second only
         makes React re-render more often than the number changes. */
      if (onProgress && frame++ % 10 === 0 && facts.durationSeconds > 0) {
        onProgress(Math.min(1, video.currentTime / facts.durationSeconds));
      }

      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);

    const abort = () => {
      video.pause();
      if (recorder.state !== "inactive") recorder.stop();
    };
    signal?.addEventListener("abort", abort, { once: true });

    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
    });

    if (recorder.state !== "inactive") recorder.stop();
    await done;
    signal?.removeEventListener("abort", abort);

    if (signal?.aborted) throw new Error("Compression was cancelled.");

    const blob = new Blob(chunks, { type: mimeType });
    onProgress?.(1);

    /* A recorder that produced nothing usable, which happens when a tab is
       backgrounded mid-encode and requestAnimationFrame stops firing. */
    if (blob.size < 1024) {
      throw new Error("Compression produced an empty file. Keep this tab in front and try again.");
    }

    return {
      blob,
      bytes: blob.size,
      originalBytes: file.size,
      width,
      height,
      mimeType,
    };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** The extension that matches what the recorder produced. */
export function extensionFor(mimeType: string) {
  return mimeType.startsWith("video/mp4") ? "mp4" : "webm";
}
