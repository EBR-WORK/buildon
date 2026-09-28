import Image from "next/image";
import { contact } from "@/lib/content";
import EnquiryForm from "./EnquiryForm";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * "Send Us Message" — on buildon.co.in this sits between the product grid and
 * the About block: underlined fields on the left, a photograph bleeding off the
 * right edge. The form itself lives in EnquiryForm, shared with /contact-us.
 */
export default function ContactForm() {
  return (
    <section id="enquiry" className="scroll-mt-28 border-t border-line bg-surface">
      {/* At lg the row fills the screen: one viewport tall whenever the form
          fits, which is what trims the old 7rem band of whitespace. A minimum
          rather than a fixed height, so a short laptop window grows the section
          and scrolls the page normally instead of clipping the submit button or
          giving the column a scrollbar of its own. */}
      <div className="grid lg:min-h-svh lg:grid-cols-2">
        <div className="section-y lg:flex lg:items-center lg:py-10">
          {/* The padding lives on this block, not the column, so it matches
              container-page's own 1.25/1.75rem at every width.

              The 40rem cap and the mx-auto that centres it are lg-only. At lg
              the block sits in the middle of its half of the row, beside the
              photograph; below lg there is no second column to sit beside, so
              it simply runs full width. */}
          <Reveal className="w-full px-5 sm:px-7 lg:mx-auto lg:max-w-[40rem] lg:px-10">
            <SectionHeading title={contact.formTitle} />
            <EnquiryForm className="mt-8 sm:mt-10" />
          </Reveal>
        </div>

        {/* Stacked below lg, the photo is inset and rounded so it reads as its
            own block instead of running into the banner that follows. Only at
            lg, beside the form, does it bleed to the edge.
            The source is a square 800x800 crop, so at lg the panel is held
            square and centred in the row rather than stretched to its full
            height: a half-column that tall crops the sides off the subject.
            The row is one screen, the square is the column's width, so it sits
            inside that with a shallow band of the section's own grey above and
            below. */}
        <Reveal className="relative mx-5 mb-16 aspect-4/3 overflow-hidden rounded-2xl sm:mx-7 sm:mb-20 lg:mx-0 lg:mb-0 lg:aspect-square lg:min-h-0 lg:self-center lg:rounded-none">
          <Image
            src="/projects/plastering.webp"
            alt="A plasterer smoothing a ceiling with a trowel"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            loading="lazy"
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
}
