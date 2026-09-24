import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { projectsPage, site } from "@/lib/content";
import CtaLink from "@/components/CtaLink";
import {
  getProjectDetail,
  projectDetails,
  projectHref,
  projectPostsWidget,
} from "@/lib/projectDetails";

/**
 * /projects/<slug> — one template for every project page.
 *
 * The reference builds each of these as its own Elementor page at the site
 * root, but they all carry the same three things: a heading, a photograph and
 * a few paragraphs. So this is a single template driven by projectDetails.ts,
 * and a new project needs content only, no code.
 *
 * The reference hangs a "Posts" widget down the left of each page — its body
 * class is themetechmount-sidebar-left — so that rail is here too, carried by
 * projectPostsWidget. Below lg there is no room for two columns, and the
 * project is what the visitor came for, so it drops under the copy rather than
 * ahead of it.
 */

export function generateStaticParams() {
  return projectDetails.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectDetail(slug);
  if (!project) return {};

  const description = project.paragraphs[0].slice(0, 155);
  return {
    title: project.name,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "website",
      url: `${site.url}/projects/${project.slug}/`,
      title: `${project.name} | ${site.name}`,
      description,
      images: [`${site.url}${project.image}`],
    },
  };
}

/**
 * Three other developments to close the page with.
 *
 * Walking the listing from this project and taking the next three would mostly
 * turn up projects whose pages are not transcribed yet, which land as dead
 * cards. So the ones that HAVE pages come first — every card in the row is then
 * a real link — and the listing tops the row up in order only if there are
 * fewer than three of those. That second branch disappears on its own as the
 * remaining projects are added.
 */
function otherProjects(name: string) {
  const items = projectsPage.items;
  const index = Math.max(
    0,
    items.findIndex((project) => project.name === name),
  );

  /* From this project forward, wrapping, so consecutive pages do not all show
     the same three. */
  const rotated = items.map((_, step) => items[(index + step + 1) % items.length]);

  const picked = rotated.filter((project) => projectHref(project.name));
  for (const project of rotated) {
    if (picked.length >= 3) break;
    if (!picked.includes(project)) picked.push(project);
  }

  return picked.slice(0, 3);
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectDetail(slug);
  if (!project) notFound();

  const related = otherProjects(project.name);

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* The reference gives project pages no artwork of their own, so they
            share the listing's banner — the same titlebar the visitor just came
            through, now carrying this development's name. */}
        <PageBanner
          image={projectsPage.banner.image}
          headingLines={[project.title]}
          narrowHeading
        />

        <section className="section-y">
          <div className="container-page">
            {/* The reference splits this row 3/9 — col-md-3 rail, col-md-9 body. */}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-12">
              {/* Posts — the reference's left rail. Sticky on desktop so it
                  stays put down a long project page; in normal flow under the
                  copy on anything narrower. */}
              <Reveal as="aside" className="order-last lg:order-first">
                <div className="lg:sticky lg:top-28">
                  <h2 className="font-display text-xl font-semibold text-ink-900">
                    {projectPostsWidget.title}
                  </h2>

                  {/* The reference's own widget, hover included: each row is a
                      block link with a 5px skin-coloured bar pinned to its left
                      edge, height 0 at the vertical centre, growing to the full
                      row on hover — hence the paired bottom/height transition
                      rather than a scaleY, which would stretch from one end.
                      Timing, easing and the 6% drop shadow are the theme's. */}
                  <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
                    {projectPostsWidget.items.map((post) => (
                      <li key={post.title} className="border-t border-line first:border-t-0">
                        {/* Empty href until each city page exists — CtaLink
                            renders those as inert buttons, never <a href="">. */}
                        <CtaLink
                          href={post.href}
                          className="relative block w-full cursor-pointer px-6 py-5 text-left font-display text-[15px] leading-snug font-medium text-ink-700 transition-all duration-300 ease-linear hover:text-brand-500 hover:shadow-[0_20px_20px_0_rgba(0,0,0,0.06)] before:absolute before:bottom-1/2 before:left-0 before:h-0 before:w-[5px] before:bg-brand-500 before:transition-all before:duration-300 before:[transition-timing-function:cubic-bezier(.645,.045,.355,1)] hover:before:bottom-0 hover:before:h-full"
                        >
                          {post.title}
                        </CtaLink>
                      </li>
                    ))}
                  </ul>

                  <CtaLink
                    href={projectPostsWidget.viewMore.href}
                    className="mt-4 inline-flex items-center text-sm font-semibold text-brand-500 transition hover:text-brand-600"
                  >
                    {projectPostsWidget.viewMore.label}
                  </CtaLink>
                </div>
              </Reveal>

              {/* The project itself, in the reference's order: heading, then
                  the photograph, then the copy. */}
              <div>
                <Reveal>
                  <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
                    {project.title}
                  </h1>
                </Reveal>

                <Reveal delay={0.06}>
                  {/* Capped well under the 3/4 column's width: uncapped it
                      filled the column and pushed the copy it illustrates off
                      the bottom of the screen. A picture whose original is
                      narrower than the cap stops at its own width instead of
                      being stretched to it — three of the reference's are
                      300px files with nothing larger upstream. */}
                  <div
                    className="relative mt-6 aspect-[750/569] max-w-[34rem] overflow-hidden rounded-2xl bg-surface shadow-card"
                    style={{
                      ...(project.imageWidth ? { maxWidth: `${project.imageWidth}px` } : {}),
                      ...(project.imageWidth && project.imageHeight
                        ? { aspectRatio: `${project.imageWidth} / ${project.imageHeight}` }
                        : {}),
                    }}
                  >
                    <Image
                      src={project.image}
                      alt={`${project.name} — built with Buildon gypsum plaster`}
                      fill
                      sizes={`(min-width: 1024px) ${project.imageWidth ?? 544}px, 92vw`}
                      priority
                      className="object-cover"
                    />
                  </div>
                </Reveal>

                <Reveal delay={0.12}>
                  <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink-500 sm:text-base">
                    {project.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* More Projects */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                title="More Projects"
                intro="Other developments built with Buildon gypsum."
                align="center"
              />
            </Reveal>

            <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {related.map((item, i) => {
                const href = projectHref(item.name);
                /* Only the projects whose pages are transcribed link out; the
                   rest stay plain cards rather than dead links. */
                const card = (
                  <>
                    <div className="relative aspect-4/3 overflow-hidden bg-surface">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-7">
                      <h3 className="font-display text-lg leading-snug font-semibold transition-colors group-hover:text-brand-500 sm:text-xl">
                        {item.name}
                      </h3>
                      <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-ink-500 line-clamp-4">
                        {item.body}
                      </p>
                      {/* Display only: the card itself is the link, so this is
                          the reference's affordance without a second tab stop
                          or a link screen readers would announce as "Read More"
                          instead of the product's name. */}
                      <span
                        aria-hidden
                        className="mt-4 inline-flex items-center self-start text-sm font-semibold text-brand-500 transition group-hover:text-brand-600 sm:mt-5"
                      >
                        {projectsPage.readMore}
                      </span>
                    </div>
                  </>
                );

                const shell = "flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-card";

                return (
                  <Reveal as="li" key={item.name} delay={Math.min(i, 2) * 0.08} className="flex">
                    {href ? (
                      <Link
                        href={href}
                        className={`group ${shell} transition hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none`}
                      >
                        {card}
                      </Link>
                    ) : (
                      <div className={shell}>{card}</div>
                    )}
                  </Reveal>
                );
              })}
            </ul>

            <div className="mt-10 text-center">
              <Link
                href="/projects"
                className="inline-flex items-center rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                View all projects
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
