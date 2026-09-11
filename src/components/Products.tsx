"use client";

import Image from "next/image";
import { products } from "@/lib/content";
import { useSnapCarousel } from "@/lib/useSnapCarousel";
import CarouselButton from "./CarouselButton";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function Products() {
  const { trackRef, index, atStart, atEnd, goTo } = useSnapCarousel<HTMLUListElement>();

  return (
    <section
      id="products"
      className="section-y scroll-mt-28 border-t border-line"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading title={products.title} intro={products.intro} align="center" />
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
                {/* No hover lift here, unlike the grid pages: inside a track
                    that clips, a card rising 4px loses its top border. */}
                <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-card">
                  <div className="relative aspect-4/3 overflow-hidden bg-white">
                    <Image
                      src={product.image}
                      alt={`${product.name} — Buildon packaging`}
                      fill
                      sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-xl leading-snug font-semibold transition-colors group-hover:text-brand-500 sm:text-2xl">
                      {product.name}
                    </h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-500 sm:mt-2.5">
                      {product.body}
                    </p>
                    {/* A mouse press would move focus here, and the browser
                        scrolls to reveal a newly focused element when its card
                        sits partly below the fold. Cancelling the press's
                        default keeps focus where it is; the click still fires,
                        and keyboard focus is untouched. */}
                    <button
                      suppressHydrationWarning
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      className="mt-4 inline-flex cursor-pointer items-center gap-1.5 self-start text-sm font-semibold text-brand-500 transition hover:text-brand-600 sm:mt-5"
                    >
                      {products.readMore}
                    </button>
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
