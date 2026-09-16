import Image from "next/image";
import { clients } from "@/lib/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

/**
 * "Meet Our Clients", as on buildon.co.in: heading, one line of intro, then the
 * logos laid straight on white — six across, the remaining five centred beneath.
 * No tiles and no marquee.
 *
 * The reference assembles this from 12-column rows (six col-sm-2, then five in a
 * padded row) plus a separate mobile-only copy of every logo in pairs. One
 * flex-wrap list covers both: from sm each logo takes a sixth of the width, so
 * eleven wrap six-then-five and justify-center centres the short row; below sm
 * each takes half, so they pair up with the eleventh centred on its own.
 */
export default function Clients() {
  return (
    <section
      id="clients"
      className="scroll-mt-28 bg-white pt-12 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading title={clients.title} intro={clients.intro} align="center" />
        </Reveal>

        <ul className="mx-auto mt-8 flex max-w-[56rem] flex-wrap justify-center gap-y-8 sm:mt-10 sm:gap-y-10">
          {clients.logos.map((logo, i) => (
            <Reveal
              as="li"
              key={logo.src}
              delay={(i % 6) * 0.05}
              className="flex basis-1/2 items-center justify-center px-3 sm:basis-1/6"
            >
              {/* multiply drops the off-white box some of the artwork carries */}
              <Image
                src={logo.src}
                alt={logo.name}
                width={logo.width}
                height={logo.height}
                loading="lazy"
                className="h-auto max-h-16 w-auto max-w-full object-contain mix-blend-multiply"
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
