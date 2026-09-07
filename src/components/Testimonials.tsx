"use client";

import { testimonials } from "@/lib/content";
import { useSnapCarousel } from "@/lib/useSnapCarousel";
import CarouselButton from "./CarouselButton";
import { QuoteIcon } from "./icons";
import VideoPlayer from "./VideoPlayer";

/**
 * Mirrors buildon.co.in: the clip on the left third, the heading and a
 * one-at-a-time quote carousel on the right two thirds, on white.
 */
export default function Testimonials() {
  const { trackRef, index, atStart, atEnd, goTo } = useSnapCarousel<HTMLUListElement>();
  const count = testimonials.items.length;

  return (
    <section id="testimonials" className="section-y scroll-mt-24 bg-white">
      <div className="container-page grid items-center gap-10 md:grid-cols-3 md:gap-12">
        <div className="md:col-span-1">
          <VideoPlayer
            src={testimonials.video.src}
            poster={testimonials.video.poster}
            label="Play the Buildon client video"
            className="mx-auto w-full max-w-[450px] md:max-w-none"
          />
        </div>

        <div className="md:col-span-2">
          <h2 className="text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
            {testimonials.title}
          </h2>

          <ul
            ref={trackRef}
            tabIndex={0}
            aria-label="Client testimonials"
            className="mt-6 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {testimonials.items.map((item) => (
              <li
                key={item.author}
                className="w-full shrink-0 snap-start pr-1"
                aria-roledescription="slide"
              >
                <QuoteIcon className="size-8 text-brand-200" />
                <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-500">
                  {item.quote}
                </blockquote>
                <p className="mt-4 font-display text-lg leading-snug font-semibold">
                  {item.author}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <CarouselButton
                direction="prev"
                label="Previous testimonial"
                onClick={() => goTo(index - 1)}
                disabled={atStart}
                className="bg-brand-500 text-white hover:bg-brand-600"
              />
              <CarouselButton
                direction="next"
                label="Next testimonial"
                onClick={() => goTo(index + 1)}
                disabled={atEnd}
                className="bg-brand-500 text-white hover:bg-brand-600"
              />
            </div>

            <div className="flex gap-2">
              {testimonials.items.map((item, i) => (
                <button
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

            <a
              href={testimonials.cta.href}
              className="ml-auto text-sm font-semibold text-brand-500 hover:text-brand-600"
            >
              {testimonials.cta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
