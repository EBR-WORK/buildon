"use client";

import Image from "next/image";
import { products } from "@/lib/content";
import { useSnapCarousel } from "@/lib/useSnapCarousel";
import CarouselButton from "./CarouselButton";
import CtaLink from "./CtaLink";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * `city` swaps the heading and the first line of the intro, as the reference's
 * city landing pages do — lower-case "gypsum plaster" in the heading is theirs,
 * not a slip.
 */
export default function Products({
  city,
  phrase,
}: {
  city?: string;
  phrase?: string;
} = {}) {
  const suffix = phrase ?? (city ? `in ${city}` : null);
  const title = suffix ? `Get Introduced To The Best gypsum plaster ${suffix}` : products.title;
  /* Only a city changes the intro line; the national page keeps "Being
     India’s largest", which is what the reference does. */
  const intro = city
    ? [`Being ${city}’s largest and leading manufacturer & importer of`, products.intro[1]]
    : products.intro;

  const { trackRef, index, atStart, atEnd, goTo } = useSnapCarousel<HTMLUListElement>();

  return (
    <section
      id="products"
      className="section-y scroll-mt-28 border-t border-line"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading title={title} intro={intro} align="center" />
        </Reveal>

        <div className="mt-10 sm:mt-12 lg:mt-14">
          <div className="mb-5 flex justify-end gap-2">
            <CarouselButton
              direction="prev"
              label="Previous products"
              onClick={() => goTo(index - 1)}
              disabled={atStart}
            />
            <CarouselButton
              direction="next"
              label="Next products"
              onClick={() => goTo(index + 1)}
              disabled={atEnd}
            />
          </div>

          {/* The negative right margin absorbs the last card's gutter, so the
              row still ends flush with the container.

              No tabIndex on the track. Focusable, a click anywhere on a card
              focused the whole list, and the browser scrolled the page to fit
              it into view — a smooth glide, since html has scroll-behavior:
              smooth. Keyboard users lose nothing: the Read More buttons are
              focusable, and tabbing to one brings its card into view.

              overflow-y-hidden matters as much as overflow-x-auto. Making one
              axis scroll makes the other compute to auto, so anything poking
              out vertically turned the track into a small vertical scroller:
              the wheel scrolled the cards inside their frame instead of the
              page. Hidden, the track can never take a vertical wheel.

              pb-6 is room for the hover shadow to fade out rather than end in
              a hard line at the track's edge; -mb-5 hands that space back so
              the section's spacing is unchanged. */}
          <ul
            ref={trackRef}
            aria-label="Buildon gypsum products"
            className="-mr-4 -mb-5 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-6 sm:-mr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.items.map((product, i) => (
              // Cards past the third sit outside the track's clip, so they
              // animate when the carousel brings them in rather than on load.
              // The delay is capped so those never wait half a second.
              //
              // y={0}: a fade with no rise. A card waiting 24px below its place
              // is overflow the track would clip, and cards 4-6 wait until the
              // carousel reaches them.
              <Reveal
                as="li"
                key={product.name}
                y={0}
                delay={Math.min(i, 2) * 0.08}
                className="flex w-full shrink-0 snap-start pr-4 sm:w-1/2 sm:pr-6 lg:w-1/3"
              >
                {/* The reference's own card, read off its stylesheet rather
                    than guessed at:

                      .business_box::before      #2E2E2E at 0.1 over the photo
                      :hover ::before            the brand colour at 0.8
                      .business_box_content      top: 60%, height: 100%,
                                                 justify-content: space-between
                      :hover .business_box_content   top: 0
                      transition                 0.5s ease-in-out all

                    So the panel is never hidden and nothing fades: it sits
                    low, showing only its head, and slides up to reveal the
                    body. The wash is always there too — it only changes colour
                    and deepens. */}
                <article className="group relative aspect-4/5 w-full overflow-hidden rounded-2xl">
                  <Image
                    src={product.image}
                    alt={`${product.name} — Buildon packaging`}
                    fill
                    sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                    className="object-cover"
                  />

                  {/* The wash: a tenth of near-black at rest, four fifths of
                      the brand colour on hover. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-ink-900/10 transition-colors duration-500 ease-in-out group-hover:bg-brand-500/80"
                  />

                  {/* The reference's photographs are dark enough to carry white
                      type under a 10% wash. These are not: every one is a white
                      bag on a pale background, so the resting name was white on
                      white. A gradient across the lower half fixes that, and
                      fades out on hover once the brand wash takes over. */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink-900/80 via-ink-900/45 to-transparent transition-opacity duration-500 ease-in-out group-hover:opacity-0"
                  />

                  <div className="absolute inset-x-0 top-[58%] flex h-full flex-col justify-between p-6 transition-[top] duration-500 ease-in-out group-hover:top-0 sm:p-7">
                    {/* drop-shadow as well as the gradient: the longest names
                        wrap to three lines and the top one can reach past the
                        gradient's start. */}
                    <h3 className="font-display text-xl leading-snug font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)] sm:text-2xl">
                      {product.name}
                    </h3>

                    <div className="pb-14">
                      {/* Clamped to five lines, as the reference clamps its
                          own, so a long description cannot push the link out
                          of the card. */}
                      <p className="text-[15px] leading-relaxed text-white/90 line-clamp-5">
                        {product.body}
                      </p>

                      {/* A mouse press would move focus here, and the browser
                          scrolls to reveal a newly focused element when its
                          card sits partly below the fold. Cancelling the
                          press's default keeps focus where it is; the click
                          still fires, and keyboard focus is untouched. */}
                      <CtaLink
                        href={product.href}
                        onMouseDown={(event) => event.preventDefault()}
                        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-white transition hover:gap-2.5"
                      >
                        {products.readMore}
                      </CtaLink>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
