import type { Metadata } from "next";
import LifeGalleries from "@/components/LifeGalleries";
import CtaLink from "@/components/CtaLink";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ArrowIcon, PinIcon, ShieldIcon } from "@/components/icons";
import { careerPage, site } from "@/lib/content";

const description = `${careerPage.banner.headingLines.join(" ")} ${careerPage.openings.items
  .map((job) => `${job.title}, ${job.location}`)
  .join(". ")}.`;

export const metadata: Metadata = {
  title: careerPage.title,
  description,
  alternates: { canonical: "/career" },
  openGraph: {
    type: "website",
    url: `${site.url}/career/`,
    title: `${careerPage.title} | ${site.name}`,
    description,
  },
};

/**
 * Two sections, as on the reference: the current openings, then the "Life at
 * Buildon" photo galleries.
 *
 * The reference's job board renders each opening as a row with the title on the
 * left and its specs on the right; the same shape is kept here. "More Details"
 * links to the job page once its href is filled in content.ts.
 */
export default function CareerPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageBanner
          image={careerPage.banner.image}
          headingLines={careerPage.banner.headingLines}
        />

        {/* Current openings */}
        <section className="section-y">
          <div className="container-page">
            <Reveal>
              <SectionHeading title={careerPage.openings.title} align="center" />
            </Reveal>

            <ul className="mt-8 space-y-4 sm:mt-10">
              {careerPage.openings.items.map((job, i) => (
                <Reveal as="li" key={`${job.title}-${job.location}`} delay={i * 0.08}>
                  <article className="group flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 transition hover:border-brand-200 hover:shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl leading-snug font-semibold transition-colors group-hover:text-brand-500 sm:text-2xl">
                        {job.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-ink-500">
                        <span className="inline-flex items-center gap-2">
                          <ShieldIcon className="size-4 shrink-0 text-brand-500" />
                          {job.experience}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <PinIcon className="size-4 shrink-0 text-brand-500" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <CtaLink
                      href={job.href}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-2 self-start text-sm font-semibold text-brand-500 transition hover:text-brand-600 sm:self-auto"
                    >
                      {careerPage.openings.more}
                      <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </CtaLink>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Life at Buildon */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page">
            <Reveal>
              <SectionHeading title={careerPage.life.title} align="center" />
            </Reveal>

            <LifeGalleries galleries={careerPage.life.galleries} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
