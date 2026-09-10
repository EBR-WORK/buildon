"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { ArrowIcon, CloseIcon, CollapseIcon, ExpandIcon } from "./icons";

type Gallery = {
  readonly title: string;
  readonly images: readonly string[];
};

/**
 * The "Life at Buildon" galleries plus their lightbox.
 *
 * Every photograph across all four galleries forms one set, so the counter
 * reads "8/24" the way the reference's viewer does rather than restarting at
 * each heading. The controls sit on the image itself, with a thumbnail strip
 * that slides up on hover or keyboard focus.
 */
export default function LifeGalleries({ galleries }: { galleries: readonly Gallery[] }) {
  const flat = galleries.flatMap((gallery) =>
    gallery.images.map((src) => ({ src, title: gallery.title })),
  );
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const stripRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setOpenAt(null);
    openerRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => setOpenAt((i) => (i === null ? i : (i + delta + flat.length) % flat.length)),
    [flat.length],
  );

  // Escape and the arrow keys, plus a scroll lock, only while the viewer is up.
  useEffect(() => {
    if (openAt === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openAt, close, step]);

  // The browser can leave fullscreen on its own (Escape, or the OS chrome).
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Keep the active thumbnail in view as the selection moves.
  useEffect(() => {
    if (openAt === null) return;
    stripRef.current
      ?.querySelector(`[data-index="${openAt}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [openAt]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void panelRef.current?.requestFullscreen?.().catch(() => {});
  };

  const current = openAt === null ? null : flat[openAt];
  // Where each gallery starts in the flat list, computed rather than counted up
  // during render so nothing is mutated mid-render.
  const offsets = galleries.map((_, i) =>
    galleries.slice(0, i).reduce((n, gallery) => n + gallery.images.length, 0),
  );

  const roundButton =
    "inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-secondary/60 text-white backdrop-blur transition hover:bg-brand-500";

  return (
    <>
      <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-14">
        {galleries.map((gallery, galleryIndex) => (
          <div key={gallery.title}>
            <Reveal>
              <h3 className="text-center font-display text-xl leading-snug font-semibold sm:text-2xl">
                {gallery.title}
              </h3>
            </Reveal>

            <ul className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
              {gallery.images.map((src, i) => {
                const index = offsets[galleryIndex] + i;
                return (
                  <Reveal as="li" key={src} delay={(i % 3) * 0.06}>
                    <button
                      type="button"
                      onClick={(e) => {
                        openerRef.current = e.currentTarget;
                        setOpenAt(index);
                      }}
                      aria-label={`Open ${gallery.title} photograph ${i + 1} of ${gallery.images.length}`}
                      className="group relative block aspect-4/3 w-full cursor-pointer overflow-hidden rounded-xl bg-white ring-1 ring-line"
                    >
                      <Image
                        src={src}
                        alt={`${gallery.title} — photograph ${i + 1}`}
                        fill
                        sizes="(min-width: 640px) 24rem, 45vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </button>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {current && openAt !== null && (
        /* A light, blurred backdrop rather than a near-opaque one, so the page
           still reads behind the viewer. */
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-secondary/45 p-3 backdrop-blur-md sm:p-6">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            tabIndex={-1}
            className="absolute inset-0 cursor-default"
          />

          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal
            aria-label={`${current.title} — photograph ${openAt + 1} of ${flat.length}`}
            className="relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-secondary shadow-lift"
          >
            {/* Image, with every control laid over it */}
            <div className="group relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
              <Image
                key={current.src}
                src={current.src}
                alt={`${current.title} — photograph ${openAt + 1} of ${flat.length}`}
                width={1600}
                height={1200}
                sizes="(min-width: 1024px) 64rem, 100vw"
                priority
                className="max-h-[72svh] w-auto object-contain"
              />

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Leave fullscreen" : "View fullscreen"}
                className={`absolute top-3 right-3 ${roundButton}`}
              >
                {isFullscreen ? (
                  <CollapseIcon className="size-5" />
                ) : (
                  <ExpandIcon className="size-5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photograph"
                className={`absolute top-1/2 left-3 -translate-y-1/2 ${roundButton}`}
              >
                <ArrowIcon className="size-5 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photograph"
                className={`absolute top-1/2 right-3 -translate-y-1/2 ${roundButton}`}
              >
                <ArrowIcon className="size-5" />
              </button>

              {/* Thumbnail strip — slides up on hover, and on keyboard focus so
                  it is reachable without a pointer.

                  While hidden it is translated a full height DOWN, which parks
                  it squarely over the counter bar below. Without
                  pointer-events-none it swallowed every click on the close
                  button. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0 transition duration-300 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                <ul
                  ref={stripRef}
                  className="flex gap-2 overflow-x-auto bg-secondary/80 p-3 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {flat.map((item, i) => (
                    <li key={item.src} data-index={i} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenAt(i)}
                        aria-label={`Go to photograph ${i + 1} of ${flat.length}`}
                        aria-current={i === openAt}
                        className={`relative block h-14 w-20 cursor-pointer overflow-hidden rounded transition ${
                          i === openAt
                            ? "ring-2 ring-brand-400"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={item.src}
                          alt=""
                          fill
                          sizes="5rem"
                          className="object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Counter and close */}
            <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 bg-white px-4 py-3">
              <p className="text-sm font-medium text-ink-500 tabular-nums">
                {openAt + 1}/{flat.length}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-signal-500 hover:text-white"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
