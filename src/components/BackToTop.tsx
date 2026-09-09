"use client";

import { useEffect, useState } from "react";
import { ArrowIcon } from "./icons";

/** Appear once a tenth of the page's scrollable distance is behind you. */
const THRESHOLD = 0.1;

/**
 * The floating "back to top" control.
 *
 * The trigger is a fraction of the scrollable distance rather than a fixed
 * pixel count, so a short page shows the button at the same point in the read
 * as a long one. Pages with nothing to scroll never show it at all.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollable > 0 && window.scrollY / scrollable >= THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          // Respect a reduced-motion preference: no long smooth glide.
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        })
      }
      aria-label="Back to top"
      // Hidden from the tab order and from assistive tech until it is on screen,
      // so it is never a focus stop pointing at a scroll position you are in.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 bottom-4 z-40 inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white shadow-lift transition duration-300 hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 sm:right-6 sm:bottom-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowIcon className="size-5 -rotate-90" />
    </button>
  );
}
