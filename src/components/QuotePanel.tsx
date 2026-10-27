"use client";

import { useEffect, useRef, useState } from "react";
/* Type only. The words arrive as props, because a client component's
   imports are compiled into the shared JS bundle — one copy for /, /mr
   and /hi alike — so English baked in there cannot become Hindi on the
   Hindi page. The server HTML said "कोटेशन पाएं" and the bundle said
   "Get a Quote", which is the text mismatch React reported as #418. */
import type { quote as QuoteContent } from "@/lib/content";
import EnquiryDialog from "./EnquiryDialog";
import EnquiryForm from "./EnquiryForm";
import { PhoneIcon } from "./icons";

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

export default function QuotePanel({
  /**
   * Hides the side tab, not the dialog.
   *
   * The chat panel opens over the right-hand edge, and below sm it is full
   * width — the tab and its edge handle end up behind it, where a press
   * lands on the chat instead. One of the two has to stand down, and the chat
   * is the one the visitor just opened.
   */
  tabHidden = false,
  copy,
}: {
  tabHidden?: boolean;
  copy: typeof QuoteContent;
}) {
  const quote = copy;
  /**
   * Closed, or open as one of two different dialogs.
   *
   *   "tab"   someone pressed Get a Quote. Short form, the tab's own title:
   *           they asked a specific question and six fields is an answer to a
   *           question they did not ask.
   *   "auto"  it let itself in 1.2s after the page loaded. The longer form,
   *           because nobody asked for this one and if it is going to
   *           interrupt, it may as well collect what the office actually needs.
   */
  const [open, setOpen] = useState<null | "tab" | "auto">(null);
  /* Whether the dialog let itself in, rather than being asked for. An
     uninvited dialog does not get to take the keyboard — see below. */
  const autoOpened = useRef(false);
  /** Below lg only: whether the tab has been slid out from the edge. */
  const [peek, setPeek] = useState(false);
  const tabRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(null);
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
    const idle = window.setTimeout(() => {
      /* Not while someone is typing. The dialog arrives 1.2s into every load,
         which is exactly when a visitor may already be filling in the form
         this page has of its own — and it would take the keyboard off them
         mid-word. */
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      /* Functional, and only from closed: press Get a Quote inside the first
         1.2 seconds and this would otherwise fire a moment later and swap the
         short form you asked for into the long one you did not. */
      setOpen((current) => {
        if (current !== null) return current;
        autoOpened.current = true;
        return "auto";
      });
    }, AUTO_OPEN_AFTER_MS);
    return () => window.clearTimeout(idle);
  }, []);

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
        className={`fixed top-1/2 right-0 z-40 flex h-28 w-7 -translate-y-1/2 cursor-pointer items-center justify-end transition-opacity lg:hidden ${
          tabHidden ? "pointer-events-none opacity-0" : ""
        }`}
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
        onClick={() => setOpen("tab")}
        aria-expanded={open !== null}
        aria-controls="quote-panel"
        className={`${
          tabHidden ? "pointer-events-none opacity-0" : ""
        } fixed top-1/2 right-7 z-40 inline-flex -translate-y-1/2 rotate-180 cursor-pointer items-center gap-2 rounded-r-lg bg-accent-500 px-5 py-3 font-display text-sm font-medium tracking-wide text-white shadow-lift transition-[translate,opacity,visibility,background-color] duration-300 ease-out [writing-mode:vertical-rl] hover:bg-accent-600 lg:visible lg:right-0 lg:translate-x-0 lg:opacity-100 ${
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

      <EnquiryDialog
        open={open !== null}
        onClose={close}
        /* The tab's own words, so the dialog answers the button that opened
           it. The uninvited one needs a sentence instead: it has to say what
           it is for, because nothing preceded it. */
        title={open === "tab" ? quote.tab : quote.title}
        /* A dialog that let itself in does not get the keyboard. See the
           auto-open effect above. */
        takeFocus={open === "tab"}
      >
        {/* Prefixed ids: the page underneath usually has this same form.
            One shape for both ways in — `detailed` either way — so the tab and
            the pop-up ask the same things and the office gets the same answers
            however the visitor arrived.

            `source` still separates them, since which one produced a lead is
            worth knowing even when the form is identical. */}
        <EnquiryForm
          idPrefix="quote-"
          source={open === "tab" ? "Get a Quote tab" : "Pop-up dialog"}
        />
      </EnquiryDialog>
    </>
  );
}
