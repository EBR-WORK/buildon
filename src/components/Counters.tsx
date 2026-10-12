"use client";

import { useEffect, useRef, useState } from "react";
import { counters } from "@/lib/content";
import Reveal from "./Reveal";

/**
 * The figures band: four numbers that count up the first time they are seen.
 *
 * The numbers themselves are placeholders — see `counters` in content.ts. The
 * component reads them from there and nothing else, so replacing them with real
 * figures is a content edit, not a code change. Adding or removing an entry
 * reflows the grid on its own.
 *
 * It counts once, on first sight, and never again. A number that re-runs every
 * time it scrolls back into view stops reading as a fact and starts reading as
 * decoration.
 */

/** How long the count takes. Long enough to register, short enough to finish. */
const DURATION_MS = 1600;

function useCountUp(target: number) {
  /* Starts at the final figure, not at zero.
     Zero is what the prerendered HTML would otherwise contain, so a visitor
     with JavaScript blocked, a crawler, or anyone on a slow connection reads
     "0+ projects supplied" — the opposite of the claim. The climb begins when
     the band is scrolled to, which on this page is well below the fold, so the
     first frame of the animation replaces the figure before it is ever seen. */
  const [value, setValue] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const run = (start: number) => {
      const step = (now: number) => {
        const progress = Math.min((now - start) / DURATION_MS, 1);
        /* Ease out: fast at first, settling into the final figure, so the last
           few hundred do not tick past too quickly to read. */
        setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        /* Disconnected before the count starts: once seen, it is done. */
        observer.disconnect();
        /* Anyone who has asked for less motion gets the number, not the
           climb. Checked here rather than on mount so the figure still
           appears at the moment it is scrolled to, either way. */
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setValue(target);
          return;
        }
        run(performance.now());
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return { ref, value };
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, value: shown } = useCountUp(value);

  return (
    <div className="text-center">
      {/* The whole figure is one accessible string: a screen reader should
          hear "2,500+ projects supplied", not a number mid-animation. */}
      <span ref={ref} className="block" aria-hidden>
        <span className="font-display text-4xl leading-none font-semibold text-white sm:text-5xl">
          {shown.toLocaleString("en-IN")}
        </span>
        <span className="font-display text-2xl leading-none font-semibold text-white/70 sm:text-3xl">
          {suffix}
        </span>
      </span>
      <span className="sr-only">
        {value.toLocaleString("en-IN")}
        {suffix} {label}
      </span>
      <p aria-hidden className="mt-3 text-sm leading-relaxed text-white/70 sm:text-[15px]">
        {label}
      </p>
    </div>
  );
}

export default function Counters() {
  return (
    /* Brand blue, between two white bands: the figures are the one thing on
       this page that should stop the scroll, and a white band between two
       white bands does not. */
    <section id="counters" className="scroll-mt-28 bg-brand-500 py-14 sm:py-16 lg:py-20">
      <div className="container-page">
        <Reveal className="text-center">
          <h2 className="font-display text-2xl leading-snug font-semibold text-white sm:text-3xl">
            {counters.title}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-white/70">
            {counters.intro}
          </p>
        </Reveal>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:mt-12 lg:grid-cols-4">
          {counters.items.map((item, i) => (
            <Reveal as="li" key={item.id} delay={Math.min(i, 3) * 0.08}>
              <Counter value={item.value} suffix={item.suffix} label={item.label} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
