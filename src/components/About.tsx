import Image from "next/image";
import { about, banner } from "@/lib/content";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * Mirrors buildon.co.in's About block: the full-width product banner, a solid
 * skin-colour band, then a white card pulled up over that band — their row is
 * `margin-top:-125px` with 30px of padding and a shadow.
 */
export default function About() {
  return (
    <section id="about" className="scroll-mt-28">
      <Image
        src={banner.image}
        alt={banner.alt}
        width={1718}
        height={508}
        sizes="100vw"
        loading="lazy"
        className="w-full"
      />

      <div aria-hidden className="h-[130px] bg-brand-500 sm:h-[205px]" />

      <div className="container-page">
        <Reveal className="relative z-10 -mt-[90px] bg-white p-5 shadow-lift sm:-mt-[125px] sm:p-[30px]">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-0">
            {/* The photograph is now cropped to the sofa and table: 659x423.
                The box carries that exact ratio, so object-cover has nothing
                left to trim — the old 4:5 portrait box showed barely half its
                width. Landscape, it can run the column's full width at every
                size, so the portrait-era max-width cap is gone. */}
            <div className="relative aspect-[659/423] w-full">
              <Image
                src={about.image}
                alt="Interior wall finished with Buildon gypsum plaster"
                fill
                sizes="(min-width: 768px) 34rem, 92vw"
                loading="lazy"
                className="object-cover object-center"
              />
            </div>

            <div className="flex flex-col justify-center md:pt-[15px] md:pr-[25px] md:pl-[60px]">
              <SectionHeading title={about.titleLines} />
              <p className="mt-5 text-base leading-relaxed text-ink-500">{about.body}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
