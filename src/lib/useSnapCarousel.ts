"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives a scroll-snap track: no slider library, and the list still scrolls,
 * swipes and reads correctly if the JavaScript never arrives.
 *
 * The step is the width of one item, so the same hook serves a one-up carousel
 * (testimonials) and a three-up one (products) without being told which.
 */
export function useSnapCarousel<T extends HTMLElement>() {
  const trackRef = useRef<T>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const step = useCallback((track: T) => {
    const first = track.firstElementChild as HTMLElement | null;
    return first?.clientWidth || track.clientWidth;
  }, []);

  // Follow the track wherever it actually is — swipes and keyboard scrolling
  // must move the dots and disable the arrows just as the buttons do.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const measure = () => {
      const width = step(track);
      if (width > 0) setIndex(Math.round(track.scrollLeft / width));
      setAtStart(track.scrollLeft <= 1);
      setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 1);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    track.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [step]);

  const goTo = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({
        left: Math.max(0, next) * step(track),
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [step],
  );

  return { trackRef, index, atStart, atEnd, goTo };
}
