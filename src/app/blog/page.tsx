import type { Metadata } from "next";
import Image from "next/image";
import CtaLink from "@/components/CtaLink";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { blogPage, site } from "@/lib/content";

const description = blogPage.items
  .slice(0, 3)
  .map((post) => post.title)
  .join(". ");

export const metadata: Metadata = {
  title: blogPage.title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${site.url}/blog/`,
    title: `${blogPage.title} | ${site.name}`,
    description,
  },
};

/**
 * The blog listing, three-up as on the reference, with the square artwork it
 * uses for every post.
 *
 * There are no post pages yet, so a card is a plain <article> rather than a
 * link — nothing here navigates. When the posts are built, the card body
 * becomes the anchor and the excerpts get their "Read more" back.
 */
export default function BlogPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageBanner
          image={blogPage.banner.image}
          headingLines={blogPage.banner.headingLines}
        />

        <section className="section-y">
          <div className="container-page">
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {blogPage.items.map((post, i) => (
                <Reveal as="li" key={post.title} delay={(i % 3) * 0.06} className="flex">
                  <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-lift">
                    {/* Square, as the reference crops them */}
                    <div className="relative aspect-square overflow-hidden bg-surface">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                        loading={i < 3 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h2 className="font-display text-lg leading-snug font-semibold transition-colors group-hover:text-brand-500 sm:text-xl">
                        {post.title}
                      </h2>
                      {/* Clamped so a long excerpt cannot stretch its row of
                          cards past the others. */}
                      <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-ink-500 line-clamp-5">
                        {post.excerpt}
                      </p>
                      <CtaLink
                        href={post.href}
                        className="mt-4 inline-flex cursor-pointer items-center self-start text-sm font-semibold text-brand-500 transition hover:text-brand-600 sm:mt-5"
                      >
                        {blogPage.readMore}
                      </CtaLink>
                    </div>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
