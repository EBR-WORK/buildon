import type { Metadata } from "next";
import BlogCards from "@/components/BlogCards";
import PageBanner from "@/components/PageBanner";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
/* The banner stays in content.ts — page furniture, not content an editor
   changes. The cards come from the published posts. */
import { blogPage, site } from "@/lib/content";
import { publishedBlog } from "@/lib/cms/published";

const description = publishedBlog.cards
  .slice(0, 3)
  .map((post) => post.title)
  .join(". ");

export const metadata: Metadata = {
  title: publishedBlog.title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${site.url}/blog/`,
    title: `${publishedBlog.title} | ${site.name}`,
    description,
  },
};

/**
 * The blog listing, three-up as on the reference, with the square artwork it
 * uses for every post.
 *
 * A card is the whole link once its post is transcribed in blogDetails.ts, and
 * a plain <article> until then, so nothing here is ever a dead link.
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
            {/* No rail on the listing: the whole blog is already on this page,
                so search, categories and tags only take a reader away from what
                they came to browse. The post pages carry all three. */}
            <BlogCards items={publishedBlog.cards} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
