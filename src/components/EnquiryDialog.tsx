"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/**
 * The centred dialog the enquiry forms open in.
 *
 * Extracted so the quote tab and a product page's Enquire button open the same
 * thing rather than two copies of the same markup — the kind of pair that
 * agrees on the day it is written and quietly stops agreeing afterwards.
 *
 * What it owns is the behaviour a dialog has to get right and is easy to get
 * wrong: Escape closes it, the page behind it stops scrolling, focus moves in
 * when it opens and back to the control that opened it when it closes.
 */
export default function EnquiryDialog({
  open,
  onClose,
  title,
  /** False for a dialog that let itself in — see QuotePanel. */
  takeFocus = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  takeFocus?: boolean;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (takeFocus) {
      panelRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, takeFocus]);

  if (!open) return null;

  return (
    /* items-start with overflow-y-auto, not items-center: centred, a form
       taller than the viewport is clipped at both ends with no way to reach
       the top. Starting at the top lets the backdrop scroll. */
    <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-secondary/50 p-4 backdrop-blur-sm sm:p-8">
      {/* A button rather than a div with a handler: it is a real control, and
          tabIndex -1 keeps it out of the tab order so it is not a stop between
          the heading and the first field. */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={onClose}
        aria-label="Close"
        tabIndex={-1}
        className="fixed inset-0 cursor-default"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label={title}
        /* text-left explicitly: `fixed` takes this out of the page's flow but
           not out of its inheritance, and the product page opens it from
           inside a centred row of buttons — which quietly centred every label
           in the form. A dialog's own alignment should not depend on whatever
           happens to render it. */
        className="relative z-10 my-auto w-full max-w-2xl rounded-2xl bg-white p-6 text-left shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
            {title}
          </h2>

          <button
            suppressHydrationWarning
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-surface hover:text-ink-900"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
