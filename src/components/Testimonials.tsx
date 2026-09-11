"use client";

import { testimonials } from "@/lib/content";
import { useSnapCarousel } from "@/lib/useSnapCarousel";
import CarouselButton from "./CarouselButton";
import CtaLink from "./CtaLink";
import { QuoteIcon } from "./icons";
import SectionHeading from "./SectionHeading";
import VideoPlayer from "./VideoPlayer";
import Reveal from "./Reveal";

/**
 * Mirrors buildon.co.in: the clip on the left third, the heading and a
 * one-at-a-time quote carousel on the right two thirds, on white. Stacks below
 * lg — a third of a tablet is not enough room for the video.
 */
export default function Testimonials() {
  const { trackRef, index, atStart, atEnd, goTo } = useSnapCarousel<HTMLUListElement>();
  const count = testimonials.items.length;

  return (
    <section id="testimonials" className="section-y scroll-mt-28 bg-white">
      <Reveal className="container-page grid items-center gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 lg:col-span-1">
          <VideoPlayer
            src={testimonials.video.src}
            poster={testimonials.video.poster}
            label="Play the Buildon client video"
            className="mx-auto w-full max-w-[450px] lg:max-w-none"
          />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <SectionHeading title={testimonials.title} />

          <ul
            ref={trackRef}
            tabIndex={0}
            aria-label="Client testimonials"
            className="mt-6 flex max-w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {testimonials.items.map((item) => (
              <li
                key={item.author}
                className="w-full min-w-0 shrink-0 snap-start pr-1"
                aria-roledescription="slide"
              >
                <QuoteIcon className="size-8 text-brand-200" />
                <blockquote className="mt-3 text-[15px] leading-relaxed break-words text-ink-500">
                  {item.quote}
                </blockquote>
                <p className="mt-4 font-display text-lg leading-snug font-semibold">
                  {item.author}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex gap-2">
              <CarouselButton
                direction="prev"
                label="Previous testimonial"
                onClick={() => goTo(index - 1)}
                disabled={atStart}
              />
              <CarouselButton
                direction="next"
                label="Next testimonial"
                onClick={() => goTo(index + 1)}
                disabled={atEnd}
              />
            </div>

            <div className="flex gap-2">
              {testimonials.items.map((item, i) => (
                <button
                  suppressHydrationWarning
                  key={item.author}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to testimonial ${i + 1} of ${count}`}
                  aria-current={i === index}
                  className={`size-2.5 rounded-full transition ${
                    i === index ? "bg-brand-500" : "bg-line hover:bg-brand-300"
                  }`}
                />
              ))}
            </div>

            <CtaLink
              href={testimonials.cta.href}
              className="cursor-pointer text-sm font-semibold text-brand-500 hover:text-brand-600 sm:ml-auto"
            >
              {testimonials.cta.label}
            </CtaLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
