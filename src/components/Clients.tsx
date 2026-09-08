import Image from "next/image";
import { clients } from "@/lib/content";
import SectionHeading from "./SectionHeading";

export default function Clients() {
  // Duplicated once so the marquee can loop seamlessly at -50%.
  const track = [...clients.logos, ...clients.logos];

  return (
    <section
      id="clients"
      className="section-y scroll-mt-28 border-t border-line"
    >
      <div className="container-page">
        <SectionHeading title={clients.title} intro={clients.intro} align="center" />
      </div>

      {/* Tiles shrink on small screens, so the loop duration shortens to keep the
          logos moving at roughly the same speed across breakpoints. */}
      <div
        className="group relative mt-10 overflow-hidden [--marquee-duration:30s] [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] sm:mt-12 sm:[--marquee-duration:36s] lg:mt-14 lg:[--marquee-duration:42s] lg:[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        role="region"
        aria-label="Client logos"
      >
        <ul className="flex w-max animate-marquee items-center gap-3 group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:snap-x motion-reduce:overflow-x-auto sm:gap-4">
          {track.map((logo, i) => (
            <li
              key={`${logo}-${i}`}
              aria-hidden={i >= clients.logos.length}
              className="flex h-20 w-36 shrink-0 items-center justify-center rounded-xl border border-line bg-white px-4 motion-reduce:snap-start sm:h-24 sm:w-44 sm:px-5"
            >
              <Image
                src={logo}
                alt={i < clients.logos.length ? "Client of Buildon Plasters" : ""}
                width={180}
                height={78}
                loading="lazy"
                className="max-h-11 w-auto object-contain mix-blend-multiply sm:max-h-14"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
