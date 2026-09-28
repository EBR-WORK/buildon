import type { Metadata } from "next";
import { Suspense } from "react";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SearchBox from "@/components/SearchBox";
import SearchResults from "@/components/SearchResults";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { blogPage, site } from "@/lib/content";

/**
 * /search — the reference's search results page.
 *
 * It searches from /?s=<term> and returns one page grouped into Page, Post and
 * Product results. WordPress runs that query on the server; this site is a
 * static export, so the same grouping is produced in the browser from the
 * content already shipped. The route is /search?q= rather than /?s= because the
 * home page here is a prerendered file, not a template a query can re-render.
 *
 * Not indexed: a results page has no content of its own, and every page it can
 * return is already in the sitemap.
 */

export const metadata: Metadata = {
  title: "Search",
  description: "Search the products, projects and blog posts on buildon.co.in.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: `${site.url}/search/`,
    title: `Search | ${site.name}`,
  },
};

export default function SearchPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* No artwork of its own on the reference either — it reuses a titlebar
            and puts the term in the heading. */}
        <PageBanner image={blogPage.banner.image} headingLines={["Search Results"]} narrowHeading />

        <section className="section-y">
          <div className="container-page max-w-4xl">
            <Reveal>
              {/* useSearchParams opts its subtree out of prerendering, so the
                  box is rendered outside any boundary that depends on it. */}
              <SearchBox className="mb-10" autoFocus />
            </Reveal>

            <Suspense fallback={null}>
              <SearchResults />
            </Suspense>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
