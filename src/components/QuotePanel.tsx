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
 */
export default function QuotePanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    tabRef.current?.focus();
  };

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
      <button
        suppressHydrationWarning
        ref={tabRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="quote-panel"
        className="fixed top-1/2 right-0 z-40 inline-flex -translate-y-1/2 rotate-180 cursor-pointer items-center gap-2 rounded-r-lg bg-brand-500 px-2.5 py-4 font-display text-sm font-medium tracking-wide text-white shadow-lift transition hover:bg-brand-600 [writing-mode:vertical-rl]"
      >
        {/* Upright inside vertical text, and the parent's rotate-180 — which is
            what makes the label read bottom-to-top — turns it back the right
            way up. */}
        <PhoneIcon className="size-4 rotate-90" />
        {quote.tab}
      </button>

      {open && (
        <div className="fixed inset-0 z-100 flex justify-end bg-secondary/45 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6">
          <button
            suppressHydrationWarning
            type="button"
            onClick={close}
            aria-label="Close"
            tabIndex={-1}
            className="absolute inset-0 cursor-default"
          />

          <div
            id="quote-panel"
            ref={panelRef}
            role="dialog"
            aria-modal
            aria-label={quote.title}
            className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-lift sm:p-8 lg:h-auto lg:max-h-[85svh] lg:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl leading-snug font-semibold">{quote.title}</h2>
              <button
                suppressHydrationWarning
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mt-1 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-signal-500 hover:text-white"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            {/* Prefixed ids: the page underneath usually has this same form. */}
            <EnquiryForm idPrefix="quote-" className="mt-6" />
          </div>
        </div>
      )}
    </>
  );
}
