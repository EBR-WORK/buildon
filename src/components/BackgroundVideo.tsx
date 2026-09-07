"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
};

/**
 * A decorative, silent, looping background video.
 *
 * Playback is started from an effect rather than the `autoplay` attribute so
 * that anyone who has asked for reduced motion gets a still frame instead of a
 * moving backdrop. It is aria-hidden: nothing here carries meaning that is not
 * already in the heading over it.
 */
export default function BackgroundVideo({ src, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Autoplay can still be refused (low power mode, for one) — the poster
    // frame is a perfectly good fallback, so swallow it.
    void video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
      className={className}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
