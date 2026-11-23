"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { getDictionary } from "@/lib/i18n";
import { localeOf } from "@/lib/i18n/config";
import EnquiryDialog from "./EnquiryDialog";
import EnquiryForm from "./EnquiryForm";

/**
 * The catalogue button, with the enquiry form in front of it.
 *
 * The sheet used to be a plain link. Everyone who wanted it took it and left
 * no trace, which is the one thing a catalogue download is good for: somebody
 * reading a product page closely enough to want the specification is the best
 * lead the site produces, and the page was letting all of them through
 * anonymously.
 *
 * So the form comes first and the file follows. The order matters — the
 * download starts only once the enquiry is actually stored, never on the
 * mail-draft fallback, where nothing has been received.
 *
 * It is a soft gate on purpose. The same PDFs are listed on
 * /download-catalogue and are reachable by their own URL; this asks the
 * question of somebody who is already interested rather than trying to make
 * the file unobtainable, which it could not do on a static site anyway.
 */
export default function CatalogueDownload({
  product,
  href,
  label,
}: {
  product: string;
  href: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const t = getDictionary(localeOf(usePathname() ?? "/")).catalogue;

  /* A click on an anchor the page never shows, rather than assigning to
     location: `download` keeps the browser from navigating away to a PDF
     viewer, so the visitor stays on the page with the dialog they just filled
     in still in front of them. Same-origin, so the attribute is honoured. */
  function startDownload() {
    const link = document.createElement("a");
    link.href = href;
    link.download = "";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <>
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => {
          setSent(false);
          setOpen(true);
        }}
        className="inline-flex cursor-pointer items-center justify-center rounded-md bg-brand-500 px-8 py-3.5 font-display text-sm font-medium tracking-wide text-white uppercase transition hover:bg-brand-600 sm:text-[15px]"
      >
        {label}
      </button>

      <EnquiryDialog open={open} onClose={() => setOpen(false)} title={label}>
        {sent ? (
          <div
            role="status"
            className="rounded-2xl border border-brand-200 bg-brand-50/50 p-6 text-center"
          >
            <p className="font-display text-lg font-semibold">{t.ready}</p>
            {/* A browser that blocked the click above leaves no error and no
                file. This is the way out of that, and it is also the honest
                thing to show someone who has just paid for the download with
                their details. */}
            <a
              href={href}
              download
              className="mt-3 inline-block text-sm font-semibold text-brand-500 transition hover:text-brand-600"
            >
              {t.manual}
            </a>
          </div>
        ) : (
          <>
            <p className="mb-5 text-[15px] leading-relaxed text-ink-500">{t.intro}</p>
            <EnquiryForm
              /* Prefixed: /contact-us and the home page carry this same form,
                 and two copies claiming the same ids point every label at the
                 first. */
              idPrefix="catalogue-"
              defaultProduct={product}
              source="Catalogue download"
              onSent={() => {
                setSent(true);
                startDownload();
              }}
            />
          </>
        )}
      </EnquiryDialog>
    </>
  );
}
