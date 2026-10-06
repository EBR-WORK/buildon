import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SearchBox from "@/components/SearchBox";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { site } from "@/lib/content";

/**
 * The 404 page.
 *
 * The reference's is a bare line of text — "This page may have been moved or
 * deleted. Be sure to check your spelling." — above a search box, with no way
 * back into the site. Its wording is kept, but a reader who has hit a dead end
 * is given the search box AND the places they were most likely heading, rather
 * than being left to guess a URL.
 *
 * Next writes this out as 404.html in a static export, which is the file a
 * host serves for an unknown path.
 */

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page may have been moved or deleted.",
  robots: { index: false, follow: true },
};

const destinations = [
  { label: "Products", href: "/products", body: "The nine gypsum plasters and bonding agents." },
  { label: "Projects", href: "/projects", body: "Developments built with Buildon gypsum." },
  { label: "Blog", href: "/blog", body: "Guides on plastering, materials and application." },
  { label: "Contact Us", href: "/contact-us", body: "Offices, phone numbers and an enquiry form." },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* <PageBanner image={blogPage.banner.image} /> */}

        <section className="section-y">
          <div className="container-page max-w-3xl text-center">
            <Reveal>
              <p className="font-display text-[clamp(3rem,8vw+1rem,5.5rem)] leading-none font-semibold text-brand-500">
                404
              </p>

              <h1 className="mt-4 font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold text-ink-900">
                Page not found
              </h1>

              {/* The reference's own wording. */}
              <p className="mt-4 text-[15px] leading-relaxed text-ink-500 sm:text-base">
                This page may have been moved or deleted. Be sure to check your spelling.
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="mx-auto mt-8 max-w-md">
                <SearchBox id="not-found-search" />
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <ul className="mt-10 grid gap-4 text-left sm:mt-12 sm:grid-cols-2">
                {destinations.map((item) => (
                  <li key={item.href} className="flex">
                    <Link
                      href={item.href}
                      className="group w-full rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-6"
                    >
                      <span className="block font-display text-lg leading-snug font-semibold transition-colors group-hover:text-brand-500">
                        {item.label}
                      </span>
                      <span className="mt-1.5 block text-[15px] leading-relaxed text-ink-500">
                        {item.body}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Back to home
                </Link>
                <a
                  href={site.primaryPhoneHref}
                  className="inline-flex items-center rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
                >
                  {site.callUs}
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
