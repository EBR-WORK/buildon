import type { Metadata } from "next";
import Image from "next/image";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { clientelePage, site } from "@/lib/content";

const totalLogos = clientelePage.cities.reduce((n, city) => n + city.logos.length, 0);

// Built from the page's own banner copy plus the city list, now that there is
// no standing intro paragraph to lift.
const description = `${clientelePage.banner.headingLines.join(" ")} ${totalLogos} clients across ${clientelePage.cities
  .map((city) => city.name)
  .join(", ")}.`;

export const metadata: Metadata = {
  title: clientelePage.title,
  description,
  alternates: { canonical: "/clientele" },
  openGraph: {
    type: "website",
    url: `${site.url}/clientele/`,
    title: `${clientelePage.title} | ${site.name}`,
    description,
  },
};

/**
 * The reference lists its clients city by city, one logo grid per city. Each
 * city is a section here so the headings form a real outline, and the logos sit
 * on white tiles to keep the many different backgrounds from clashing.
 */
export default function ClientelePage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageBanner
          image={clientelePage.banner.image}
          headingLines={clientelePage.banner.headingLines}
        />

        {clientelePage.cities.map((city, cityIndex) => (
          <section
            key={city.name}
            className={`section-y border-t border-line ${
              cityIndex % 2 === 0 ? "bg-surface" : ""
            }`}
          >
            <div className="container-page">
              <Reveal>
                <SectionHeading title={city.name} align="center" />
              </Reveal>

              {/* Four across at lg, in the reference's own order. The delay
                  follows the position within each row, so a row sweeps in left
                  to right rather than all four landing together. */}
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {city.logos.map((logo, i) => (
                  <Reveal
                    as="li"
                    key={`${city.name}-${logo.src}`}
                    delay={(i % 4) * 0.06}
                    className="flex h-24 items-center justify-center rounded-xl border border-line bg-white p-4 transition hover:border-brand-200 hover:shadow-card sm:h-28 sm:p-5"
                  >
                    <Image
                      src={logo.src}
                      alt={logo.name ? `${logo.name} — Buildon client` : "Client of Buildon Plasters"}
                      width={200}
                      height={90}
                      loading="lazy"
                      className="max-h-full w-auto object-contain mix-blend-multiply"
                    />
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <p className="sr-only">
          {totalLogos} client logos across {clientelePage.cities.length} cities.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
