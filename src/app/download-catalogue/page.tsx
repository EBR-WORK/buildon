import { statSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { DownloadIcon, PdfIcon } from "@/components/icons";
import { cataloguePage, productCatalogue, site } from "@/lib/content";

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
 * Weigh a file in public/, or null when it is not there.
 *
 * The convention is the whole mechanism: a product's sheet lives at
 * `public/products/<slug>/catalogue.pdf`, a standalone document in
 * `public/catalogues/`. Dropping a file in puts it on this page, with no line
 * to add anywhere. A path written into the content would be a second statement
 * of what the filesystem already knows, and the one that goes stale the day
 * somebody adds a PDF and forgets the code.
 *
 * The size is read off the file for the same reason. There is no server at
 * request time, so both happen once, during the build.
 */
function fileAt(href: string) {
  try {
    const bytes = statSync(join(process.cwd(), "public", href)).size;
    return { href, size: `${(bytes / 1_048_576).toFixed(1)} MB` };
  } catch {
    /* Dropped rather than rendered: a tile that opens nothing is not a file,
       however it is styled. */
    return null;
  }
}

/**
 * Every document, in one grid.
 *
 * Product sheets first, in catalogue order, then the ones that belong to no
 * single product. They were two lists for a while — a grid and a row below it
 * — on the reasoning that a master brochure answers a different question from
 * a product sheet. It does, but not differently enough to be somewhere else:
 * somebody looking for a PDF wants to see the PDFs.
 */
const sheets = [
  ...productCatalogue.map((product) => ({
    key: product.slug,
    name: product.name,
    file: fileAt(`/products/${product.slug}/catalogue.pdf`),
  })),
  ...cataloguePage.brochures.map((entry) => ({
    key: entry.file,
    name: entry.name,
    file: fileAt(`/catalogues/${entry.file}`),
  })),
].filter((item) => item.file !== null);

const missing = productCatalogue.length - sheets.filter((i) => !i.key.includes(".")).length;

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
              {sheets.map((item, i) => (
                <Reveal as="li" key={item.key} delay={Math.min(i % 4, 3) * 0.06} className="flex">
                  {/* A plain <a> for a file, not <Link>: prefetching a route is
                      cheap, and prefetching a 12 MB PDF for a tile nobody has
                      pressed is not. */}
                  <a
                    href={item.file!.href}
                    target="_blank"
                    rel="noopener"
                    className="group flex h-[200px] w-full cursor-pointer flex-col items-center justify-center bg-surface px-5 py-6 text-center transition hover:bg-line/40 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-[250px]"
                  >
                    {/* Sized by height, not width: the page is portrait, and
                        a width of half the tile would make it taller than the
                        tile is. */}
                    <PdfIcon className="h-[46%] w-auto transition-transform duration-300 group-hover:-translate-y-1 sm:h-[52%]" />

                    {/* The rule under the label is the reference's, and it is
                        what makes a tile read as a labelled folder rather than
                        a picture with a caption. */}
                    <span className="mt-2.5 w-full border-b-2 border-line pb-1">
                      <span className="block text-xs leading-[17px] font-semibold uppercase transition-colors group-hover:text-brand-500 sm:text-base sm:leading-[22px]">
                        {item.name}
                      </span>
                    </span>

                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition group-hover:text-brand-500">
                      <DownloadIcon className="size-3.5" />
                      PDF
                      {/* The weight before the press, not after it: these run
                          from 0.9 MB to 12.5 MB, which matters on a phone. */}
                      <span className="font-normal">{item.file!.size}</span>
                    </span>
                  </a>
                </Reveal>
              ))}
            </ul>

            {missing > 0 && (
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
            )}

          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
