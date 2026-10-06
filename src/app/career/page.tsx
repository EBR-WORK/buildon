import type { Metadata } from "next";
import LifeGalleries from "@/components/LifeGalleries";
import JobOpenings from "@/components/JobOpenings";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { careerPage, site } from "@/lib/content";
import { publishedCareer } from "@/lib/cms/published";

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
 * links to its job page as soon as that opening is transcribed in
 * careerDetails.ts; content.ts leaves every href empty.
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
              <SectionHeading title={publishedCareer.openingsTitle} align="center" />
            </Reveal>

            {/* The list and its location filter — a client component, since
                the filter is interactive; the unfiltered list still renders on
                the server, so every opening is in the static HTML. */}
            <JobOpenings />
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
