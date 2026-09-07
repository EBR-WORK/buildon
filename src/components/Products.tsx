"use client";

import Image from "next/image";
import { products } from "@/lib/content";
import { useSnapCarousel } from "@/lib/useSnapCarousel";
import CarouselButton from "./CarouselButton";
import SectionHeading from "./SectionHeading";

export default function Products() {
  const { trackRef, index, atStart, atEnd, goTo } = useSnapCarousel<HTMLUListElement>();

  return (
    <section
      id="products"
      className="section-y scroll-mt-24 border-t border-line"
    >
      <div className="container-page">
        <SectionHeading title={products.title} intro={products.intro} align="center" />

        <div className="relative mt-10 sm:mt-12 lg:mt-14">
          {/* The negative right margin absorbs the last card's gutter, so the
              row still ends flush with the container. */}
          <ul
            ref={trackRef}
            tabIndex={0}
            aria-label="Buildon gypsum products"
            className="-mr-4 flex snap-x snap-mandatory overflow-x-auto pb-1 sm:-mr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.items.map((product) => (
              <li
                key={product.href}
                className="flex w-full shrink-0 snap-start pr-4 sm:w-1/2 sm:pr-6 lg:w-1/3"
              >
                <a
                  href={product.href}
                  className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-lift"
                >
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
                    <h3 className="text-xl leading-snug font-semibold group-hover:text-brand-500 sm:text-2xl">
                      {product.name}
                    </h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-500 sm:mt-2.5">
                      {product.body}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 sm:mt-5">
                      {products.readMore}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <CarouselButton
            direction="prev"
            label="Previous products"
            onClick={() => goTo(index - 1)}
            disabled={atStart}
            className="absolute top-1/2 left-0 z-10 -translate-y-1/2 bg-line text-ink-700 shadow-card hover:bg-brand-500 hover:text-white lg:-left-5"
          />
          <CarouselButton
            direction="next"
            label="Next products"
            onClick={() => goTo(index + 1)}
            disabled={atEnd}
            className="absolute top-1/2 right-0 z-10 -translate-y-1/2 bg-line text-ink-700 shadow-card hover:bg-brand-500 hover:text-white lg:-right-5"
          />
        </div>
      </div>
    </section>
  );
}
