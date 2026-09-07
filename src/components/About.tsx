import Image from "next/image";
import { about, banner } from "@/lib/content";
import SectionHeading from "./SectionHeading";

/**
 * Mirrors buildon.co.in's About block: the full-width product banner, a solid
 * skin-colour band, then a white card pulled up over that band — their row is
 * `margin-top:-125px` with 30px of padding and a shadow.
 */
export default function About() {
  return (
    <section id="about" className="scroll-mt-24">
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
        <div className="relative z-10 -mt-[90px] bg-white p-5 shadow-lift sm:-mt-[125px] sm:p-[30px]">
          <div className="grid items-stretch gap-8 md:grid-cols-2 md:gap-0">
            <div className="relative min-h-[18rem] md:min-h-[24rem]">
              <Image
                src={about.image}
                alt="Interior wall finished with Buildon gypsum plaster"
                fill
                sizes="(min-width: 768px) 34rem, 92vw"
                loading="lazy"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center md:pt-[15px] md:pr-[25px] md:pl-[60px]">
              <SectionHeading title={about.titleLines} />
              <p className="mt-5 text-base leading-relaxed text-ink-500">{about.body}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
