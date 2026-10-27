"use client";

import { useState } from "react";
import EnquiryDialog from "./EnquiryDialog";
import EnquiryForm from "./EnquiryForm";
import { MailIcon } from "./icons";

/**
 * "Enquire about this" — beside the catalogue download on a product page.
 *
 * The two buttons are the two things someone at the bottom of a product page
 * wants: the specification, or a person. Until now only the first was offered,
 * and the second meant finding the quote tab and then telling it which product
 * they had just been reading about.
 *
 * So the dropdown opens on that product. The visitor is looking at the answer
 * already; asking them to pick it out of a list of ten is asking a question
 * they answered by being here.
 */
export default function ProductEnquiry({ product }: { product: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Outlined, against the filled catalogue button beside it: both are
          wanted, but the sheet is the one most people came for, and two filled
          buttons side by side make that choice for nobody. */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-brand-500 bg-white px-8 py-3.5 font-display text-sm font-medium tracking-wide text-brand-500 uppercase transition hover:bg-brand-50 sm:text-[15px]"
      >
        <MailIcon className="size-4" />
        Enquire about this
      </button>

      <EnquiryDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Enquire about ${product}`}
      >
        <EnquiryForm
          /* Prefixed: /contact-us and the home page carry this same form, and
             two copies claiming the same ids point every label at the first. */
          idPrefix="product-"
          defaultProduct={product}
          source="Product page"
        />
      </EnquiryDialog>
    </>
  );
}
