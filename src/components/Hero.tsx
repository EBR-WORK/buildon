import { hero } from "@/lib/content";
import BackgroundVideo from "./BackgroundVideo";
import { ArrowIcon, PlayIcon } from "./icons";

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
        <p className="inline-block bg-brand-500 px-4 py-2 font-display text-sm font-medium tracking-[0.08em] text-white sm:text-[15px]">
          {hero.eyebrow}
        </p>

        <h1 className="mt-6 text-[clamp(2.1rem,4.8vw+0.6rem,4rem)] leading-[1.12] font-semibold text-white">
          {hero.titleLines[0]}
          <br />
          <span className="text-brand-300">{hero.titleLines[1]}</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
          {hero.intro}
        </p>

        <div className="mt-8 flex w-full flex-col items-center gap-4 sm:mt-10 sm:w-auto sm:flex-row sm:gap-6">
          <a
            href={hero.primaryCta.href}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-display font-medium tracking-wide text-white shadow-card transition hover:bg-brand-600 sm:w-auto"
          >
            {hero.primaryCta.label}
            <ArrowIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href={hero.videoCta.href}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center justify-center gap-3 font-display font-medium tracking-wide text-white"
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/40 backdrop-blur transition group-hover:bg-brand-500 group-hover:ring-brand-500">
              <PlayIcon className="size-5 translate-x-px" />
            </span>
            {hero.videoCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
