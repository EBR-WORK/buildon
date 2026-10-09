"use client";

import Image from "next/image";
import { products } from "@/lib/content";
import { useCoverflow } from "@/lib/useCoverflow";
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

  /* Depth, not just a turn.
     Read off the reference: the cards beside the centre are not only angled,
     they stand behind it — which a scroll-snap row cannot do, since everything
     in a scroller shares one plane. Hence a hand-placed row. */
  const { frameRef, cardRefs, selected, ready, nudge, dragHandlers } = useCoverflow({
    count: products.items.length,
  });

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
            {/* Never disabled: the row wraps, so there is always a next. */}
            <CarouselButton
              direction="prev"
              label="Previous products"
              onClick={() => nudge(-1)}
            />
            <CarouselButton
              direction="next"
              label="Next products"
              onClick={() => nudge(1)}
            />
          </div>

          {/*
            Two layouts, one markup.

            Before hydration `ready` is false and this is an ordinary
            horizontal scroller: every card in flow, readable, scrollable,
            crawlable. After it, the cards come out of flow and the hook places
            them — which is the only way to put one card behind another.

            Rendering the coverflow on the server instead would ship nine cards
            stacked at left-1/2 to anyone whose JavaScript has not arrived.

            py-10 keeps the shadows and the receding cards clear of the
            overflow clip; -my-6 hands most of that space back so the section's
            rhythm is unchanged.

            touchAction pan-y: the horizontal drag is ours, the page keeps
            vertical scrolling. Without it a diagonal swipe on a phone fights
            the page.
          */}
          <div
            ref={frameRef}
            {...dragHandlers}
            style={{
              /* One card drives everything: pitch, recession and the lens.
                 Expressing perspective as a multiple of it keeps the rake the
                 same shape at every screen size. */
              ["--card" as string]: "clamp(15rem, 26vw, 21rem)",
              perspective: ready ? "calc(var(--card) * 3.2)" : undefined,
              touchAction: ready ? "pan-y" : undefined,
            }}
            className={
              ready
                ? "relative -my-6 cursor-grab overflow-hidden py-10 select-none active:cursor-grabbing"
                : "-mr-4 -mb-5 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-6 sm:-mr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            }
          >
            <ul
              aria-label="Buildon gypsum products"
              className={ready ? "relative mx-auto" : "contents"}
              style={
                ready
                  ? { height: "calc(var(--card) * 1.25)", transformStyle: "preserve-3d" }
                  : undefined
              }
            >
              {products.items.map((product, i) => (
                /* No Reveal here any more. It animates opacity and transform
                   on the list item, and once the hook is placing cards those
                   are exactly the two properties it owns — two writers, one
                   property, and the card either never appears or never moves.
                   The section heading still reveals; the row does not need to. */
                <li
                  key={product.name}
                  ref={(node) => {
                    cardRefs.current[i] = node;
                  }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${products.items.length}`}
                  /* Which card is being offered, for anything that cannot
                     see which one is facing forward. */
                  aria-current={ready && i === selected ? "true" : undefined}
                  className={
                    ready
                      ? "absolute top-0 left-1/2 transition-opacity duration-500 ease-out will-change-transform"
                      : "flex w-full shrink-0 snap-start pr-4 sm:w-1/2 sm:pr-6 lg:w-1/3"
                  }
                  /* Two states, not a gradient: every card dimmed, the centred
                     one lit, with the transition doing the in-between. The
                     reference does exactly this in CSS, and it is why its row
                     reads as one card being offered rather than a shelf of
                     evenly-faded ones. */
                  style={
                    ready ? { width: "var(--card)", opacity: i === selected ? 1 : 0.4 } : undefined
                  }
                >
                  {/* No transform of its own: the list item is what the hook
                      places, and two owners of one property is a fight neither
                      wins. The shadow is what reads the depth — a card standing
                      behind another needs to cast onto it. */}
                  <article className="group relative aspect-4/5 w-full overflow-hidden rounded-2xl shadow-lift">
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
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
