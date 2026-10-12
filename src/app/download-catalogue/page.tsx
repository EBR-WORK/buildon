import { statSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { DownloadIcon, FolderIcon } from "@/components/icons";
import { cataloguePage, site } from "@/lib/content";
import { productDetails } from "@/lib/productDetails";

export const metadata: Metadata = {
  title: cataloguePage.title,
  description: cataloguePage.intro,
  alternates: { canonical: "/download-catalogue" },
  openGraph: {
    type: "website",
    url: `${site.url}/download-catalogue/`,
    title: `${cataloguePage.title} | ${site.name}`,
    description: cataloguePage.intro,
  },
};

/**
 * Where the footer's "Download Catalogue" goes.
 *
 * It used to go to /faq, which has no catalogue on it at all. The sheets were
 * already in the repository — six PDFs under public/products/ — but the only
 * way to reach one was to find its product page first and scroll to the bottom.
 *
 * The grid is a folder of files, as the reference draws it: identical tiles,
 * each one a wallet with the product's name under it. A photograph of the
 * product would be the wrong promise here — the tile opens a PDF, not a
 * product page, and the two already exist side by side under /products.
 */

/**
 * Read at build time from the file itself.
 *
 * A size written into the content would be a second copy of a fact the file
 * already states, and the one that goes stale the first time a sheet is
 * replaced. There is no server at request time, so this runs once, during the
 * build, and the number is baked into the HTML.
 */
function sizeOf(href: string) {
  try {
    const bytes = statSync(join(process.cwd(), "public", href)).size;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  } catch {
    /* A missing file is a broken link, not a broken build — the <a> below
       still renders and the 404 is the honest signal. */
    return null;
  }
}

const sheets = productDetails
  .filter((product) => product.catalogue)
  .map((product) => ({
    slug: product.slug,
    name: product.name,
    href: product.catalogue!.href,
    size: sizeOf(product.catalogue!.href),
  }));

export default function DownloadCataloguePage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="section-y">
          <div className="container-page">
            {/* Breadcrumbs, as the reference opens: the grid is a folder of
                files, and a folder is only legible once you can see where it
                sits. Separators are drawn with a border rather than typed, so
                they are not read out between every link. */}
            <nav aria-label="Breadcrumb" className="mb-8 sm:mb-10">
              <ol className="flex flex-wrap items-center text-sm">
                {[
                  { label: "Home", href: "/" },
                  { label: "Products", href: "/products" },
                ].map((crumb) => (
                  <li key={crumb.href} className="border-r border-line pr-3 last:border-0">
                    <Link
                      href={crumb.href}
                      className="pr-0 text-ink-500 transition hover:text-brand-500"
                    >
                      {crumb.label}
                    </Link>
                  </li>
                ))}
                <li className="pl-3 font-medium text-ink-900" aria-current="page">
                  {cataloguePage.title}
                </li>
              </ol>
            </nav>

            <Reveal>
              <SectionHeading
                title={cataloguePage.heading}
                intro={cataloguePage.intro}
                align="center"
              />
            </Reveal>

            {/* Four up, as the reference, on a fixed row height: a folder grid
                is a set of identical things, and letting each tile size itself
                to its own label would undo exactly that. */}
            <ul className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5 lg:mt-14 lg:grid-cols-4 lg:gap-[30px]">
              {sheets.map((sheet, i) => (
                <Reveal as="li" key={sheet.slug} delay={Math.min(i % 4, 3) * 0.06} className="flex">
                  <a
                    href={sheet.href}
                    target="_blank"
                    rel="noopener"
                    className="group flex h-[200px] w-full cursor-pointer flex-col items-center justify-center bg-surface px-5 py-6 text-center transition hover:bg-line/40 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-[250px]"
                  >
                    <FolderIcon className="h-auto w-[38%] transition-transform duration-300 group-hover:-translate-y-1 sm:w-1/2" />

                    {/* The rule under the label is the reference's, and it is
                        what makes a tile read as a labelled folder rather than
                        a picture with a caption. */}
                    <span className="mt-2.5 w-full border-b-2 border-line pb-1">
                      <span className="block text-xs leading-[17px] font-semibold uppercase transition-colors group-hover:text-brand-500 sm:text-base sm:leading-[22px]">
                        {sheet.name}
                      </span>
                    </span>

                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition group-hover:text-brand-500">
                      <DownloadIcon className="size-3.5" />
                      PDF
                      {/* The weight before the press, not after it: these run
                          from 0.9 MB to 5.1 MB, which matters on a phone. */}
                      {sheet.size && <span className="font-normal">{sheet.size}</span>}
                    </span>
                  </a>
                </Reveal>
              ))}
            </ul>

            <Reveal className="mt-10 text-center sm:mt-12">
              <p className="text-[15px] text-ink-500">
                {cataloguePage.rest}{" "}
                <Link
                  href={cataloguePage.restCta.href}
                  className="font-semibold text-brand-500 transition hover:text-brand-600"
                >
                  {cataloguePage.restCta.label}
                </Link>
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
