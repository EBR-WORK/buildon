import Image from "next/image";
import { clients } from "@/lib/content";

/**
 * One marquee row. The logos are laid out twice and the pair slides by -50%,
 * which lands the second copy exactly where the first began — so the loop has
 * no visible restart.
 *
 * That only holds if half the track is exactly one copy wide, so tiles are
 * spaced with a right margin rather than `gap`. With `gap` the track has one
 * fewer space than tiles, half of it falls half a gap short of a copy, and
 * every loop jumps by 6-8px.
 */
function LogoRow({
  logos,
  reverse = false,
}: {
  logos: readonly string[];
  reverse?: boolean;
}) {
  const track = [...logos, ...logos];

  return (
    <div
      // The second row repeats the first's logos, so assistive tech reads the
      // clients once. Under reduced motion it is dropped altogether: two static
      // strips of the same logos add nothing.
      aria-hidden={reverse || undefined}
      className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${
        reverse ? "motion-reduce:hidden" : ""
      }`}
    >
      <ul
        className={`flex w-max animate-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:snap-x motion-reduce:overflow-x-auto ${
          reverse ? "[animation-direction:reverse]" : ""
        }`}
      >
        {track.map((logo, i) => {
          const duplicate = i >= logos.length;
          return (
            <li
              key={`${logo}-${i}`}
              aria-hidden={(!reverse && duplicate) || undefined}
              className="mr-3 flex h-20 w-36 shrink-0 items-center justify-center rounded-xl border border-line bg-white px-4 motion-reduce:snap-start sm:mr-4 sm:h-24 sm:w-44 sm:px-5"
            >
              <Image
                src={logo}
                alt={reverse || duplicate ? "" : "Client of Buildon Plasters"}
                width={180}
                height={78}
                loading="lazy"
                className="max-h-11 w-auto object-contain mix-blend-multiply sm:max-h-14"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Two marquees running in opposite directions. The second carries the same
 * logos in reverse order, so the two rows never show matching pairs side by
 * side as they pass.
 *
 * Hover sits on the shared wrapper, so pausing either row pauses both. Tiles
 * shrink on small screens, so the loop duration shortens with them to keep the
 * logos moving at roughly the same speed at every breakpoint.
 */
export default function Clients() {
  return (
    <section id="clients" className="section-y scroll-mt-28 border-t border-line">
      <div
        role="region"
        aria-label="Client logos"
        className="group space-y-3 [--marquee-duration:30s] sm:space-y-4 sm:[--marquee-duration:36s] lg:[--marquee-duration:42s]"
      >
        <LogoRow logos={clients.logos} />
        <LogoRow logos={[...clients.logos].reverse()} reverse />
      </div>
    </section>
  );
}
