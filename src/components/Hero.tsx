import { hero } from "@/lib/content";
import BackgroundVideo from "./BackgroundVideo";
import CtaLink from "./CtaLink";
import { ArrowIcon, PlayIcon } from "./icons";

const primaryCtaClass =
  "group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-display font-medium tracking-wide text-white shadow-card transition hover:bg-brand-600 sm:w-auto";

/**
 * Full-bleed banner: the looping clip fills the section, a dark wash keeps the
 * white copy legible over whatever frame happens to be showing, and the content
 * is centred over it.
 *
 * `isolate` keeps the negative z-index backdrop layers inside this section
 * rather than letting them fall behind the page.
 */
export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-secondary">
      <BackgroundVideo
        src={hero.video}
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      {/* A flat wash for contrast, plus extra weight top and bottom so the
          header above and the section below meet a darker edge. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-secondary/55" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-secondary/60 via-transparent to-secondary/70"
      />

      <div className="container-page relative flex min-h-[32rem] flex-col items-center justify-center py-20 text-center sm:min-h-[38rem] lg:min-h-[calc(100svh-6rem)] lg:py-24">
        <p className="inline-block animate-rise bg-brand-500 px-4 py-2 font-display text-sm font-medium tracking-[0.08em] text-white sm:text-[15px]">
          {hero.eyebrow}
        </p>

        <h1 className="mt-6 animate-rise [animation-delay:120ms] text-[clamp(2.1rem,4.8vw+0.6rem,4rem)] leading-[1.12] font-semibold text-white">
          {hero.titleLines[0]}
          <br />
          <span className="text-brand-300">{hero.titleLines[1]}</span>
        </h1>

        <p className="mt-5 max-w-2xl animate-rise text-base leading-relaxed [animation-delay:240ms] text-white/80 sm:mt-6 sm:text-lg">
          {hero.intro}
        </p>

        <div className="mt-8 flex w-full animate-rise flex-col items-center gap-4 [animation-delay:360ms] sm:mt-10 sm:w-auto sm:flex-row sm:gap-6">
          {/* Both CTAs follow their href in content.ts through CtaLink: a real
              link once one is filled in, an inert button while it is empty. */}
          <CtaLink href={hero.primaryCta.href} className={primaryCtaClass}>
            {hero.primaryCta.label}
            <ArrowIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
          </CtaLink>

          {/*
            The reference's play control is a 48px disc set inside a hairline
            ring, with its 15px label beside it. The ring and the disc are
            separate layers so the gap between them stays even.

            No transform on the glyph: PlayIcon's triangle already has its
            centroid on the viewBox centre (12.04, 12), which is what reads as
            centred for a shape whose area leans toward its base. Nudging it
            right only moved it off centre — at this size the old 1.5px put the
            centroid at x=14.
          */}
          <CtaLink
            href={hero.videoCta.href}
            className="group inline-flex cursor-pointer items-center justify-center gap-3.5 font-display text-[15px] font-medium tracking-[0.06em] text-white"
          >
            <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full ring-1 ring-white/40 transition group-hover:ring-white/80">
              <span
                aria-hidden
                className="absolute inset-1 rounded-full bg-white/15 backdrop-blur transition group-hover:bg-brand-500"
              />
              <PlayIcon className="relative size-[1.15rem]" />
            </span>
            {hero.videoCta.label}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
