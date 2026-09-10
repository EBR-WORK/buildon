import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { productCatalogue, products, productsPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: productsPage.title,
  description: `${productsPage.heading} ${products.intro}`,
  alternates: { canonical: "/products" },
  openGraph: {
    type: "website",
    url: `${site.url}/products/`,
    title: `${productsPage.title} | ${site.name}`,
    description: productsPage.heading,
  },
};

/**
 * The reference runs this page without a title bar: the heading sits straight
 * under the header, then every product in a three-up grid.
 *
 * Cards are a grid rather than the home page's carousel — nine products is a
 * catalogue to browse, not a row to page through.
 */
export default function ProductsPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="section-y">
          <div className="container-page">
            <Reveal>
              <SectionHeading title={productsPage.heading} align="center" />
              <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-ink-500">
                {products.intro}
              </p>
            </Reveal>

            <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:mt-14 lg:grid-cols-3">
              {productCatalogue.map((product, i) => (
                <Reveal
                  as="li"
                  key={product.name}
                  delay={Math.min(i % 3, 2) * 0.08}
                  className="flex"
                >
                  <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-lift">
                    <div className="relative aspect-4/3 overflow-hidden bg-white">
                      <Image
                        src={product.image}
                        alt={`${product.name} — Buildon packaging`}
                        fill
                        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                        loading={i < 3 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h2 className="text-xl leading-snug font-semibold sm:text-2xl">
                        {product.name}
                      </h2>
                      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-500 sm:mt-2.5">
                        {product.body}
                      </p>
                      <button
                        suppressHydrationWarning
                        type="button"
                        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 self-start text-sm font-semibold text-brand-500 transition hover:text-brand-600 sm:mt-5"
                      >
                        {products.readMore}
                      </button>
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
