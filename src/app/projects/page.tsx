import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { projectsPage, site } from "@/lib/content";
import { projectHref } from "@/lib/projectDetails";

// Built from the page's own banner copy plus the development names, now that
// there is no standing intro paragraph to lift.
const description = `${projectsPage.banner.headingLines.join(" ")} ${projectsPage.items.length} developments including ${projectsPage.items
  .slice(0, 4)
  .map((project) => project.name)
  .join(", ")}.`;

export const metadata: Metadata = {
  title: projectsPage.title,
  description,
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    url: `${site.url}/projects/`,
    title: `${projectsPage.title} | ${site.name}`,
    description,
  },
};

/**
 * One card per development, in the reference's order. The name sits under the
 * photograph as a real heading rather than an overlay, so it stays legible
 * whatever the image behind it looks like.
 */
export default function ProjectsPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageBanner
          image={projectsPage.banner.image}
          headingLines={projectsPage.banner.headingLines}
        />

        <section className="section-y">
          <div className="container-page">
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {projectsPage.items.map((project, i) => {
                /* content.ts leaves every href empty; a project links out once
                   its page is transcribed in projectDetails.ts. Where it has
                   one the whole card is the link, as the product cards are —
                   one target per project, and one link named after it rather
                   than twenty-odd identical "Read More"s. The rest stay plain
                   cards with an inert label. */
                const href = project.href || projectHref(project.name);

                const body = (
                  <>
                    <div className="relative aspect-4/3 overflow-hidden bg-surface">
                      <Image
                        src={project.image}
                        alt={`${project.name} — built with Buildon gypsum plaster`}
                        fill
                        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                        loading={i < 3 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h2 className="font-display text-lg leading-snug font-semibold transition-colors group-hover:text-brand-500 sm:text-xl">
                        {project.name}
                      </h2>
                      {/* Clamped to five lines so every card is the same height
                          however long the source paragraph runs. The reference
                          gets this by truncating server-side, which is why its
                          excerpts stop mid-sentence. */}
                      <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-ink-500 line-clamp-5">
                        {project.body}
                      </p>
                      {/* Display only where the card itself is the link, so it
                          adds no second tab stop and screen readers hear the
                          project's name rather than "Read More". */}
                      <span
                        aria-hidden
                        className="mt-4 inline-flex items-center self-start text-sm font-semibold text-brand-500 transition group-hover:text-brand-600 sm:mt-5"
                      >
                        {projectsPage.readMore}
                      </span>
                    </div>
                  </>
                );

                const shell =
                  "group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white";

                return (
                  <Reveal as="li" key={project.name} delay={(i % 3) * 0.06} className="flex">
                    {href ? (
                      <Link
                        href={href}
                        className={`${shell} transition hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none`}
                      >
                        {body}
                      </Link>
                    ) : (
                      <article className={shell}>{body}</article>
                    )}
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
