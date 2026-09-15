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
                    className="flex h-28 items-center justify-center rounded-xl border border-line bg-white p-3 transition hover:border-brand-200 hover:shadow-card sm:h-32 sm:p-4"
                  >
                    {/* These logos are almost all taller than 2:1, so height is
                        what limits them, not the tile's width — they already
                        sit in spare width. The tile is taller and its padding
                        tighter, which lifts the room they have from 64 to 88px
                        on phones and 72 to 96px above that, at the same tile
                        width.

                        max-w-full is the guard for the other direction: a few
                        logos run 3:1, and with only max-h-full they would spill
                        past the tile once the height allowance grew.

                        Each logo declares its own pixels. Sharing one 200x90
                        shape capped every logo at 90px tall and, on narrow
                        tiles where width binds first, letterboxed the artwork
                        inside a box wider than itself — costing height exactly
                        where there was least of it. */}
                    <Image
                      src={logo.src}
                      alt={logo.name ? `${logo.name} — Buildon client` : "Client of Buildon Plasters"}
                      width={logo.width}
                      height={logo.height}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
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
