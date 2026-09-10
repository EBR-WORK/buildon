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
      <div className="grid lg:grid-cols-2">
        <div className="section-y">
          {/* The padding lives on this block, not the column, so it matches
              container-page's own 1.25/1.75rem at every width.

              The 40rem cap and the ml-auto that pulls the block to the inner
              edge are lg-only, and must stay that way. At lg the column is half
              the container, so a 40rem block pushed right has its content edge
              at exactly (50% - 40rem + padding) — the value container-page
              resolves to, which is what lines this up with every other section.
              Below lg there is no second column to line up against: the same
              two utilities just park a 40rem block against the right edge of a
              full-width viewport, which is what left tablets with the form
              shoved into the right two-thirds. Stacked, it runs full width. */}
          <Reveal className="w-full px-5 sm:px-7 lg:ml-auto lg:max-w-[40rem] lg:pr-12 lg:pl-8">
            <SectionHeading title={contact.formTitle} />
            <EnquiryForm className="mt-8 sm:mt-10" />
          </Reveal>
        </div>

        {/* Stacked below lg, the photo is inset and rounded so it reads as its
            own block instead of running into the banner that follows. Only at
            lg, beside the form, does it bleed to the edge.
            The source is a square 800x800 crop, so at lg the panel is held
            square and centred. Stretching it to the form's full height scaled
            the subject up and sliced the sides off. */}
        <Reveal className="relative mx-5 mb-16 aspect-4/3 overflow-hidden rounded-2xl sm:mx-7 sm:mb-20 lg:mx-0 lg:mb-0 lg:aspect-square lg:min-h-0 lg:self-center lg:rounded-none">
          <Image
            src="/projects/plastering.jpg"
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
