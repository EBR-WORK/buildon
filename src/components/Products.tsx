"use client";

import Image from "next/image";
import Link from "next/link";
/* `import type` is erased at compile time, so the shape is still checked
   against content.ts while nothing from it reaches the browser bundle. The
   values arrive as props. */
import type { products as ProductsContent } from "@/lib/content";
import { useCoverflow } from "@/lib/useCoverflow";
import CarouselButton from "./CarouselButton";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * The city pages pass their own `title` and `intro` — lower-case "gypsum
 * plaster" in those headings is the reference's wording, not a slip.
 */
export default function Products({
  copy,
  title,
  intro,
}: {
  /* The section's text, handed down by the page.

     Not imported here, because this is a client component: whatever it imports
     is compiled into the JavaScript bundle, and that bundle is shared by /,
     /mr and /hi. English baked into it cannot be translated for one language
     without breaking the other two — the page arrived in Hindi and React
     redrew this carousel in English a moment later, from its own copy. Props
     travel in the hydration payload, which is per-page and translatable. */
  copy: typeof ProductsContent;
  /* The city pages vary the heading and the first intro line. Those used to be
     built here from a `city` prop — which put the English template literal in
     the bundle just as surely as an import would, and it survived the first
     pass of this fix for exactly that reason. The caller is a server
     component, so it builds the sentence and passes the finished string. */
  title?: string;
  intro?: readonly string[];
}) {
  const products = copy;
  const heading = title ?? products.title;
  const introLines = intro ?? products.intro;

  /* Depth, not just a turn.
     Read off the reference: the cards beside the centre are not only angled,
     they stand behind it — which a scroll-snap row cannot do, since everything
     in a scroller shares one plane. Hence a hand-placed row. */
  const { frameRef, cardRefs, selected, ready, nudge, wasDragged, dragHandlers } = useCoverflow({
    count: products.items.length,
  });

  return (
    <section
      id="products"
      className="section-y scroll-mt-28 border-t border-line"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading title={heading} intro={introLines} align="center" />
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
                  {/* The whole card is the link, as the grid on /products
                      already is: one target per product, named after it,
                      rather than a card you can only open by finding the
                      "Read More" inside it.

                      onClick, not onDragEnd: a drag finishes with a click on
                      whatever was under the finger, so throwing the row would
                      otherwise open a product nobody chose. */}
                  <Link
                    href={product.href}
                    onClick={(event) => {
                      if (wasDragged()) event.preventDefault();
                    }}
                    /* A mouse press would move focus here, and the browser
                       scrolls to reveal a newly focused element when its card
                       sits partly below the fold. Cancelling the press's
                       default keeps focus where it is; the click still fires,
                       and keyboard focus is untouched. */
                    onMouseDown={(event) => event.preventDefault()}
                    className="group relative block aspect-4/5 w-full overflow-hidden rounded-2xl shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
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

                    {/* Hidden until the card is hovered, rather than merely
                        pushed below the card's edge by the panel's resting
                        offset. On a phone there is no hover and the cards are
                        short, so 58% of one left the description sitting on
                        top of the name it was supposed to be under.

                        Tailwind's hover variant carries `@media (hover: hover)`,
                        so on a touchscreen this never resolves and the card
                        stays a picture with a name — which is the whole
                        content of a tap target that opens the page anyway. */}
                    <div className="pb-14 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
                      {/* Clamped to five lines, as the reference clamps its
                          own, so a long description cannot push the link out
                          of the card. */}
                      <p className="text-[15px] leading-relaxed text-white/90 line-clamp-5">
                        {product.body}
                      </p>

                      {/* Display only: the card itself is the link, so this is
                          the reference's affordance without a second tab stop,
                          a link inside a link (which is invalid), or something
                          screen readers would announce as "Read More" instead
                          of the product's name. */}
                      <span
                        aria-hidden
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white transition group-hover:gap-2.5"
                      >
                        {products.readMore}
                      </span>
                    </div>
                  </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
