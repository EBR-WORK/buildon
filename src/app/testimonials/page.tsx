import type { Metadata } from "next";
import Image from "next/image";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VideoPlayer from "@/components/VideoPlayer";
import { QuoteIcon } from "@/components/icons";
import { site, testimonialsPage } from "@/lib/content";

const description = testimonialsPage.letters[0].quote.slice(0, 155);

export const metadata: Metadata = {
  title: testimonialsPage.title,
  description,
  alternates: { canonical: "/testimonials" },
  openGraph: {
    type: "website",
    url: `${site.url}/testimonials/`,
    title: `${testimonialsPage.title} | ${site.name}`,
    description,
  },
};

/**
 * Follows buildon.co.in/testimonials/: the two video testimonials side by side,
 * each with its caption beneath, then the client letters as cards — photograph,
 * the letter, and who wrote it.
 */
export default function TestimonialsPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageBanner
          image={testimonialsPage.banner.image}
          headingLines={testimonialsPage.banner.headingLines}
          subheadingLines={testimonialsPage.banner.subheadingLines}
        />

        {/* Video testimonials */}
        <section className="section-y">
          <div className="container-page">
            <ul className="grid gap-10 lg:grid-cols-2 lg:gap-12">
              {testimonialsPage.videos.map((video, i) => (
                <Reveal as="li" key={video.src} delay={i * 0.08} className="min-w-0">
                  <VideoPlayer src={video.src} poster={video.poster} label={video.label} />
                  <QuoteIcon className="mt-6 size-8 text-accent-500/30" />
                  <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-500">
                    {video.quote}
                  </blockquote>
                  {/* The closing mark: the opening one turned over, as on the reference */}
                  <QuoteIcon className="mt-3 ml-auto size-8 rotate-180 text-accent-500/30" />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Client letters */}
        <section className="section-y border-t border-line bg-surface">
          <ul className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {testimonialsPage.letters.map((letter, i) => (
              <Reveal
                as="li"
                key={letter.author}
                delay={Math.min(i, 3) * 0.08}
                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white"
              >
                <div className="relative aspect-[522/378] w-full">
                  <Image
                    src={letter.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 24rem, (min-width: 640px) 46vw, 92vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
                <figure className="flex flex-1 flex-col p-6 sm:p-7">
                  <QuoteIcon className="size-8 text-accent-500/30" />
                  <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-500">
                    {letter.quote}
                  </blockquote>
                  <QuoteIcon className="mt-3 ml-auto size-8 rotate-180 text-accent-500/30" />
                  {/* Same hairline-and-tick rule as the contact details. The
                      min height fits a two-line name, so the rules line up
                      across a row whether or not a name wraps. */}
                  <figcaption className="relative mt-6 border-t border-line pt-4 font-display text-lg leading-snug font-semibold sm:min-h-[4.25rem] before:absolute before:-top-px before:left-0 before:h-0.5 before:w-7 before:bg-accent-500 before:content-['']">
                    {letter.author}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
