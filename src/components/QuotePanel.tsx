"use client";

import { useEffect, useRef, useState } from "react";
import { quote } from "@/lib/content";
import EnquiryForm from "./EnquiryForm";
import { CloseIcon, PhoneIcon } from "./icons";

/**
 * A tab pinned to the right edge of every page that slides the enquiry form out
 * over the page.
 *
 * The tab's label is set on its side with writing-mode rather than a transform:
 * a rotated element keeps its original box, so it would reserve a wide, short
 * strip and sit wrong against the edge. Vertical text gives the button the tall,
 * narrow box it appears to have.
 *
 * Below lg the tab starts tucked away, because on phones and tablets it sat
 * over the page's own text. What shows first is a slim red edge with an arrow;
 * tapping it slides the tab in beside it, and tapping it again (the arrow now
 * turned outward) sends it back.
 */
/**
 * How long after the page loads the dialog lets itself in.
 *
 * Long enough that it follows the page rather than racing it; short enough
 * that it is still part of arriving rather than an interruption later.
 */
const AUTO_OPEN_AFTER_MS = 1200;

export default function QuotePanel() {
  const [open, setOpen] = useState(false);
  /** Below lg only: whether the tab has been slid out from the edge. */
  const [peek, setPeek] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    tabRef.current?.focus();
  };

  /**
   * Open itself shortly after the page settles, as the reference does — on
   * every page load, with nothing remembered between them.
   *
   * The one difference is the wait. The reference fires on `load`; a dialog
   * that appears while the hero video is still decoding lands on a half-drawn
   * page, and on a slow connection it can arrive before the thing it is
   * interrupting.
   */
  useEffect(() => {
    const idle = window.setTimeout(() => setOpen(true), AUTO_OPEN_AFTER_MS);
    return () => window.clearTimeout(idle);
  }, []);

  // Escape, a scroll lock, and focus moved into the panel — only while it is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input, textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Phones and tablets: the edge handle. The visible bar is only 4px, but
          the button is 28px wide so it is a fair tap target. */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setPeek((value) => !value)}
        aria-expanded={peek}
        aria-label={peek ? `Hide ${quote.tab}` : `Show ${quote.tab}`}
        className="fixed top-1/2 right-0 z-40 flex h-28 w-7 -translate-y-1/2 cursor-pointer items-center justify-end lg:hidden"
      >
        <svg
          viewBox="0 0 14 24"
          fill="none"
          aria-hidden
          className={`h-6 w-3.5 transition-transform duration-300 ${peek ? "rotate-180" : ""}`}
        >
          <path d="M13 2 2.5 12 13 22" className="stroke-accent-500" strokeWidth="2.5" strokeLinejoin="miter" />
          <path d="M13 6.5 7 12l6 5.5" className="stroke-accent-500" strokeWidth="1.25" />
          <path d="M13 9.5 10 12l3 2.5Z" className="fill-brand-500" />
        </svg>
        <span className="h-full w-1 bg-accent-500" />
      </button>

      <button
        suppressHydrationWarning
        ref={tabRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="quote-panel"
        className={`fixed top-1/2 right-7 z-40 inline-flex -translate-y-1/2 rotate-180 cursor-pointer items-center gap-2 rounded-r-lg bg-accent-500 px-5 py-3 font-display text-sm font-medium tracking-wide text-white shadow-lift transition-[translate,opacity,visibility,background-color] duration-300 ease-out [writing-mode:vertical-rl] hover:bg-accent-600 lg:visible lg:right-0 lg:translate-x-0 lg:opacity-100 ${
          peek ? "visible translate-x-0 opacity-100" : "invisible translate-x-[calc(100%+1.75rem)] opacity-0"
        }`}
      >
        {/* px/py above are padding-inline/padding-block, and vertical-rl turns
            the inline axis vertical — so px is the space at the ends of the
            label and py is the space either side of it. They read swapped here
            on purpose; writing them the "obvious" way pinches the text against
            the rounded ends.

            The icon is upright inside vertical text, and the parent's
            rotate-180 — which is what makes the label read bottom-to-top —
            turns it back the right way up. */}
        <PhoneIcon className="size-5 rotate-90" />
        {quote.tab}
      </button>

      {open && (
        /* A dialog in the middle of the screen, not a drawer off the right
           edge. The drawer kept the page visible beside it, which sounds
           generous and in practice meant a tall narrow column: six fields in
           a strip the width of a phone, on a desktop with room for a proper
           two-column form.

           items-start with overflow-y-auto, not items-center: centred, a form
           taller than the viewport is clipped at both ends with no way to
           reach the top. Starting at the top lets the backdrop scroll. */
        <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-secondary/50 p-4 backdrop-blur-sm sm:p-8">
          <button
            suppressHydrationWarning
            type="button"
            onClick={close}
            aria-label="Close"
            tabIndex={-1}
            className="fixed inset-0 cursor-default"
          />

          <div
            id="quote-panel"
            ref={panelRef}
            role="dialog"
            aria-modal
            aria-label={quote.title}
            className="relative z-10 my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
                {quote.title}
              </h2>

              <button
                suppressHydrationWarning
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mt-1 -mr-1 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-surface hover:text-ink-900"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            {/* Prefixed ids: the page underneath usually has this same form.
                `detailed` is what makes it the longer version — company,
                enquiry type, and phone beside email. */}
            <EnquiryForm idPrefix="quote-" detailed />
          </div>
        </div>
      )}
    </>
  );
}
