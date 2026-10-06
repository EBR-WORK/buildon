import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { careerPage, site } from "@/lib/content";
import { getPublishedJob, publishedCareer } from "@/lib/cms/published";

/**
 * /career/<slug> — one template for every opening.
 *
 * Both the routes it builds and the copy it renders come from
 * content/career.json via publishedCareer, so an opening added in the admin
 * panel gets a page on the next build.
 *
 * The reference publishes these under /careers/<slug>/ from its job-board
 * plugin: three specification terms, a description where one was written, and
 * an application form. Same shape here, driven by careerDetails.ts.
 */

export function generateStaticParams() {
  return publishedCareer.jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getPublishedJob(slug);
  if (!job) return {};

  const description = `${job.title} — ${job.type}, ${job.location}. Apply to join Buildon Plasters.`;
  return {
    title: `${job.title} — ${job.location}`,
    description,
    alternates: { canonical: `/career/${job.slug}` },
    openGraph: {
      type: "website",
      url: `${site.url}/career/${job.slug}/`,
      title: `${job.title} | ${site.name}`,
      description,
    },
  };
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = getPublishedJob(slug);
  if (!job) notFound();

  const others = publishedCareer.jobs.filter((opening) => opening.slug !== job.slug);

  const jobJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.responsibilities.join(" ") || `${job.title} at ${site.name}.`,
    employmentType: "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: site.name, sameAs: site.url },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IN" },
    },
    experienceRequirements: job.type,
  };

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* "Career Openings" rides the bar as the eyebrow, not headingLines:
            the eyebrow renders a <p> at the same size, so the bar reads as a
            heading while the job title below stays the page's only <h1>. */}
        <PageBanner image={careerPage.banner.image} eyebrow={publishedCareer.openingsTitle} />

        <section className="section-y">
          <div className="container-page">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
              <div>
                <Reveal>
                  {/* The section label is on the banner now, so the title leads. */}
                  <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold text-ink-900">
                    {job.title}
                  </h1>

                  {/* The plugin's three specification terms. */}
                  <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
                    {[
                      ["Job Category", job.category],
                      ["Job Type", job.type],
                      ["Job Location", job.location],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                          {label}
                        </dt>
                        <dd className="mt-1 font-display text-lg font-semibold text-ink-900">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>

                {job.responsibilities.length > 0 ? (
                  <Reveal delay={0.06}>
                    <h2 className="mt-10 font-display text-xl leading-snug font-semibold text-ink-900 sm:mt-12 sm:text-2xl">
                      Key Responsibilities
                    </h2>
                    <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-ink-500 sm:text-base">
                      {job.responsibilities.map((item) => (
                        <li
                          key={item}
                          className="relative pl-6 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rounded-full before:bg-brand-500"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ) : (
                  /* Two of the three openings carry no description upstream.
                     Saying so is better than an empty heading. */
                  <Reveal delay={0.06}>
                    <p className="mt-10 text-[15px] leading-relaxed text-ink-500 sm:mt-12 sm:text-base">
                      A full description for this role is on its way. Send us your details and we
                      will come back to you with what it involves.
                    </p>
                  </Reveal>
                )}

                <Reveal delay={0.1}>
                  <div className="mt-12 rounded-2xl border border-line bg-surface p-6 sm:mt-14 sm:p-8">
                    <h2
                      id="apply"
                      className="scroll-mt-28 font-display text-xl leading-snug font-semibold text-ink-900 sm:text-2xl"
                    >
                      Apply for this position
                    </h2>
                    <ApplicationForm jobTitle={`${job.title} — ${job.location}`} />
                  </div>
                </Reveal>
              </div>

              {/* Plain <aside>, not a Reveal: it is above the fold, and Reveal
                  holds a tall element faded out until 15% of it is on screen. */}
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-2xl border border-line bg-white px-5 py-6">
                  <h2 className="relative mb-5 font-display text-xl leading-snug font-semibold text-ink-900 before:absolute before:top-1 before:-left-5 before:h-[31px] before:w-[3px] before:bg-brand-500 before:content-['']">
                    Other Openings
                  </h2>

                  <ul className="-mx-5 -mb-6 overflow-hidden rounded-b-2xl border-t border-line">
                    {others.map((opening) => (
                      <li
                        key={opening.slug}
                        className="border-b border-line last:border-b-0"
                      >
                        <Link
                          href={`/career/${opening.slug}`}
                          className="relative block w-full px-5 py-4 text-left transition-all duration-300 ease-linear hover:shadow-[0_20px_20px_0_rgba(0,0,0,0.06)] before:absolute before:bottom-1/2 before:left-0 before:h-0 before:w-[5px] before:bg-brand-500 before:transition-all before:duration-300 before:[transition-timing-function:cubic-bezier(.645,.045,.355,1)] hover:before:bottom-0 hover:before:h-full"
                        >
                          <span className="block font-display text-[15px] leading-snug font-medium text-ink-700 transition-colors group-hover:text-brand-500">
                            {opening.title}
                          </span>
                          <span className="mt-0.5 block text-sm text-ink-500">
                            {opening.location} · {opening.type}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/career"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-brand-500 transition hover:text-brand-600"
                >
                  View More Jobs &gt;
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        // Static, locally-authored object — no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd) }}
      />
    </>
  );
}
